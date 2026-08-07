"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import styles from "./studio.module.css";

type InputMode = "link" | "upload";
type LanguageCode = "en" | "ne" | "mai";
type CaptionStatus = "idle" | "processing" | "ready" | "error";
type Preview =
  | { kind: "video"; src: string; title: string }
  | { kind: "audio"; src: string; title: string }
  | { kind: "embed"; src: string; title: string; youtubeId?: string }
  | { kind: "linked"; src: string; title: string };

type CaptionResponse = {
  success: boolean;
  source_language: LanguageCode;
  target_language: LanguageCode;
  caption: string;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_VERSE_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

const DEMO_VIDEO_ID = "nBpPe9UweWs";
const DEMO_PREVIEW: Preview = {
  kind: "embed",
  src: `https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}?rel=0&cc_load_policy=0`,
  title: "Weather and Small Talk — 30 second demo",
  youtubeId: DEMO_VIDEO_ID,
};

const INPUT_MODES = [
  { id: "link", label: "PASTE A LINK", number: "01" },
  { id: "upload", label: "UPLOAD MEDIA", number: "02" },
] as const;

const CAPTION_STYLES = [
  "Clean and readable",
  "Bold for short clips",
  "Minimal for films",
] as const;

const LANGUAGES: ReadonlyArray<{ code: LanguageCode; label: string }> = [
  { code: "en", label: "English" },
  { code: "ne", label: "Nepali" },
  { code: "mai", label: "Maithili" },
];

function languageLabel(code: LanguageCode): string {
  return LANGUAGES.find((language) => language.code === code)?.label ?? code;
}

function buildPreview(value: string): Preview | null {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const youtubeId =
      host === "youtu.be"
        ? url.pathname.split("/").filter(Boolean)[0]
        : host.includes("youtube.com")
          ? url.searchParams.get("v")
          : null;

    if (youtubeId) {
      return {
        kind: "embed",
        src: `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&cc_load_policy=0`,
        title: "YouTube video",
        youtubeId,
      };
    }

    const vimeoMatch = host.includes("vimeo.com")
      ? url.pathname.match(/\/(\d+)/)
      : null;

    if (vimeoMatch?.[1]) {
      return {
        kind: "embed",
        src: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        title: "Vimeo video",
      };
    }

    if (/\.(mp4|webm|ogg|mov)(?:$|\?)/i.test(url.href)) {
      return { kind: "video", src: url.href, title: "Linked video" };
    }

    return { kind: "linked", src: url.href, title: host };
  } catch {
    return null;
  }
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 19 19 5" />
      <path d="M8 5h11v11" />
    </svg>
  );
}

export default function TryVerse() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<InputMode>("link");
  const [videoLink, setVideoLink] = useState("");
  const [preview, setPreview] = useState<Preview | null>(DEMO_PREVIEW);
  const [mediaFile, setMediaFileState] = useState<File | null>(null);
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [captionStatus, setCaptionStatus] = useState<CaptionStatus>("idle");
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>("en");
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>("ne");
  const [currentCaption, setCurrentCaption] = useState("");
  const [captionStyle, setCaptionStyle] =
    useState<(typeof CAPTION_STYLES)[number]>(CAPTION_STYLES[0]);

  const isSending = captionStatus === "processing";

  useEffect(() => {
    return () => {
      if (
        (preview?.kind === "video" || preview?.kind === "audio") &&
        preview.src.startsWith("blob:")
      ) {
        URL.revokeObjectURL(preview.src);
      }
    };
  }, [preview]);

  useEffect(() => {
    if (!mediaFile && !submittedUrl) return;

    const controller = new AbortController();
    async function requestCaption() {
      setCaptionStatus("processing");
      setCurrentCaption("");
      setError("");

      const formData = new FormData();
      if (mediaFile) {
        formData.append("file", mediaFile);
      } else if (submittedUrl) {
        formData.append("video_url", submittedUrl);
      }
      formData.append("source_language", sourceLanguage);
      formData.append("target_language", targetLanguage);

      try {
        const response = await fetch(`${API_BASE_URL}/api/caption`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        const body = (await response.json().catch(() => ({}))) as
          | CaptionResponse
          | { detail?: string };

        if (!response.ok || !("caption" in body)) {
          throw new Error(
            "detail" in body && body.detail
              ? body.detail
              : "The caption server could not process this media.",
          );
        }

        setCurrentCaption(body.caption);
        setCaptionStatus("ready");
      } catch (requestError) {
        if (controller.signal.aborted) return;
        const message =
          requestError instanceof Error
            ? requestError.message
            : "The caption server could not be reached.";
        setError(message);
        setCaptionStatus("error");
      }
    }

    void requestCaption();
    return () => controller.abort();
  }, [mediaFile, sourceLanguage, submittedUrl, targetLanguage]);

  function chooseMode(nextMode: InputMode) {
    setMode(nextMode);
    setPreview(null);
    setMediaFileState(null);
    setSubmittedUrl(null);
    setCaptionStatus("idle");
    setCurrentCaption("");
    setError("");
  }

  function setMediaFile(file?: File) {
    const extension = file?.name.split(".").pop()?.toLowerCase();
    const supported = ["wav", "mp3", "m4a", "webm", "mp4", "mov"];
    const isVideo = Boolean(file?.type.startsWith("video/"));
    const isAudio = Boolean(file?.type.startsWith("audio/"));

    if (!file || ((!isVideo && !isAudio) || !supported.includes(extension ?? ""))) {
      setError("Choose a WAV, MP3, M4A, WEBM, MP4, or MOV file.");
      return;
    }

    setPreview({
      kind: isAudio ? "audio" : "video",
      src: URL.createObjectURL(file),
      title: file.name,
    });
    setMediaFileState(file);
    setSubmittedUrl(null);
    setCurrentCaption("");
    setError("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setMediaFile(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    setMediaFile(event.dataTransfer.files?.[0]);
  }

  function submitLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = videoLink.trim();
    const nextPreview = buildPreview(value);

    if (!nextPreview) {
      setError("Paste a complete video URL, including https://");
      return;
    }

    setPreview(nextPreview);
    setMediaFileState(null);
    setSubmittedUrl(value);
    setCurrentCaption("");
    setError("");
  }

  function resetPreview() {
    setPreview(null);
    setMediaFileState(null);
    setSubmittedUrl(null);
    setCaptionStatus("idle");
    setCurrentCaption("");
    setVideoLink("");
    setError("");
  }

  const captionCopy =
    captionStatus === "processing"
      ? "VERSE V2 IS LISTENING — LONG MEDIA IS PROCESSED IN 25-SECOND PARTS"
      : captionStatus === "error"
        ? "CAPTION GENERATION COULD NOT COMPLETE"
        : currentCaption || "SUBMIT MEDIA — THE GENERATED CAPTION WILL APPEAR HERE";

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.brand} href="/" aria-label="Return to Verse home">
            VERSE<span>.</span>
          </Link>
          <p>VIDEO IN / WORDS OUT</p>
          <Link className={styles.close} href="/" aria-label="Close Try Verse">
            <span />
            <span />
          </Link>
        </header>

        <div className={styles.workspace}>
          <section className={styles.statement}>
            <p>CAPTION INTAKE / READY</p>
            <h1>
              Bring the
              <span>media.</span>
              Keep every word.
            </h1>
            <div className={styles.statementNote}>
              <span>CC</span>
              <p>
                Start with a link or an audio/video file. Verse keeps the
                interface quiet so the media stays in focus.
              </p>
            </div>
          </section>

          <section className={styles.intake}>
            <div className={styles.modeSwitch} aria-label="Choose video source">
              {INPUT_MODES.map((item) => (
                <button
                  aria-pressed={mode === item.id}
                  className={mode === item.id ? styles.activeMode : ""}
                  key={item.id}
                  onClick={() => chooseMode(item.id)}
                  type="button"
                >
                  <span>{item.number}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <div
              className={`${styles.stage} ${isSending ? styles.isSending : ""}`}
            >
              <div className={styles.gradient} aria-hidden="true" />

              {preview ? (
                <div className={styles.preview}>
                  <header>
                    <span>{isSending ? "MODEL WORKING" : "VIDEO READY"}</span>
                    <strong>{preview.title}</strong>
                    <button onClick={resetPreview} type="button">
                      CHANGE
                    </button>
                  </header>

                  {preview.kind === "video" ? (
                    <video controls src={preview.src}>
                      Your browser does not support video playback.
                    </video>
                  ) : preview.kind === "audio" ? (
                    <div className={styles.audioStage}>
                      <div className={styles.audioWordmark} aria-hidden="true">
                        <span>AUDIO</span>
                        <strong>WORDS IN MOTION.</strong>
                      </div>
                      <audio controls src={preview.src}>
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  ) : preview.kind === "embed" ? (
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      key={preview.src}
                      src={preview.src}
                      title={preview.title}
                    />
                  ) : (
                    <div className={styles.linked}>
                      <span>LINK RECEIVED</span>
                      <strong>{preview.title}</strong>
                      <p>Verse sends this source to the model-backed caption service.</p>
                      <a href={preview.src} rel="noreferrer" target="_blank">
                        OPEN SOURCE <ArrowIcon />
                      </a>
                    </div>
                  )}

                  <div
                    className={styles.languageSwitch}
                    aria-label="Caption output language"
                  >
                    {LANGUAGES.map((language) => (
                      <button
                        aria-pressed={targetLanguage === language.code}
                        className={
                          targetLanguage === language.code
                            ? styles.activeLanguage
                            : ""
                        }
                        key={language.code}
                        onClick={() => setTargetLanguage(language.code)}
                        type="button"
                      >
                        {language.label.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div
                    aria-live="polite"
                    aria-busy={isSending}
                    className={`${styles.captionDemo} ${
                      currentCaption ? styles.captionActive : ""
                    }`}
                  >
                    <span>
                      VERSE V2 / {languageLabel(sourceLanguage).toUpperCase()} →{" "}
                      {languageLabel(targetLanguage).toUpperCase()}
                    </span>
                    <p>{captionCopy}</p>
                  </div>
                </div>
              ) : mode === "link" ? (
                <form className={styles.linkForm} onSubmit={submitLink}>
                  <div className={styles.index}>01 / LINK</div>
                  <div className={styles.linkCopy}>
                    <p>SHARE ANY VIDEO URL</p>
                    <h2>Paste it. We’ll take it from here.</h2>
                  </div>
                  <label htmlFor="video-url">
                    <span>VIDEO URL</span>
                    <input
                      autoFocus
                      id="video-url"
                      onChange={(event) => setVideoLink(event.target.value)}
                      placeholder="https://..."
                      type="url"
                      value={videoLink}
                    />
                  </label>
                  <button
                    aria-label="Use this video link"
                    disabled={!videoLink.trim()}
                    type="submit"
                  >
                    <span className={styles.arrowFront}>
                      <ArrowIcon />
                    </span>
                    <span className={styles.arrowBack}>
                      <ArrowIcon />
                    </span>
                  </button>
                </form>
              ) : (
                <button
                  className={`${styles.dropZone} ${
                    dragging ? styles.isDragging : ""
                  }`}
                  onClick={() => fileInput.current?.click()}
                  onDragEnter={() => setDragging(true)}
                  onDragLeave={() => setDragging(false)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                  type="button"
                >
                  <span className={styles.dropIndex}>02 / FILE</span>
                  <span className={styles.filmMark} aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <strong>DROP AUDIO OR VIDEO</strong>
                  <p>OR CLICK TO BROWSE</p>
                  <small>MP3 · WAV · M4A · MP4 · MOV · WEBM</small>
                </button>
              )}
            </div>

            <div className={styles.options}>
              <label htmlFor="source-language">
                <span>SPOKEN LANGUAGE</span>
                <select
                  id="source-language"
                  onChange={(event) =>
                    setSourceLanguage(event.target.value as LanguageCode)
                  }
                  value={sourceLanguage}
                >
                  {LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor="caption-style">
                <span>CAPTION STYLE</span>
                <select
                  id="caption-style"
                  onChange={(event) =>
                    setCaptionStyle(
                      event.target.value as (typeof CAPTION_STYLES)[number],
                    )
                  }
                  value={captionStyle}
                >
                  {CAPTION_STYLES.map((style) => (
                    <option key={style}>{style}</option>
                  ))}
                </select>
              </label>
              <p>
                <span>MODEL</span>
                GEMMA + VERSE V2
              </p>
            </div>

            {error ? <p className={styles.error}>{error}</p> : null}

            <input
              accept=".wav,.mp3,.m4a,.webm,.mp4,.mov,audio/*,video/*"
              className={styles.fileInput}
              onChange={handleFileChange}
              ref={fileInput}
              type="file"
            />
          </section>
        </div>
      </section>
    </main>
  );
}
