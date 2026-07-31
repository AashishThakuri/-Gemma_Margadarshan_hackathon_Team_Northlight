<div align="center">

# VERSE

### Every moment, made clear.

Multilingual speech recognition, translation, and live captions for English, Nepali, and Maithili.

![Gemma](https://img.shields.io/badge/Gemma-4_E4B-11110c?style=flat-square)
![LoRA](https://img.shields.io/badge/Fine--tuning-LoRA_%2F_PEFT-75b178?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-11110c?style=flat-square)
![Languages](https://img.shields.io/badge/Languages-en_%7C_ne_%7C_mai-e44720?style=flat-square)

</div>

![Verse landing page](frontend/public/verse-landing.png)

## Overview

Verse is a multilingual captioning system built by **Team Northlight** for the **Gemma Margadarshan Hackathon**. It combines a fine-tuned Gemma speech model with a responsive web experience for turning uploaded audio, uploaded video, or shared video links into readable captions.

**VERSE V2** is based on **Gemma 4 E4B** and is trained for both same-language transcription and cross-language speech-to-text translation. The web application presents the caption workflow in a responsive interface designed for phones, tablets, laptops, and desktops.

## What Verse can do

### Same-language transcription

- English audio → English text
- Nepali audio → Nepali text
- Maithili audio → Maithili text

### Speech-to-text translation

- English audio → Nepali or Maithili text
- Nepali audio → English or Maithili text
- Maithili audio → English or Nepali text

### Product experience

- Upload local audio and video files.
- Share supported video URLs.
- Switch between English, Nepali, and Maithili caption tracks.
- Preview synchronized captions in the browser.
- Use a keyboard-accessible, responsive interface with reduced-motion support.

## Model at a glance

| Item | VERSE V2 configuration |
| --- | --- |
| Base model | `unsloth/gemma-4-e4b-it-unsloth-bnb-4bit` |
| Architecture | Gemma 4 E4B instruction-tuned |
| Fine-tuning method | LoRA / PEFT |
| Trainable parameters | 18,350,080 |
| Approximate trainable share | 0.23% |
| Epochs | 1 |
| Per-device batch size | 16 |
| Final optimizer step | 12,761 |
| Final release | V2 adapter from `checkpoint-12761` |
| Training task examples | 200,442 |

Only the LoRA parameters were updated; the compatible Gemma base weights remain the foundation of the model.

## Training data

The source corpus is [`Firoj112/chatterbox-multilingual-data`](https://huggingface.co/datasets/Firoj112/chatterbox-multilingual-data). Audio metadata and transcripts were cleaned before retaining English, Nepali, and Maithili clips.

### Clean source audio

| Source language | Clean clips |
| --- | ---: |
| English | 21,846 |
| Nepali | 25,184 |
| Maithili | 19,784 |
| **Total** | **66,814** |

![VERSE V2 clean training clips by source language](frontend/public/verse-v2-training-data.png)

Each clean source clip produced three supervised tasks:

```text
1 same-language transcription task
+
2 cross-language translation tasks
=
3 examples per source clip
```

| Task type | Examples |
| --- | ---: |
| Transcription | 66,814 |
| Speech translation | 133,628 |
| **Total training examples** | **200,442** |

The validation split contains **3,712 source clips**, expanded into **11,136 multitask examples**.

## Development pipeline

```mermaid
flowchart LR
    A["English, Nepali and Maithili audio"] --> B["Clean metadata and transcripts"]
    B --> C["66,814 clean source clips"]
    C --> D["Original same-language transcripts"]
    C --> E["IndicTrans2 translated targets"]
    D --> F["1 transcription task per clip"]
    E --> G["2 translation tasks per clip"]
    F --> H["200,442 multitask examples"]
    G --> H
    H --> I["Gemma 4 E4B"]
    I --> J["LoRA / PEFT fine-tuning"]
    J --> K["12,761 optimizer steps"]
    K --> L["VERSE V2 adapter"]
    L --> M["Caption API"]
    L --> N["WER and CER evaluation"]
```

## Preparing translation targets

The original corpus provides audio with same-language transcripts. Missing cross-language supervision targets were prepared with three IndicTrans2 models:

- `AI4Bharat/indictrans2-en-indic-200M`
- `AI4Bharat/indictrans2-indic-en-200M`
- `AI4Bharat/indictrans2-indic-indic-320M`

IndicTrans2 was used only during dataset preparation. It did not generate source audio and is not required for final Verse inference.

## Training infrastructure

| Environment | GPU | Role |
| --- | --- | --- |
| Google Colab | NVIDIA A100 | Experiments, pipeline validation, and training runs |
| RunPod | NVIDIA B200 | High-memory V2 fine-tuning and checkpoint completion |

The final V2 adapter was completed at optimizer step **12,761**. The adapter format keeps the release substantially smaller than a merged full-model checkpoint.

## Evaluation

### Original vs. fine-tuned comparison

| Model | Word Error Rate | Character Error Rate |
| --- | ---: | ---: |
| Original Gemma 4 E4B | 41.96% | 12.48% |
| Fine-tuned Gemma 4 E4B | **18.92%** | **4.08%** |

In this comparison run, fine-tuning reduced relative WER by approximately **54.9%** and relative CER by approximately **67.3%**.

![Original and fine-tuned Gemma error comparison](frontend/public/gemma-error-comparison.png)

### Quick V2 validation

The following preliminary check used 5 clips per source language, or 15 clips total:

| Language | Samples | WER | CER |
| --- | ---: | ---: | ---: |
| English | 5 | 6.72% | 3.05% |
| Nepali | 5 | 8.20% | 1.57% |
| Maithili | 5 | 30.36% | 6.45% |
| **Combined** | **15** | **12.35%** | **3.44%** |

Lower WER and CER are better. This 15-clip check is a preliminary validation result, not a final benchmark or state-of-the-art claim. It is reported separately from the larger original-vs-fine-tuned comparison above.

## System flow

```text
Video URL / audio file / video file
                 ↓
        speech preprocessing
                 ↓
          VERSE V2 adapter
        + Gemma 4 E4B base
                 ↓
     timestamped caption segments
                 ↓
 English / Nepali / Maithili playback
```

During development, the caption service exposed:

```text
GET  /health
POST /caption
```

The caption request accepts a media file, `source_language`, and `target_language`. Language codes are `en`, `ne`, and `mai`.

## Technology

- Gemma 4 E4B, Unsloth, PEFT, and LoRA
- Hugging Face Transformers
- IndicTrans2 by AI4Bharat for supervision-label preparation
- React 19, TypeScript, and a Next.js-compatible Vinext application
- GSAP, Lenis, and Anime.js for interface motion
- Cloudflare Workers-compatible production build

## Repository scope

This repository contains the Verse web experience and hackathon caption demo. The full training corpus, model checkpoints, and private training workspace are not committed here. The V2 release should be described as a **LoRA/PEFT adapter** unless it is later merged with and distributed alongside compatible Gemma base weights.

## Live inference availability

The VERSE V2 adapter was fine-tuned and evaluated in the RunPod training environment. At the time of this hackathon submission, our RunPod credit balance has been exhausted, so we cannot keep the GPU-backed Gemma inference endpoint publicly available. We sincerely apologize for this temporary limitation.

To keep the product experience reviewable, the **Try Verse** page includes synchronized English, Nepali, and Maithili caption tracks that demonstrate how output from our fine-tuned Gemma workflow is displayed during live caption playback. These prepared tracks demonstrate the caption timing, language switching, and user experience; the public demo is not currently running new model inference in the browser.

As soon as GPU access is restored, the `/caption` API can reconnect the VERSE V2 adapter and provide live model-generated captions again. The cleaned V2 fine-tuning implementation is included at `backend/train_v2.py`.

## Run locally

### Requirements

- Node.js 22.13 or newer
- npm

### Setup

```bash
git clone https://github.com/AashishThakuri/-Gemma_Margadarshan_hackathon_Team_Northlight.git
cd -- -Gemma_Margadarshan_hackathon_Team_Northlight
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The caption workspace is available at [http://localhost:3000/try-verse](http://localhost:3000/try-verse).

### Verify the project

```bash
npm test
```

## Project structure

```text
frontend/
|-- app/
|   |-- page.tsx              # Landing, About, Features, and footer
|   `-- try-verse/page.tsx    # Video/audio intake and caption demo
|-- public/                   # Artwork, screenshots, and evaluation graphs
|-- tests/                    # Rendered-page smoke tests
`-- worker/                   # Cloudflare-compatible worker entry
backend/
`-- train_v2.py               # Clean VERSE V2 LoRA/PEFT training code
```

## Limitations

- Maithili WER is currently higher than English and Nepali WER.
- The quick V2 validation sample is too small for a conclusive benchmark.
- Translation supervision partly relies on IndicTrans2-generated targets.
- Noise, music, overlapping speakers, rare dialects, code-switching, and long recordings may reduce accuracy.
- A larger untouched test set is required before production or high-stakes use.
- The adapter requires the compatible Gemma 4 E4B base model.

## Attribution

Verse V2 was built with Gemma 4 by Google DeepMind, Unsloth, Hugging Face Transformers and PEFT, IndicTrans2 by AI4Bharat, the `Firoj112/chatterbox-multilingual-data` corpus, Google Colab, and RunPod.

Users must follow the terms of the Gemma base model, source dataset, IndicTrans2 models, and all other dependencies. Evaluate the model independently before production or high-stakes deployment.

## Team

Built by **Team Northlight** for the **Gemma Margadarshan Hackathon**.

---

<div align="center">
  <strong>VERSE — LIVE CAPTIONS AS THEY HAPPEN.</strong>
</div>
