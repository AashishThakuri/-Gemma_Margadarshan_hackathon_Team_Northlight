<div align="center">

# VERSE

### Every moment, made clear.

Live captions for video and audio in English, Nepali, and Maithili.

![Gemma](https://img.shields.io/badge/Gemma-4_E4B-11110c?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-11110c?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square)
![Languages](https://img.shields.io/badge/Captions-English_%7C_Nepali_%7C_Maithili-e44720?style=flat-square)

</div>

![Verse landing page](public/verse-landing.png)

## What is Verse?

Verse is a multilingual live-captioning experience built by **Team Northlight** for the Gemma Margadarshan Hackathon. It turns spoken content from uploaded audio, uploaded video, or a shared video URL into clear, synchronized captions.

The project focuses on language access for English, Nepali, and Maithili while keeping the interface fast, expressive, and usable across phones, tablets, laptops, and desktops.

## Highlights

- Upload local audio or video files and preview captions in the browser.
- Share supported video URLs for a caption-ready playback experience.
- Switch between English, Nepali, and Maithili caption tracks.
- View synchronized captions against a prepared hackathon demo.
- Use a responsive interface with smooth motion and reduced-motion support.
- See the preloader only on the first site entry during a browser session.

## Fine-tuning Gemma

The captioning research uses **Gemma 4 E4B** fine-tuned for multilingual speech recognition and caption generation. The training corpus contains cleaned speech-and-transcript pairs prepared for the project's English, Nepali, and Maithili caption workflow.

Training was carried out in two GPU environments:

| Environment | GPU | Purpose |
| --- | --- | --- |
| Google Colab | NVIDIA A100 | Experimentation, validation, and training runs |
| RunPod | NVIDIA B200 | High-performance fine-tuning runs |

The dataset and training manifest are maintained outside this frontend repository. Because the source manifest is not included here, an exact sample count is intentionally not claimed in this README.

### Evaluation results

| Model | Word Error Rate | Character Error Rate |
| --- | ---: | ---: |
| Original Gemma 4 E4B | 41.96% | 12.48% |
| Fine-tuned Gemma 4 E4B | **18.92%** | **4.08%** |

That is a relative reduction of approximately **54.9% in WER** and **67.3% in CER** on the evaluated speech-recognition set.

![Original and fine-tuned Gemma error comparison](public/gemma-error-comparison.png)

## Caption workflow

```text
Video URL / audio file / video file
                 ↓
        speech preprocessing
                 ↓
       fine-tuned Gemma model
                 ↓
     timestamped caption segments
                 ↓
 English / Nepali / Maithili playback
```

## Tech stack

- Next.js-compatible application powered by Vinext
- React 19 and TypeScript
- GSAP, Lenis, and Anime.js for interface motion
- Cloudflare Workers-compatible production build
- Gemma 4 E4B for the captioning research pipeline

## Run locally

### Requirements

- Node.js 22.13 or newer
- npm

### Setup

```bash
git clone https://github.com/AashishThakuri/-Gemma_Margadarshan_hackathon_Team_Northlight.git
cd -- -Gemma_Margadarshan_hackathon_Team_Northlight
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The caption workspace is available at [http://localhost:3000/try-verse](http://localhost:3000/try-verse).

### Verify a production build

```bash
npm test
```

## Project structure

```text
app/
├── page.tsx              # Landing, About, Features, and footer
├── try-verse/page.tsx    # Video/audio intake and caption demo
└── globals.css           # Shared responsive visual system
public/                   # Artwork, textures, screenshots, and metadata
tests/                    # Rendered-page smoke tests
worker/                   # Cloudflare-compatible worker entry
```

## Team

Built by **Team Northlight** for the **Gemma Margadarshan Hackathon**.

---

<div align="center">
  <strong>VERSE — LIVE CAPTIONS AS THEY HAPPEN.</strong>
</div>
