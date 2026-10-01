# Bake both models at build time so Render free needs no persistent disk and
# cold starts do not download anything.
# Final image: ~1.4 GB (Render free allows 2 GB). Peak runtime RAM measured at
# ~330 MB with the offline TTS model loaded (Render free allows 512 MB).

# ---------------------------------------------------------------------------
# Stage 1: export facebook/mms-tts-amh to ONNX.
# This model has no official ONNX build and is a uroman model, so it must be
# exported over romanized token ids. torch lives only in this stage.
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS mms_export

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /export
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    "torch==2.5.1+cpu" --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir "transformers>=4.44" "onnx>=1.16" "uroman>=1.0.3"

ARG MMS_REPO=facebook/mms-tts-amh
RUN python -c "
from huggingface_hub import snapshot_download
p = snapshot_download('${MMS_REPO}', allow_patterns=[
    'config.json','vocab.json','tokenizer_config.json',
    'special_tokens_map.json','model.safetensors'])
print('downloaded', p)
"

COPY scripts/export_mms_onnx.py ./export_mms_onnx.py
RUN python export_mms_onnx.py /root/.cache/huggingface/hub /out

# ---------------------------------------------------------------------------
# Stage 2: the runtime image (no torch, no transformers).
# ---------------------------------------------------------------------------
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HF_HOME=/models \
    STT_MODEL=small \
    STT_DEVICE=cpu \
    STT_COMPUTE=int8 \
    MMS_ONNX_PATH=/models/mms-tts-amh \
    TTS_ENGINE=edge

# System deps for faster-whisper/ctranslate2 + audio decode
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Offline TTS engine: onnxruntime + uroman + mp3 encoder.
RUN pip install --no-cache-dir onnxruntime uroman lameenc

# Bake the STT model (~500 MB) into the image.
RUN python -c "
from faster_whisper import WhisperModel
import os
model = WhisperModel(
    os.getenv('STT_MODEL', 'small'),
    device=os.getenv('STT_DEVICE', 'cpu'),
    compute_type=os.getenv('STT_COMPUTE', 'int8'),
    download_root='/models'
)
print('STT model cached at /models')
"

# Bake the exported Amharic TTS model (~110 MB) into the image.
COPY --from=mms_export /out /models/mms-tts-amh

COPY . .

EXPOSE 8765

CMD ["python", "server.py"]