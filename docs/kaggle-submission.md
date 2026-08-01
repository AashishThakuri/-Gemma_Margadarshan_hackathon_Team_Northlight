# Kaggle submission

Submitted to **Build With Gemma: Margadarshan** on 31 July 2026, before the 6:00 PM GMT+5:45
deadline. Confirmation: [`screenshots/kaggle-submission.png`](screenshots/kaggle-submission.png).

| Field | Value |
| --- | --- |
| Title | Verse: Nepali, Maithili and English captions for hard-of-hearing users |
| Prize track | Gemma for Language Access |
| Team | Northlight |

**Subtitle.** Audio-native Gemma 4 E4B, fine-tuned: 41.96% to 18.92% WER on 200 unseen
clips. Scoped with NDFN and NFDN before we wrote any code.

The writeup text follows.

---

**Speech in, captions out.** Verse takes spoken **Nepali, Maithili or English** audio and
returns a timed caption file (`.srt` / `.vtt`), either in the same language or translated
into one of the other two. The model doing the work is a fine-tuned **Gemma 4 E4B**, used
audio-natively. There's no Whisper and no cloud speech API anywhere in the path.

## Inspiration

We were building a generic Nepali captioning tool for YouTube and podcasts. Before
committing to it we emailed the organisations who'd have to live with the result: the
National Federation of the Deaf Nepal (NDFN), the National Federation of the Disabled Nepal
(NFDN), Shruti Nepal, AFAN and Access Planet.

Two of them replied the same morning, and both corrected us in the same way.

**NDFN** told us captions are useful for Deaf and hard-of-hearing people with strong
literacy, in situations where an interpreter isn't available, but that Nepali Sign Language
interpretation is essential for anyone whose primary language is NSL. In their words,
*"captions alone cannot fully convey the linguistic structure, grammar, cultural context and
richness of Nepali Sign Language."*

**NFDN** (Kushal Neupane, Senior Project Coordinator, Include Us Phase II) said the two
*"serve different purposes and complement each other"*, and that captions *"should not be
considered a replacement for sign language interpretation."*

That reply is what narrowed our scope. Verse isn't a Deaf accessibility product. It's
captioning for hard-of-hearing people, people who lost hearing later in life, and deafblind
users whose assistive tech reads text. That group grows with age and hearing loss, and right
now it's served by almost nothing in Nepali and by **nothing at all in Maithili**, which is
the second most spoken language in the country.

We then spent half an hour on a call with Kushal Neupane, who confirmed the use case is real
and feasible and offered to help facilitate a pilot. A session with hard-of-hearing users is
booked for tomorrow, one day after this deadline, and we'd rather say that than imply we've
already done user testing. Two Kathmandu University researchers also gave us time: Saugat
Singh, whose master's thesis built an isolated NSL recogniser with the Kavre School for the
Deaf, and Bipesh Raj Subedi from the Information and Language Processing Research Lab.

As for why we didn't just call an existing API: Nepali ASR is thin, Maithili is effectively
absent, and real speech here breaks a monolingual decoder in several ways at once.
Devanagari spelling and conjuncts vary legitimately, Nepali and Maithili are phonetically
close enough that an unconditioned model drifts between them mid-sentence, English gets
code-switched in constantly, dialects vary a lot across the country, and captions need
continuity across segments rather than being decoded one utterance at a time. None of that
is an edge case here, it's the normal condition, which is why we fine-tuned our own model
instead of wrapping someone else's.

## How we built it

The model is Gemma 4 **E4B**, used **audio-natively**: audio goes in, captions come out,
with no separate ASR engine in front of it. If you took Gemma 4 out there'd be nothing left
to demo.

We fine-tuned it with LoRA using Hugging Face Transformers and PEFT, training the adapter on
a multitask objective: captioning and speech translation together, across all three
languages, rather than a transcription model with a translation system bolted on afterwards.

One adapter covers nine behaviours: transcribing `ne→ne`, `mai→mai` and `en→en`, plus
translation across all six remaining directions (`ne↔mai`, `ne↔en`, `mai↔en`). Which one you
get is selected by the instruction rather than by a router, and that only works because
Gemma 4 follows instructions and takes audio in the same model. A conventional stack would
need nine systems, or ASR followed by a separate MT stage whose errors compound on top of
the first stage's. Here it's one adapter.

The output is caption-shaped from the start: timed segments that serialise to `.srt` and
`.vtt`, with continuity carried across segments.

Choosing E4B was deliberate. Captioning is sensitive to both latency and privacy, and the
places NFDN named (classrooms, clinics, government service desks) are exactly where that
matters. An edge-deployable variant means the pilot can eventually run without sending a
hard-of-hearing user's medical appointment to a cloud API.

We keep full training state with every adapter (`optimizer.pt`, `scheduler.pt`,
`trainer_state.json`, `rng_state.pth`, `training_args.bin`), so any checkpoint is resumable
and reproducible instead of being a dead weights file.

## Verified result

Both models were run on the same held-out clips, never seen during training, with identical
decoding settings.

| Model | WER ↓ | CER ↓ | Word acc. ↑ | Char acc. ↑ |
|---|---:|---:|---:|---:|
| Gemma 4 E4B, out of the box | 41.96% | 12.48% | 58.04% | 87.52% |
| **Gemma 4 E4B, fine-tuned** | **18.92%** | **4.08%** | **81.08%** | **95.92%** |

Fine-tuning cut word error by about 54.9% and character error by about 67.3%. The two
accuracy columns are just `100 - WER` and `100 - CER`, which are readable indicators rather
than classification accuracy, and we'd rather label them than let them be misread.

At 41.96% WER a hard-of-hearing user gets captions they can't rely on. Closing that gap is
what the project is for.

Worth stating plainly: this is one model measured against itself, base versus fine-tuned, on
the same clips with the same decoding. We didn't pick the clips after seeing the results,
and we're not quoting a training-curve number, because a metric measured on data the model
has already seen is worse than no metric at all.

## Challenges we ran into

The most useful thing we did all day was also the cheapest: sending two emails before we
started building. They stopped us from shipping something mislabelled as Deaf accessibility,
which is the kind of thing teams usually only find out after the pitch.

Data was the real grind. Nepali and Maithili speech data is scarce and transcribed unevenly.
Saugat Singh gave us additional caption data and pointed us to further Kaggle resources, and
sourcing and cleaning still took a large share of the day.

Training one adapter to do nine things without it getting worse at any of them took the most
iteration. A model that transcribes Nepali well and translates Maithili badly is not one
system, it's a demo, so the multitask mix had to stay balanced rather than let the easiest
task dominate.

The last one was mostly discipline. With a deadline running there was every temptation to
quote a training-curve number early, and keeping the evaluation set genuinely held out was
the harder call.

## Where this goes

The pilot pathway already exists, since NFDN offered to facilitate it and the user session
is booked. The near-term targets are the settings both federations named: education, public
broadcasts, government services and meetings, with captions positioned the way they asked,
alongside NSL interpretation rather than instead of it. On the technical side it's real-time
streaming captions next, then on-device deployment so a Maithili speaker in a district
clinic can get captions with no internet connection.

**Acknowledgements:** NDFN; Kushal Neupane, NFDN; Saugat Singh and Bipesh Raj Subedi, DoCSE
/ ILPRL, Kathmandu University.

---

A separate quick validation of the V2 adapter was run after submission on a much smaller
sample. Those numbers and their caveats are in [`README.md`](README.md#which-number-came-from-which-run).
