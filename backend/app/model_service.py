from __future__ import annotations

import logging
import threading
from dataclasses import dataclass
from time import perf_counter

import numpy as np

from .audio import SAMPLE_RATE, combine_captions, split_audio
from .config import Settings
from .prompts import build_prompt

LOGGER = logging.getLogger("verse.model")


@dataclass(frozen=True)
class CaptionResult:
    text: str
    duration_seconds: float
    chunk_count: int
    inference_seconds: float


class VerseModelService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.model = None
        self.processor = None
        self.device = None
        self.load_error: str | None = None
        self._load_lock = threading.Lock()
        self._inference_lock = threading.Lock()

    @property
    def ready(self) -> bool:
        return self.model is not None and self.processor is not None

    def load(self) -> None:
        if self.ready or self.settings.skip_model_load:
            return

        with self._load_lock:
            if self.ready:
                return
            try:
                import torch
                import unsloth  # noqa: F401 - must precede Transformers/PEFT
                from peft import PeftModel
                from unsloth import FastModel

                if not torch.cuda.is_available():
                    raise RuntimeError("VERSE V2 requires an NVIDIA CUDA runtime")

                LOGGER.info("Loading VERSE V2 base model once at startup")
                base_model, processor = FastModel.from_pretrained(
                    model_name=self.settings.base_model,
                    max_seq_length=2048,
                    dtype=None,
                    load_in_4bit=True,
                )
                model = PeftModel.from_pretrained(
                    base_model,
                    self.settings.adapter_model,
                    is_trainable=False,
                )
                model.eval()
                self.model = model
                self.processor = processor
                self.device = next(model.parameters()).device
                self.load_error = None
                LOGGER.info("VERSE V2 model and adapter are ready")
            except Exception as error:
                self.load_error = str(error)
                LOGGER.exception("VERSE V2 failed to load")

    def _generate(self, audio: np.ndarray, prompt: str) -> str:
        if not self.ready:
            raise RuntimeError(self.load_error or "VERSE V2 is not ready")

        import torch

        conversation = [
            {
                "role": "user",
                "content": [
                    {"type": "audio", "audio": audio},
                    {"type": "text", "text": prompt},
                ],
            }
        ]
        inputs = self.processor.apply_chat_template(
            conversation,
            tokenize=True,
            add_generation_prompt=True,
            return_dict=True,
            return_tensors="pt",
        )
        inputs = {
            key: value.to(self.device) if hasattr(value, "to") else value
            for key, value in inputs.items()
        }
        prompt_length = inputs["input_ids"].shape[-1]
        with torch.inference_mode():
            generated = self.model.generate(
                **inputs,
                do_sample=False,
                max_new_tokens=256,
            )
        generated = generated[:, prompt_length:]
        text = self.processor.batch_decode(
            generated,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=True,
        )[0]
        return " ".join(text.strip().split())

    def caption(
        self,
        audio: np.ndarray,
        source_language: str,
        target_language: str,
    ) -> CaptionResult:
        prompt = build_prompt(source_language, target_language)
        chunks = split_audio(audio, self.settings.chunk_seconds)
        if not chunks:
            raise ValueError("The media file contains no readable audio")

        started = perf_counter()
        with self._inference_lock:
            parts = [self._generate(chunk, prompt) for chunk in chunks]
        elapsed = perf_counter() - started
        return CaptionResult(
            text=combine_captions(parts),
            duration_seconds=audio.size / SAMPLE_RATE,
            chunk_count=len(chunks),
            inference_seconds=elapsed,
        )

