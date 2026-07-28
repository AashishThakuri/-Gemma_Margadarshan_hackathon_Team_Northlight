from pathlib import Path
import random

from PIL import Image, ImageFilter


OUTPUT_DIR = Path(__file__).resolve().parents[1] / "public"
random.seed(35)

grain_size = 384
grain = Image.new("RGBA", (grain_size, grain_size))
grain_pixels = []

for _ in range(grain_size * grain_size):
    silver = max(18, min(238, round(random.gauss(128, 43))))
    warm_shift = random.randint(-8, 8)
    grain_pixels.append(
        (
            max(0, min(255, silver + warm_shift)),
            silver,
            max(0, min(255, silver - warm_shift)),
            random.randint(32, 82),
        )
    )

grain.putdata(grain_pixels)
grain = grain.filter(ImageFilter.GaussianBlur(0.18))
grain.save(OUTPUT_DIR / "film-grain-35mm.png", optimize=True)
