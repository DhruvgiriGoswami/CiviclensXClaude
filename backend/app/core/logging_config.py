"""Production-grade logging configuration for AWS CloudWatch and local environments.

Suppresses routine 2xx HTTP access logs, OPTIONS CORS preflights, and /health checks,
while preserving WARNING/ERROR/CRITICAL events, detailed 5xx tracebacks, and concise
INFO events for important business operations (ticket creation, media uploads, lifecycle).
"""

import logging
import sys


class UvicornAccessFilter(logging.Filter):
    """Filter that suppresses routine 2xx, OPTIONS, and /health access logs from uvicorn.access."""

    def filter(self, record: logging.LogRecord) -> bool:
        # Standard uvicorn access record args: (client_addr, method, full_path, http_version, status_code)
        if record.args and len(record.args) >= 5:
            try:
                method = str(record.args[1]).upper()
                raw_path = str(record.args[2])
                status_code = int(record.args[4])

                # 1. Never log OPTIONS requests
                if method == "OPTIONS":
                    return False

                # 2. Never log successful /health requests
                path_only = raw_path.split("?")[0]
                if path_only in ("/health", "/healthz", "/api/v1/health") and status_code < 400:
                    return False

                # 3. Suppress routine 2xx successful responses
                if 200 <= status_code < 300:
                    return False

                # 4. Suppress benign 404s (browser favicon/robots). Boundary 404s stay visible: muting them hid a broken endpoint.
                if status_code == 404 and path_only in ("/favicon.ico", "/favicon.png", "/robots.txt"):
                    return False

                # 5. Pass through all other 4xx and 5xx failures
                return True
            except (IndexError, ValueError, TypeError):
                return True

        # Fallback string matching if record is pre-formatted
        msg = record.getMessage()
        if "OPTIONS " in msg:
            return False
        if "GET /health" in msg and (" 200 " in msg or " 200 OK" in msg):
            return False
        if "/favicon.ico" in msg and " 404 " in msg:
            return False
        if any(f" {code} " in msg for code in range(200, 300)):
            return False

        return True


def setup_logging(log_level: str = "INFO") -> None:
    """Initialize structured, CloudWatch-optimized logging configuration."""
    level = getattr(logging, log_level.upper(), logging.INFO)

    log_format = "%(asctime)s [%(levelname)s] [%(name)s]: %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    # Configure root logger
    logging.basicConfig(
        level=level,
        format=log_format,
        datefmt=date_format,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # Attach filter to uvicorn.access
    uvicorn_access = logging.getLogger("uvicorn.access")
    uvicorn_access.addFilter(UvicornAccessFilter())

    # Set appropriate levels for noisy third-party libraries
    logging.getLogger("uvicorn").setLevel(level)
    logging.getLogger("uvicorn.error").setLevel(level)
    logging.getLogger("fastapi").setLevel(level)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)

    # Application logger
    app_logger = logging.getLogger("civiclens")
    app_logger.setLevel(level)


logger = logging.getLogger("civiclens")
