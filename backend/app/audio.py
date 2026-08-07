from __future__ import annotations

import ipaddress
import logging
import socket
import subprocess
from pathlib import Path
from urllib.parse import urlparse

import librosa
import numpy as np

LOGGER = logging.getLogger("verse.audio")

SUPPORTED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".webm", ".mp4", ".mov"}
OVERLAP_SECONDS = 1
SAMPLE_RATE = 16_000


class MediaError(ValueError):
    """A safe, user-facing media processing error."""


def validate_extension(filename: str) -> str:
    extension = Path(filename).suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise MediaError(f"Unsupported media format. Supported formats: {supported}")
    return extension


def normalize_media(input_path: Path, output_path: Path) -> None:
    command = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(input_path),
        "-vn",
        "-ac",
        "1",
        "-ar",
        str(SAMPLE_RATE),
        "-c:a",
        "pcm_f32le",
        str(output_path),
    ]

    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
    except FileNotFoundError as error:
        raise MediaError("ffmpeg is required to process audio and video") from error
    except subprocess.CalledProcessError as error:
        LOGGER.warning("ffmpeg rejected an uploaded media file")
        raise MediaError("The uploaded media could not be decoded") from error


def load_audio(path: Path) -> np.ndarray:
    try:
        audio, _ = librosa.load(path, sr=SAMPLE_RATE, mono=True, dtype=np.float32)
    except Exception as error:
        raise MediaError("The normalized audio could not be read") from error

    audio = np.asarray(audio, dtype=np.float32)
    if audio.size == 0:
        raise MediaError("The media file contains no readable audio")
    return audio


def split_audio(
    audio: np.ndarray,
    chunk_seconds: int,
    overlap_seconds: int = OVERLAP_SECONDS,
    sample_rate: int = SAMPLE_RATE,
) -> list[np.ndarray]:
    chunk_size = chunk_seconds * sample_rate
    overlap_size = overlap_seconds * sample_rate
    if chunk_size <= overlap_size:
        raise ValueError("Chunk duration must be longer than overlap duration")
    if audio.size == 0:
        return []

    chunks: list[np.ndarray] = []
    step = chunk_size - overlap_size
    for start in range(0, audio.size, step):
        chunk = np.asarray(audio[start : start + chunk_size], dtype=np.float32)
        if chunk.size:
            chunks.append(chunk)
        if start + chunk_size >= audio.size:
            break
    return chunks


def combine_captions(parts: list[str], max_overlap_words: int = 12) -> str:
    cleaned = [" ".join(part.split()) for part in parts if part and part.strip()]
    if not cleaned:
        return ""

    merged = cleaned[0]
    for part in cleaned[1:]:
        previous_words = merged.split()
        next_words = part.split()
        overlap = 0
        limit = min(max_overlap_words, len(previous_words), len(next_words))
        for size in range(limit, 0, -1):
            left = [word.casefold().strip(".,!?;:\"'()") for word in previous_words[-size:]]
            right = [word.casefold().strip(".,!?;:\"'()") for word in next_words[:size]]
            if left == right:
                overlap = size
                break
        merged = " ".join([merged, *next_words[overlap:]]).strip()
    return merged


def validate_remote_url(value: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise MediaError("Provide a complete http or https media URL")

    try:
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        addresses = socket.getaddrinfo(parsed.hostname, port)
    except socket.gaierror as error:
        raise MediaError("The media URL host could not be resolved") from error

    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise MediaError("Private or local network media URLs are not allowed")
    return value


def download_media_url(value: str, output_directory: Path, max_upload_mb: int) -> Path:
    validate_remote_url(value)
    try:
        import yt_dlp
    except ImportError as error:
        raise MediaError("URL imports require the yt-dlp package") from error

    output_template = str(output_directory / "remote.%(ext)s")
    options = {
        "format": "bestaudio/best",
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "max_filesize": max_upload_mb * 1024 * 1024,
        "outtmpl": output_template,
        "restrictfilenames": True,
    }

    try:
        with yt_dlp.YoutubeDL(options) as downloader:
            metadata = downloader.extract_info(value, download=True)
            filename = Path(downloader.prepare_filename(metadata))
    except Exception as error:
        LOGGER.warning("Remote media import failed")
        raise MediaError("The video URL could not be downloaded") from error

    if not filename.exists():
        candidates = list(output_directory.glob("remote.*"))
        if not candidates:
            raise MediaError("The video URL did not produce a media file")
        filename = candidates[0]
    if filename.stat().st_size > max_upload_mb * 1024 * 1024:
        filename.unlink(missing_ok=True)
        raise MediaError(f"Remote media exceeds the {max_upload_mb} MB limit")
    return filename
