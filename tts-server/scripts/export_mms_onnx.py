"""Export facebook/mms-tts-amh (VITS) to ONNX for the offline TTS engine.

mms-tts-amh has no official ONNX build and is a uroman model
(tokenizer_config: is_uroman=true), so the graph must be exported over
romanized token ids rather than Ethiopic codepoints. Text is romanized the same
way at inference time in tts_engines.mms_text_to_ids().

Output folder must contain model.onnx, vocab.json and meta.json; point
MMS_ONNX_PATH at it.

LICENSE: facebook/mms-tts-amh is CC-BY-NC 4.0 -> non-commercial, benchmark and
demo only. Not permitted for serving paying customers.

Usage (inside the Docker builder stage, or locally with torch installed):
    python scripts/export_mms_onnx.py <src_model_dir> <dst_dir>
"""

from __future__ import annotations

import json
import os
import sys

import torch


def main(src: str, dst: str) -> int:
    from transformers import VitsModel, VitsTokenizer

    tokenizer = VitsTokenizer.from_pretrained(src)
    model = VitsModel.from_pretrained(src)
    model.eval()

    ids = tokenizer("ሰላም")["input_ids"]
    print("uroman check:", repr(tokenizer.decode(ids)), ids)

    class Wrapper(torch.nn.Module):
        def __init__(self, m):
            super().__init__()
            self.m = m

        def forward(self, input_ids):
            return self.m(input_ids.long()).waveform

    wrapper = Wrapper(model).eval()
    os.makedirs(dst, exist_ok=True)

    torch.onnx.export(
        wrapper,
        torch.tensor([ids], dtype=torch.int64),
        os.path.join(dst, "model.onnx"),
        input_names=["input_ids"],
        output_names=["waveform"],
        dynamic_axes={"input_ids": {1: "T"}, "waveform": {1: "N"}},
        opset_version=17,
        dynamo=False,
    )

    # vocab.json is required at runtime to map graphemes -> token ids.
    import shutil

    vocab_src = os.path.join(src, "vocab.json")
    if os.path.isfile(vocab_src):
        shutil.copyfile(vocab_src, os.path.join(dst, "vocab.json"))
    else:
        with open(os.path.join(dst, "vocab.json"), "w", encoding="utf-8") as fh:
            json.dump(tokenizer.get_vocab(), fh, ensure_ascii=False, indent=2)

    meta = {
        "vocab_size": int(getattr(model.config, "vocab_size", 0) or 0),
        "sample_rate": int(getattr(model.config, "sampling_rate", 16000) or 16000),
        "romanize": True,
        "add_blank": True,
        "license": "CC-BY-NC 4.0 (facebook/mms-tts-amh) - non-commercial",
    }
    with open(os.path.join(dst, "meta.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, indent=2)

    size = os.path.getsize(os.path.join(dst, "model.onnx")) // (1024 * 1024)
    print(f"exported to {dst} ({size} MB) meta={meta}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1], sys.argv[2]))