"""Media storage service — file upload, hashing, metadata extraction."""

import asyncio
import hashlib
import io
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

import boto3
from botocore.exceptions import ClientError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging_config import logger
from app.models.complaints import MediaAsset

# Allowed MIME types for uploads (restricted strictly to pictures/images)
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/jpg", "image/pjpeg", "image/png", "image/webp", "image/gif",
    "image/heic", "image/heif",
}

# Mapping of verified MIME types to safe standard extensions
MIME_TO_EXTENSION = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/pjpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/heic": ".heic",
    "image/heif": ".heif",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

_s3_client_instance = None


def get_s3_client():
    """Lazily construct S3 client using IAM role or local credentials."""
    global _s3_client_instance
    if _s3_client_instance is None:
        _s3_client_instance = boto3.client("s3", region_name=settings.AWS_REGION)
    return _s3_client_instance


def _detect_mime_from_magic_bytes(header: bytes) -> Optional[str]:
    """Inspect the first bytes of a file to verify its true binary picture signature."""
    if not header:
        return None
    # JPEG: FF D8 FF
    if header.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    # PNG: 89 50 4E 47 0D 0A 1A 0A
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    # GIF: GIF87a or GIF89a
    if header.startswith(b"GIF87a") or header.startswith(b"GIF89a"):
        return "image/gif"
    # WebP: RIFF .... WEBP
    if len(header) >= 12 and header.startswith(b"RIFF") and header[8:12] == b"WEBP":
        return "image/webp"
    # HEIC/HEIF (iPhone camera): ISO box "ftyp" at offset 4 followed by the brand
    if len(header) >= 12 and header[4:8] == b"ftyp":
        brand = header[8:12]
        if brand in (b"heic", b"heix", b"hevc", b"hevx", b"heim", b"heis"):
            return "image/heic"
        if brand in (b"mif1", b"msf1", b"heif"):
            return "image/heif"
    return None


try:
    from PIL import Image as PILImage, ImageOps as PILImageOps
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    PILImage = None
    PILImageOps = None


def _compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class MediaStorageError(Exception):
    """Raised when the configured storage backend (S3) can't store an upload."""


def compress_image_bytes(file_data: bytes, mime_type: str, max_dim: int = 1600, quality: int = 78) -> Tuple[bytes, str]:
    """Compress high-resolution images to optimized JPEG format to prevent disk and S3 bloat."""
    if not PIL_AVAILABLE or len(file_data) < 250 * 1024 or PILImage is None:
        return file_data, mime_type

    try:
        img = PILImage.open(io.BytesIO(file_data))
        # Handle orientation if present
        if PILImageOps is not None:
            try:
                img = PILImageOps.exif_transpose(img)
            except Exception:
                pass

        # Convert palette/RGBA to RGB for standard JPEG
        if img.mode in ("RGBA", "LA", "P"):
            bg = PILImage.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            bg.paste(img, mask=img.split()[-1] if len(img.split()) == 4 else None)
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # Resize if dimensions exceed max_dim
        width, height = img.size
        if width > max_dim or height > max_dim:
            if width > height:
                new_width = max_dim
                new_height = int(height * (max_dim / width))
            else:
                new_height = max_dim
                new_width = int(width * (max_dim / height))
            img = img.resize((new_width, new_height), PILImage.Resampling.LANCZOS)

        output_io = io.BytesIO()
        img.save(output_io, format="JPEG", quality=quality, optimize=True)
        compressed_bytes = output_io.getvalue()

        # Only use compressed version if it reduced size
        if len(compressed_bytes) < len(file_data):
            logger.info(
                "Image compressed: %s bytes -> %s bytes (%.1f%% reduction)",
                len(file_data), len(compressed_bytes),
                (1.0 - len(compressed_bytes) / len(file_data)) * 100
            )
            return compressed_bytes, "image/jpeg"
    except Exception as e:
        logger.warning("Image compression skipped due to error: %s", e)

    return file_data, mime_type


async def store_media(
    db: AsyncSession,
    file_data: bytes,
    file_name: str,
    mime_type: str,
    complaint_id: int,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    captured_at: Optional[datetime] = None,
) -> MediaAsset:
    """
    Store uploaded media permanently to AWS S3 (with local disk cache) and create metadata record.
    Enforces strict magic byte binary signature validation, automatic compression, and safe UUID-based file paths.
    """
    # 1. Size check
    if len(file_data) > MAX_FILE_SIZE:
        raise ValueError(f"File too large ({len(file_data)} bytes). Maximum size: {MAX_FILE_SIZE // (1024*1024)} MB")

    # 2. Magic byte verification
    header = file_data[:32]
    detected_mime = _detect_mime_from_magic_bytes(header)
    
    # Trust only the bytes: the client's Content-Type is attacker-controlled.
    effective_mime = detected_mime
    if effective_mime not in ALLOWED_MIME_TYPES:
        raise ValueError(f"File type '{mime_type}' (detected: '{detected_mime}') is not permitted.")

    # 3. Compress image if large to conserve bandwidth & S3 storage
    file_data, effective_mime = await asyncio.to_thread(compress_image_bytes, file_data, effective_mime)

    # 4. Generate secure UUID-based filename (never trust client filename directly for storage)
    extension = MIME_TO_EXTENSION.get(effective_mime, Path(file_name).suffix.lower() or ".jpg")
    if not extension.startswith("."):
        extension = f".{extension}"
    clean_display_name = Path(file_name).name.replace(" ", "_")
    media_uuid = uuid.uuid4().hex
    storage_filename = f"{media_uuid}{extension}"
    s3_key = f"complaints/{complaint_id}/{storage_filename}"
    s3_bucket = settings.EFFECTIVE_S3_BUCKET

    # 4. Compute hash
    checksum = _compute_sha256(file_data)

    # 5. Upload to AWS S3 bucket for permanent persistence across container restarts
    s3_uploaded = False
    if settings.S3_ENABLED:
        try:
            s3 = get_s3_client()
            await asyncio.to_thread(
                s3.put_object,
                Bucket=s3_bucket,
                Key=s3_key,
                Body=file_data,
                ContentType=effective_mime,
                Metadata={
                    "complaint_id": str(complaint_id),
                    "media_uuid": media_uuid,
                    "checksum_sha256": checksum,
                },
            )
            s3_uploaded = True
            logger.info("Media uploaded to S3: bucket=%s, key=%s", s3_bucket, s3_key)
        except Exception as s3_err:
            # Don't fall back to container disk: it's wiped on every deploy, so the photo would silently vanish.
            logger.error("S3 upload failed for complaint_id=%s, key=%s: %s", complaint_id, s3_key, s3_err)
            raise MediaStorageError("Photo storage is unavailable. Please try again later.") from s3_err

    # 6. Local disk cache (ephemeral container cache for sub-millisecond local reads)
    try:
        complaint_dir = Path(settings.MEDIA_STORAGE_PATH) / "complaints" / str(complaint_id)
        complaint_dir.mkdir(parents=True, exist_ok=True)
        file_path = complaint_dir / storage_filename
        with open(file_path, "wb") as f:
            f.write(file_data)
    except Exception as local_err:
        logger.warning("Local disk caching skipped: %s", local_err)

    # 7. Build storage URL
    storage_url = f"/storage/complaints/{complaint_id}/{storage_filename}"

    metadata_info = {
        "media_uuid": media_uuid,
        "s3_bucket": s3_bucket if s3_uploaded else None,
        "s3_key": s3_key if s3_uploaded else None,
        "checksum_sha256": checksum,
        "storage_backend": "s3" if s3_uploaded else "local",
    }

    # 8. Create DB record
    media = MediaAsset(
        storage_url=storage_url,
        file_name=clean_display_name,
        mime_type=effective_mime,
        file_size_bytes=len(file_data),
        checksum_sha256=checksum,
        latitude=latitude,
        longitude=longitude,
        captured_at=captured_at,
        uploaded_at=datetime.utcnow(),
        metadata_json=json.dumps(metadata_info),
    )
    db.add(media)
    await db.flush()
    logger.info(
        "Media stored: id=%s, complaint_id=%s, uuid=%s, mime=%s, size_bytes=%s, s3=%s",
        media.media_id,
        complaint_id,
        media_uuid,
        media.mime_type,
        media.file_size_bytes,
        s3_uploaded,
    )

    return media


def fetch_media_content(complaint_id: int, filename: str) -> Optional[Tuple[bytes, str]]:
    """
    Fetch media content by complaint_id and filename.
    Checks local container disk cache first. If missing (container died/restarted),
    fetches object from S3, populates local cache, and returns (bytes, content_type).
    """
    safe_filename = Path(filename).name
    local_path = Path(settings.MEDIA_STORAGE_PATH) / "complaints" / str(complaint_id) / safe_filename

    # 1. Local disk cache hit
    if local_path.is_file():
        try:
            with open(local_path, "rb") as f:
                content = f.read()
            # Guess mime from extension
            ext = local_path.suffix.lower()
            mime = next((m for m, e in MIME_TO_EXTENSION.items() if e == ext), "image/jpeg")
            return content, mime
        except Exception as e:
            logger.warning("Failed reading local cache file %s: %s", local_path, e)

    # 2. S3 fetch
    if not settings.S3_ENABLED:
        return None
    s3_bucket = settings.EFFECTIVE_S3_BUCKET
    s3_key = f"complaints/{complaint_id}/{safe_filename}"
    try:
        s3 = get_s3_client()
        resp = s3.get_object(Bucket=s3_bucket, Key=s3_key)
        content = resp["Body"].read()
        mime = resp.get("ContentType") or "image/jpeg"

        # Populate local disk cache for subsequent requests
        try:
            local_path.parent.mkdir(parents=True, exist_ok=True)
            with open(local_path, "wb") as f:
                f.write(content)
        except Exception:
            pass

        return content, mime
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
        if error_code in ("NoSuchKey", "404"):
            logger.warning("Media not found in S3 bucket %s key %s", s3_bucket, s3_key)
        else:
            logger.error("ClientError retrieving from S3 bucket %s key %s: %s", s3_bucket, s3_key, e)
        return None
    except Exception as e:
        logger.warning("Could not retrieve media from S3 key %s: %s", s3_key, e)
        return None


def delete_s3_media(complaint_id: int, filename: str) -> bool:
    """Delete an image object from S3 and local cache."""
    safe_filename = Path(filename).name
    s3_bucket = settings.EFFECTIVE_S3_BUCKET
    s3_key = f"complaints/{complaint_id}/{safe_filename}"
    
    # Remove local cache
    try:
        local_path = Path(settings.MEDIA_STORAGE_PATH) / "complaints" / str(complaint_id) / safe_filename
        if local_path.is_file():
            local_path.unlink()
    except Exception:
        pass

    # Remove from S3
    if not settings.S3_ENABLED:
        return True
    try:
        s3 = get_s3_client()
        s3.delete_object(Bucket=s3_bucket, Key=s3_key)
        logger.info("Deleted S3 media: bucket=%s, key=%s", s3_bucket, s3_key)
        return True
    except Exception as e:
        logger.warning("Failed to delete S3 object %s: %s", s3_key, e)
        return False

