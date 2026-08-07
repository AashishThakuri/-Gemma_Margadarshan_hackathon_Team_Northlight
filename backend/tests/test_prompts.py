import itertools

import pytest

from app.prompts import LANGUAGE_NAMES, build_prompt


@pytest.mark.parametrize(
    ("code", "expected"),
    [
        (
            "en",
            "Transcribe the spoken English audio accurately in English. Return only the caption text.",
        ),
        (
            "ne",
            "Transcribe the spoken Nepali audio accurately in Nepali. Return only the caption text.",
        ),
        (
            "mai",
            "Transcribe the spoken Maithili audio accurately in Maithili. Return only the caption text.",
        ),
    ],
)
def test_same_language_prompts(code: str, expected: str) -> None:
    assert build_prompt(code, code) == expected


@pytest.mark.parametrize(
    ("source", "target"),
    [pair for pair in itertools.product(LANGUAGE_NAMES, repeat=2) if pair[0] != pair[1]],
)
def test_translation_prompts(source: str, target: str) -> None:
    assert build_prompt(source, target) == (
        f"Listen to the spoken {LANGUAGE_NAMES[source]} audio and translate it "
        f"into {LANGUAGE_NAMES[target]}. Return only the translated text."
    )


def test_invalid_language_is_rejected() -> None:
    with pytest.raises(ValueError, match="en, ne, mai"):
        build_prompt("fr", "en")

