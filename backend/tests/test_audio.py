import numpy as np

from app.audio import SAMPLE_RATE, combine_captions, split_audio


def test_audio_is_split_into_overlapping_chunks() -> None:
    audio = np.zeros(52 * SAMPLE_RATE, dtype=np.float32)
    chunks = split_audio(audio, chunk_seconds=25, overlap_seconds=1)

    assert [chunk.size for chunk in chunks] == [25 * SAMPLE_RATE, 25 * SAMPLE_RATE, 4 * SAMPLE_RATE]


def test_short_audio_stays_in_one_chunk() -> None:
    audio = np.zeros(8 * SAMPLE_RATE, dtype=np.float32)
    assert len(split_audio(audio, chunk_seconds=25)) == 1


def test_boundary_words_are_deduplicated() -> None:
    assert combine_captions(
        [
            "Every moment is made clear",
            "made clear when captions arrive",
            "captions arrive on time",
        ]
    ) == "Every moment is made clear when captions arrive on time"

