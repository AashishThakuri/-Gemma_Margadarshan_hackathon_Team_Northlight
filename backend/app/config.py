from __future__ import annotations

import os
from dataclasses import dataclass


def _env_int(name: str, default: int) -> int:
    value = int(os.getenv(name, str(default)))
    if value <= 0:
        raise ValueError(f"{name} must be greater than zero")
    return value


@dataclass(frozen=True)
class Settings:
    base_model: str
    adapter_model: str
    max_upload_mb: int
    chunk_seconds: int
    allowed_origins: tuple[str, ...]
    skip_model_load: bool

    @classmethod
    def from_env(cls) -> "Settings":
        origins = os.getenv(
            "VERSE_ALLOWED_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        )
        return cls(
            base_model=os.getenv(
                "VERSE_BASE_MODEL",
                "unsloth/gemma-4-e4b-it-unsloth-bnb-4bit",
            ),
            adapter_model=os.getenv(
                "VERSE_ADAPTER_MODEL",
                "Aashishhhhhhhh/verse-v2-nepali-maithili",
            ),
            max_upload_mb=_env_int("VERSE_MAX_UPLOAD_MB", 250),
            chunk_seconds=_env_int("VERSE_CHUNK_SECONDS", 25),
            allowed_origins=tuple(
                origin.strip() for origin in origins.split(",") if origin.strip()
            ),
            skip_model_load=os.getenv("VERSE_SKIP_MODEL_LOAD", "0") == "1",
        )

