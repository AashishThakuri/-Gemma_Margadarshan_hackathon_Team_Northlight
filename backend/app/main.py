from __future__ import annotations

import asyncio
import logging
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path
from time import perf_counter

import torch
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .audio import (
    MediaError,
    download_media_url,
    load_audio,
    normalize_media,
    validate_extension,
)
from .config import Settings
from .model_service import VerseModelService
from .prompts import validate_language

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
LOGGER = logging.getLogger("verse.api")
SETTINGS = Settings.from_env()
MODEL_SERVICE = VerseModelService(SETTINGS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model_service = MODEL_SERVICE
    if not SETTINGS.skip_model_load:
        await asyncio.to_thread(MODEL_SERVICE.load)
    yield


app = FastAPI(title="VERSE Caption API", version="2.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(SETTINGS.allowed_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health(request: Request) -> dict[str, object]:
    service: VerseModelService = request.app.state.model_service
    return {
        "status": "ok" if service.ready else "unavailable",
        "model": "VERSE V2",
        "base_model": SETTINGS.base_model,
        "adapter": SETTINGS.adapter_model,
        "cuda": torch.cuda.is_available(),
        "ready": service.ready,
        "detail": None if service.ready else service.load_error,
    }


async def _save_upload(upload: UploadFile, directory: Path) -> Path:
    filename = upload.filename or "upload"
    extension = validate_extension(filename)
    destination = directory / f"upload{extension}"
    maximum = SETTINGS.max_upload_mb * 1024 * 1024
    total = 0
    with destination.open("wb") as output:
        while chunk := await upload.read(1024 * 1024):
            total += len(chunk)
            if total > maximum:
                raise MediaError(
                    f"Upload exceeds the {SETTINGS.max_upload_mb} MB limit"
                )
            output.write(chunk)
    if total == 0:
        raise MediaError("The uploaded file is empty")
    return destination


@app.post("/api/caption")
async def caption(
    request: Request,
    file: UploadFile | None = File(default=None),
    video_url: str | None = Form(default=None),
    source_language: str = Form(...),
    target_language: str = Form(...),
) -> dict[str, object]:
    started = perf_counter()
    try:
        source = validate_language(source_language)
        target = validate_language(target_language)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    if (file is None) == (not video_url):
        raise HTTPException(
            status_code=422,
            detail="Provide exactly one media file or video_url",
        )

    service: VerseModelService = request.app.state.model_service
    if not service.ready:
        raise HTTPException(
            status_code=503,
            detail="VERSE V2 is not available on this runtime",
        )

    LOGGER.info("Caption request started source=%s target=%s", source, target)
    try:
        with tempfile.TemporaryDirectory(prefix="verse-") as temp:
            directory = Path(temp)
            if file is not None:
                media_path = await _save_upload(file, directory)
            else:
                media_path = await asyncio.to_thread(
                    download_media_url,
                    video_url or "",
                    directory,
                    SETTINGS.max_upload_mb,
                )
            normalized_path = directory / "normalized.wav"
            await asyncio.to_thread(normalize_media, media_path, normalized_path)
            audio = await asyncio.to_thread(load_audio, normalized_path)
            result = await asyncio.to_thread(service.caption, audio, source, target)
    except MediaError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except HTTPException:
        raise
    except Exception as error:
        LOGGER.exception("Caption inference failed")
        raise HTTPException(
            status_code=500,
            detail="Caption generation failed. Please try another media file.",
        ) from error
    finally:
        if file is not None:
            await file.close()

    LOGGER.info(
        "Caption request complete source=%s target=%s duration=%.2fs chunks=%d "
        "inference=%.2fs total=%.2fs",
        source,
        target,
        result.duration_seconds,
        result.chunk_count,
        result.inference_seconds,
        perf_counter() - started,
    )
    return {
        "success": True,
        "source_language": source,
        "target_language": target,
        "caption": result.text,
        "duration_seconds": round(result.duration_seconds, 3),
        "chunks": result.chunk_count,
    }

