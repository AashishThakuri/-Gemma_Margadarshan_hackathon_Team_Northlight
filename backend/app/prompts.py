from __future__ import annotations

LANGUAGE_NAMES = {
    "en": "English",
    "ne": "Nepali",
    "mai": "Maithili",
}

TRANSCRIPTION_PROMPTS = {
    "en": (
        "Transcribe the spoken English audio accurately in English. "
        "Return only the caption text."
    ),
    "ne": (
        "Transcribe the spoken Nepali audio accurately in Nepali. "
        "Return only the caption text."
    ),
    "mai": (
        "Transcribe the spoken Maithili audio accurately in Maithili. "
        "Return only the caption text."
    ),
}


def validate_language(code: str) -> str:
    normalized = code.strip().lower()
    if normalized not in LANGUAGE_NAMES:
        raise ValueError("Language must be one of: en, ne, mai")
    return normalized


def build_prompt(source_language: str, target_language: str) -> str:
    source = validate_language(source_language)
    target = validate_language(target_language)

    if source == target:
        return TRANSCRIPTION_PROMPTS[source]

    return (
        f"Listen to the spoken {LANGUAGE_NAMES[source]} audio and translate it "
        f"into {LANGUAGE_NAMES[target]}. Return only the translated text."
    )

