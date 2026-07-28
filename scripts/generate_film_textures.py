from pathlib import Path
import random

from PIL import Image, ImageDraw, ImageFilter


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

dust_size = 1024
dust = Image.new("RGBA", (dust_size, dust_size), (0, 0, 0, 0))
draw = ImageDraw.Draw(dust)

for _ in range(95):
    x = random.randint(0, dust_size)
    y = random.randint(0, dust_size)
    radius = random.choice((1, 1, 2, 2, 3, 5, 8))
    shade = random.choice((18, 238))
    alpha = random.randint(10, 42)
    draw.ellipse(
        (x - radius, y - radius, x + radius, y + radius),
        fill=(shade, shade, shade, alpha),
    )

for _ in range(8):
    x = random.randint(0, dust_size)
    length = random.randint(dust_size // 4, dust_size)
    y = random.randint(-dust_size // 3, dust_size)
    shade = random.choice((20, 240))
    draw.line(
        (x, y, x + random.randint(-2, 2), y + length),
        fill=(shade, shade, shade, random.randint(10, 30)),
        width=random.choice((1, 1, 2)),
    )

dust = dust.filter(ImageFilter.GaussianBlur(0.35))
dust.save(OUTPUT_DIR / "film-dust-35mm.png", optimize=True)
