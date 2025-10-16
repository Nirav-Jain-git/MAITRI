# AI Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    pkg-config \
    libopencv-dev \
    python3-opencv \
    libasound2-dev \
    portaudio19-dev \
    espeak \
    espeak-data \
    libespeak-dev \
    ffmpeg \
    libsm6 \
    libxext6 \
    libfontconfig1 \
    libxrender1 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p /app/models /app/logs

# Download and set up models (placeholder)
RUN mkdir -p /app/models && \
    echo "Model files would be downloaded here in production" > /app/models/README.txt

# Set permissions
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Start the application
CMD ["python", "app.py"]