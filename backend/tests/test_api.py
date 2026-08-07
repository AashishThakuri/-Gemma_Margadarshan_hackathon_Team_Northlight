from __future__ import annotations

import io
import os
import wave
from dataclasses import dataclass

import numpy as np

os.environ["VERSE_SKIP_MODEL_LOAD"] = "1"

from fastapi.testclient import TestClient

import app.main as main


@dataclass
class FakeResult:
    text: str = "परीक्षण क्याप्सन"
    duration_seconds: float = 1.0
    chunk_count: int = 1
    inference_seconds: float = 0.01


class FakeService:
    ready = True
    load_error = None

    def caption(self, audio, source_language, target_language):
        assert audio.dtype == np.float32
        assert source_language == "en"
        assert target_language == "ne"
        return FakeResult()


def make_wav() -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(16_000)
        output.writeframes(b"\x00\x00" * 16_000)
    return buffer.getvalue()


def test_health_reports_model_metadata() -> None:
    with TestClient(main.app) as client:
        main.app.state.model_service = FakeService()
        response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["model"] == "VERSE V2"
    assert response.json()["adapter"] == "Aashishhhhhhhh/verse-v2-nepali-maithili"


def test_caption_accepts_multipart_upload(monkeypatch) -> None:
    monkeypatch.setattr(main, "MODEL_SERVICE", FakeService())
    with TestClient(main.app) as client:
        response = client.post(
            "/api/caption",
            files={"file": ("sample.wav", make_wav(), "audio/wav")},
            data={"source_language": "en", "target_language": "ne"},
        )

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "source_language": "en",
        "target_language": "ne",
        "caption": "परीक्षण क्याप्सन",
        "duration_seconds": 1.0,
        "chunks": 1,
    }


def test_caption_rejects_invalid_language(monkeypatch) -> None:
    monkeypatch.setattr(main, "MODEL_SERVICE", FakeService())
    with TestClient(main.app) as client:
        response = client.post(
            "/api/caption",
            files={"file": ("sample.wav", make_wav(), "audio/wav")},
            data={"source_language": "fr", "target_language": "ne"},
        )

    assert response.status_code == 422


def test_caption_requires_one_media_source(monkeypatch) -> None:
    monkeypatch.setattr(main, "MODEL_SERVICE", FakeService())
    with TestClient(main.app) as client:
        response = client.post(
            "/api/caption",
            data={"source_language": "en", "target_language": "ne"},
        )

    assert response.status_code == 422

