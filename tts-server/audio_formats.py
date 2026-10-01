"""
Audio format conversion for TTS output.

edge-tts only emits 24 kHz / 48 kbps mono MP3, so WAV and FLAC are produced by
decoding that MP3 and re-encoding with libsndfile (soundfile).
"""

from __future__ import annotations

import io

FORMATS: dict[str, dict[str, str]] = {
    "mp3": {"ext": "mp3", "media_type": "audio/mpeg"},
    "wav": {"ext": "wav", "media_type": "audio/wav"},
    "wave": {"ext": "wav", "media_type": "audio/wav"},
    "flac": {"ext": "flac", "media_type": "audio/flac"},
}

DEFAULT_FORMAT = "mp3"
SAMPLE_RATE = 24000


def normalize_format(value: str | None) -> str:
    fmt = (value or DEFAULT_FORMAT).strip().lower().lstrip(".")
    return fmt if fmt in ("mp3", "wav", "flac") else DEFAULT_FORMAT


def converter_available() -> bool:
    try:
        import soundfile  # noqa: F401
    except ImportError:
        return False
    return True


def available_formats() -> list[str]:
    formats = ["mp3"]
    if converter_available():
        formats += ["wav", "flac"]
    return formats


def convert(mp3_bytes: bytes, fmt: str = DEFAULT_FORMAT) -> tuple[bytes, str, str]:
    """Return (data, media_type, extension) for the requested format."""
    meta = FORMATS[normalize_format(fmt)]
    if meta["ext"] == "mp3":
        return mp3_bytes, meta["media_type"], meta["ext"]

    import soundfile as sf

    samples, sample_rate = sf.read(io.BytesIO(mp3_bytes), dtype="int16")
    if samples.ndim > 1:
        samples = samples[:, 0]
    if sample_rate != SAMPLE_RATE:
        samples = _resample(samples, sample_rate, SAMPLE_RATE)
        sample_rate = SAMPLE_RATE

    out = io.BytesIO()
    sf.write(out, samples, sample_rate, format="WAV" if meta["ext"] == "wav" else "FLAC", subtype="PCM_16")
    return out.getvalue(), meta["media_type"], meta["ext"]


def _resample(samples, source_rate: int, target_rate: int):
    """Linear resample, good enough for 24 kHz -> 24 kHz style conversions."""
    import numpy as np

    if source_rate == target_rate or samples.size == 0:
        return samples
    duration = samples.shape[0] / source_rate
    target_length = max(1, int(round(duration * target_rate)))
    source_positions = np.linspace(0, samples.shape[0] - 1, num=samples.shape[0], dtype=np.float64)
    target_positions = np.linspace(0, samples.shape[0] - 1, num=target_length, dtype=np.float64)
    return np.interp(target_positions, source_positions, samples).astype(samples.dtype)
