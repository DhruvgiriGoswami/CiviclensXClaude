# --- Stage 1: Build Stage ---
FROM python:3.11-slim AS builder

# Build tools only for packages without a prebuilt wheel. GDAL/Fiona are gone, so no GIS libraries are needed.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    binutils \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# Install dependencies into a local user directory
RUN pip install --no-cache-dir --user -r requirements.txt

# Strip unneeded debug symbols from C extensions and clean bytecodes/test files
RUN find /root/.local -name "*.so" -exec strip --strip-unneeded {} + 2>/dev/null || true \
    && find /root/.local -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true \
    && find /root/.local -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true \
    && find /root/.local -type d -name "test" -exec rm -rf {} + 2>/dev/null || true


# --- Stage 2: Final Slim Runtime Stage ---
FROM python:3.11-slim AS runner

# Runtime shared libraries only (shapely ships its own GEOS in the wheel).
# upgrade picks up Debian security fixes newer than the base image (Trivy flagged zlib).
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    libpq5 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/* /tmp/*

# The base image's setuptools bundles old jaraco.context and wheel copies that Trivy flags HIGH.
RUN pip install --no-cache-dir --upgrade setuptools

ENV PYTHONUNBUFFERED=1
ENV PATH=/root/.local/bin:$PATH

ARG BUILD_COMMIT=unknown
ARG BUILD_TIME=unknown
ENV BUILD_COMMIT=${BUILD_COMMIT}
ENV BUILD_TIME=${BUILD_TIME}

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=builder /root/.local /root/.local

# Copy application source code
COPY . .

# Ensure storage directory exists
RUN mkdir -p /app/storage/complaints

EXPOSE 8000

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
