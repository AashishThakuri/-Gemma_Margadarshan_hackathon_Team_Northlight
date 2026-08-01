# Verse documentation

Supporting material for the **Gemma Margadarshan Hackathon** submission by **Team Northlight**.

| Document | What is in it |
| --- | --- |
| [`kaggle-submission.md`](kaggle-submission.md) | The writeup text submitted to Kaggle on 31 July 2026 |
| [`outreach.md`](outreach.md) | The NDFN and NFDN replies that set the scope of the project |
| [`pitch/`](pitch/) | Presentation deck, as `.pptx` and as a self-contained `.html` |
| [`screenshots/`](screenshots/) | Evaluation run, submission confirmation, product pages, correspondence, team |

## Which number came from which run

Two separate evaluations appear in this repository. They measure different things and are
not interchangeable.

**1. Original vs fine-tuned comparison.** The head-to-head result, both models decoded on
the same held-out clips.

| Model | WER | CER |
| --- | ---: | ---: |
| Original Gemma 4 E4B | 41.96% | 12.48% |
| Fine-tuned Gemma 4 E4B | **18.92%** | **4.08%** |

Relative error reduction: WER approximately **54.9%**, CER approximately **67.3%**.
Chart: [`screenshots/original-vs-finetuned.png`](screenshots/original-vs-finetuned.png).

**2. V2 quick validation.** A preliminary check on 15 clips, 5 per source language, run
after the V2 adapter finished. There is no baseline decode on the same 15 clips, so these
numbers describe V2 on its own rather than forming a comparison.

| Language | Samples | WER | CER |
| --- | ---: | ---: | ---: |
| English | 5 | 6.72% | 3.05% |
| Nepali | 5 | 8.20% | 1.57% |
| Maithili | 5 | 30.36% | 6.45% |
| **Combined** | **15** | **12.35%** | **3.44%** |

Console output: [`screenshots/quick-validation-run.png`](screenshots/quick-validation-run.png).

Fifteen clips is too small to conclude from, and the per-language split shows why. Maithili
is close to four times worse than English, and a sample that size cannot separate a real gap
from noise. The next step for evaluation is decoding both models over one larger held-out
set and reporting a single matched comparison.

The deck in [`pitch/`](pitch/) is the presentation as it was built for the pitch. For
figures, cite the two tables above.

## Screenshots

| File | What it shows |
| --- | --- |
| [`original-vs-finetuned.png`](screenshots/original-vs-finetuned.png) | WER and CER, original Gemma against the fine-tuned model |
| [`quick-validation-run.png`](screenshots/quick-validation-run.png) | The V2 quick validation console output, in the RunPod workspace |
| [`ndfn-email-reply.png`](screenshots/ndfn-email-reply.png) | NDFN's reply on captions and Nepali Sign Language |
| [`nfdn-email-reply.png`](screenshots/nfdn-email-reply.png) | NFDN's reply, from Include Us Phase II |
| [`landing-page.png`](screenshots/landing-page.png) | Verse landing page |
| [`about-page.png`](screenshots/about-page.png) | About section |
| [`kaggle-submission.png`](screenshots/kaggle-submission.png) | Submission confirmation, 31 July 2026 |
| [`team-1.png`](screenshots/team-1.png), [`team-2.png`](screenshots/team-2.png) | Team Northlight |

## Contact

Training ran in our own Google Colab and RunPod accounts, so the run history, checkpoints
and evaluation outputs are not in this repository. If judges or anyone else want to see
them, just ask. We are happy to share access to the Colab notebooks and the RunPod
workspace, walk through the training logs and checkpoint directory, or answer any other
question about how a number was produced.

| Name | Phone | Email |
| --- | --- | --- |
| Praful Bhatt | 9808607050 | praful2062@gmail.com |
| Aashish Thakuri | 9862557932 | |
