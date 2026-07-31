# Verse Caption API

The Verse backend serves the fine-tuned VERSE V2 LoRA/PEFT adapter through a FastAPI captioning interface.

## Development API contract

```text
GET  /health
POST /caption
```

The caption request accepts:

| Field | Description |
| --- | --- |
| `file` | Uploaded audio or video media |
| `source_language` | Spoken language: `en`, `ne`, or `mai` |
| `target_language` | Requested caption language: `en`, `ne`, or `mai` |

The model service requires the compatible Gemma 4 E4B base model and the VERSE V2 adapter from `checkpoint-12761`. Model weights, private training data, and cloud deployment credentials are intentionally excluded from this public repository.

The production model service was developed separately in the RunPod training workspace; this directory documents the stable interface consumed by the frontend.
