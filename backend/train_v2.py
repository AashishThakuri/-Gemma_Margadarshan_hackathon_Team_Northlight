from __future__ import annotations

# Import Unsloth before Transformers, TRL, or PEFT.
import unsloth

import gc
import json
from pathlib import Path
from typing import Any

import pandas as pd
import torch
from datasets import Dataset
from peft import PeftModel
from transformers import TrainingArguments
from trl import SFTTrainer
from unsloth import FastModel

PROJECT_ROOT = Path("/workspace/verse-v2")

BASE_MODEL = "unsloth/gemma-4-e4b-it-unsloth-bnb-4bit"

V1_ADAPTER_PATH = (
    PROJECT_ROOT
    / "gemma4-e4b-nepali-maithili-full"
    / "checkpoint-2998"
)

TRAIN_MANIFEST = (
    PROJECT_ROOT
    / "verse-v2-multitask"
    / "final-v2-task-manifests"
    / "v2-train-multitask.parquet"
)

VALIDATION_MANIFEST = (
    PROJECT_ROOT
    / "verse-v2-multitask"
    / "final-v2-task-manifests"
    / "v2-validation-multitask.parquet"
)

OUTPUT_DIR = PROJECT_ROOT / "gemma4-e4b-verse-v2-multitask"

MAX_SEQ_LENGTH = 2048
PER_DEVICE_TRAIN_BATCH_SIZE = 16
PER_DEVICE_EVAL_BATCH_SIZE = 16
GRADIENT_ACCUMULATION_STEPS = 1
NUM_TRAIN_EPOCHS = 1
LEARNING_RATE = 2e-4
WARMUP_RATIO = 0.03
WEIGHT_DECAY = 0.01
LOGGING_STEPS = 10
SAVE_STEPS = 250
EVAL_STEPS = 250
SAVE_TOTAL_LIMIT = 6
SEED = 3407


def require_path(path: Path, name: str) -> None:
    if not path.exists():
        raise FileNotFoundError(f"{name} not found: {path}")


require_path(V1_ADAPTER_PATH, "V1 adapter")
require_path(TRAIN_MANIFEST, "V2 train manifest")
require_path(VALIDATION_MANIFEST, "V2 validation manifest")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 80)
print("LOADING V2 MANIFESTS")
print("=" * 80)

train_df = pd.read_parquet(TRAIN_MANIFEST)
validation_df = pd.read_parquet(VALIDATION_MANIFEST)

required_columns = {
    "task_id",
    "clip_id",
    "task_type",
    "source_language",
    "target_language",
    "system_prompt",
    "instruction",
    "target_text",
}

missing_train = required_columns.difference(train_df.columns)
missing_validation = required_columns.difference(validation_df.columns)

if missing_train:
    raise ValueError(f"Train manifest missing: {sorted(missing_train)}")

if missing_validation:
    raise ValueError(
        f"Validation manifest missing: {sorted(missing_validation)}"
    )

print(f"Train examples: {len(train_df):,}")
print(f"Validation examples: {len(validation_df):,}")
print(train_df["task_type"].value_counts())
print(train_df["target_language"].value_counts())


def build_example(row: dict[str, Any]) -> dict[str, Any]:
    conversation = [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": str(row["system_prompt"]).strip(),
                }
            ],
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "audio",
                    "audio": row.get("audio"),
                },
                {
                    "type": "text",
                    "text": str(row["instruction"]).strip(),
                },
            ],
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": str(row["target_text"]).strip(),
                }
            ],
        },
    ]

    return {**row, "messages": conversation}


train_records = [
    build_example(row)
    for row in train_df.to_dict(orient="records")
]

validation_records = [
    build_example(row)
    for row in validation_df.to_dict(orient="records")
]

train_dataset = Dataset.from_list(train_records)
validation_dataset = Dataset.from_list(validation_records)

print("=" * 80)
print("LOADING GEMMA 4 E4B")
print("=" * 80)

model, processor = FastModel.from_pretrained(
    model_name=BASE_MODEL,
    max_seq_length=MAX_SEQ_LENGTH,
    dtype=None,
    load_in_4bit=True,
)

print("=" * 80)
print("LOADING V1 ADAPTER AS V2 STARTING POINT")
print("=" * 80)

model = PeftModel.from_pretrained(
    model,
    str(V1_ADAPTER_PATH),
    is_trainable=True,
)

trainable_parameters = 0
total_parameters = 0

for parameter in model.parameters():
    total_parameters += parameter.numel()
    if parameter.requires_grad:
        trainable_parameters += parameter.numel()

percentage = (
    100 * trainable_parameters / total_parameters
    if total_parameters
    else 0
)

print(f"Trainable parameters: {trainable_parameters:,}")
print(f"Total parameters: {total_parameters:,}")
print(f"Trainable percentage: {percentage:.4f}%")


def formatting_func(example: dict[str, Any]) -> str:
    return processor.apply_chat_template(
        example["messages"],
        tokenize=False,
        add_generation_prompt=False,
    )


training_args = TrainingArguments(
    output_dir=str(OUTPUT_DIR),
    num_train_epochs=NUM_TRAIN_EPOCHS,
    per_device_train_batch_size=PER_DEVICE_TRAIN_BATCH_SIZE,
    per_device_eval_batch_size=PER_DEVICE_EVAL_BATCH_SIZE,
    gradient_accumulation_steps=GRADIENT_ACCUMULATION_STEPS,
    learning_rate=LEARNING_RATE,
    warmup_ratio=WARMUP_RATIO,
    weight_decay=WEIGHT_DECAY,
    logging_steps=LOGGING_STEPS,
    save_strategy="steps",
    save_steps=SAVE_STEPS,
    save_total_limit=SAVE_TOTAL_LIMIT,
    eval_strategy="steps",
    eval_steps=EVAL_STEPS,
    bf16=torch.cuda.is_available()
    and torch.cuda.is_bf16_supported(),
    fp16=torch.cuda.is_available()
    and not torch.cuda.is_bf16_supported(),
    optim="adamw_8bit",
    report_to="none",
    seed=SEED,
    data_seed=SEED,
    remove_unused_columns=False,
    dataloader_num_workers=4,
    dataloader_pin_memory=True,
    load_best_model_at_end=False,
)

trainer = SFTTrainer(
    model=model,
    processing_class=processor,
    train_dataset=train_dataset,
    eval_dataset=validation_dataset,
    formatting_func=formatting_func,
    args=training_args,
    max_seq_length=MAX_SEQ_LENGTH,
)


def checkpoint_step(path: Path) -> int:
    try:
        return int(path.name.split("-")[-1])
    except ValueError:
        return -1


existing_checkpoints = sorted(
    OUTPUT_DIR.glob("checkpoint-*"),
    key=checkpoint_step,
)

resume_checkpoint: str | None = None

if existing_checkpoints:
    resume_checkpoint = str(existing_checkpoints[-1])
    print(f"Resuming from: {resume_checkpoint}")
else:
    print("Starting V2 from V1 checkpoint-2998")

train_result = trainer.train(
    resume_from_checkpoint=resume_checkpoint,
)

trainer.save_model(str(OUTPUT_DIR))
processor.save_pretrained(str(OUTPUT_DIR))

metrics_path = OUTPUT_DIR / "final_training_metrics.json"

with metrics_path.open("w", encoding="utf-8") as file:
    json.dump(
        train_result.metrics,
        file,
        indent=2,
        ensure_ascii=False,
    )

print(f"Final model directory: {OUTPUT_DIR}")
print(f"Metrics file: {metrics_path}")

gc.collect()

if torch.cuda.is_available():
    torch.cuda.empty_cache()
