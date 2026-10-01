# Use Docker so the ~500 MB faster-whisper model is baked at build time.
# Render free: 2 GB image limit, no persistent disk needed.
# Build once (~5 min), cold starts are instant — model is already in the image.

FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HF_HOME=/models \
    STT_MODEL=small \
    STT_DEVICE=cpu \
    STT_COMPUTE=int8

# System deps for faster-whisper/ctranslate2 + audio decode
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer cached)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the model into the image (layer cached)
# This is the key step: ~500 MB downloaded at BUILD time, not runtime
RUN python -c "
from faster_whisper import WhisperModel
import os
model = WhisperModel(
    os.getenv('STT_MODEL', 'small'),
    device=os.getenv('STT_DEVICE', 'cpu'),
    compute_type=os.getenv('STT_COMPUTE', 'int8'),
    download_root='/models'
)
print('Model cached at', '/models')
"

# Copy app
COPY . .

# Default port (Render injects PORT, server.py reads it)
EXPOSE 8765

CMD ["python", "server.py"]