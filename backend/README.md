# VERSE V2 caption API

This FastAPI service loads the public [VERSE V2 adapter](https://huggingface.co/Aashishhhhhhhh/verse-v2-nepali-maithili) on top of `unsloth/gemma-4-e4b-it-unsloth-bnb-4bit`. It supports English (`en`), Nepali (`ne`), and Maithili (`mai`) transcription and translation.

## Runtime

Use Linux, native Windows, or Windows through WSL2 with an NVIDIA GPU, a compatible CUDA-enabled PyTorch build, Python 3.10 or 3.11, and `ffmpeg`. A GPU with at least 16 GB VRAM is recommended for the 4-bit E4B runtime; more headroom is useful for long requests. macOS can run the frontend but must connect to a remote NVIDIA backend because this service uses the CUDA 4-bit model path.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --env-file .env
```

On Windows PowerShell, activate with `.\.venv\Scripts\Activate.ps1`, copy the environment file with `Copy-Item .env.example .env`, and use `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --env-file .env`.

The model and adapter are loaded once during startup. Check readiness at `GET http://localhost:8000/api/health`.

## Caption request

```bash
curl -X POST http://localhost:8000/api/caption \
  -F "file=@sample.mp3" \
  -F "source_language=ne" \
  -F "target_language=en"
```

The route also accepts `video_url` instead of `file` for public YouTube, Vimeo, and direct media URLs. Never send both fields.

## Development checks without a GPU

```bash
pip install fastapi uvicorn python-multipart numpy librosa soundfile yt-dlp httpx pytest
set VERSE_SKIP_MODEL_LOAD=1
pytest -q
```

These checks verify prompts, chunking, media handling, API validation, and health responses. Actual model output must be verified on the NVIDIA runtime.
