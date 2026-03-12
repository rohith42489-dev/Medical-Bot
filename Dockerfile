# --- Build Stage (Optional but good for cleanup) ---
FROM python:3.10-slim AS builder

# Set build-time environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install build dependencies if needed (none currently for these packages)
# RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

# Install dependencies to a local directory
COPY requirements.txt .
RUN pip install --user -r requirements.txt


# --- Final Stage ---
FROM python:3.10-slim

# Set runtime environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000 \
    PATH="/root/.local/bin:$PATH"

WORKDIR /app

# Copy installed dependencies from builder
COPY --from=builder /root/.local /root/.local

# Copy application source code
# We use a .dockerignore to exclude node_modules, frontend/, etc.
COPY . .

# Ensure necessary directories exist
RUN mkdir -p Data MasterData static templates

# Expose the application port
EXPOSE 5000

# Use a non-root user for security (optional but recommended)
# RUN useradd -m appuser && chown -R appuser:appuser /app
# USER appuser

# Healthcheck to verify the container is running
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:5000/ || exit 1

# Launch the application
CMD ["python", "app.py"]
