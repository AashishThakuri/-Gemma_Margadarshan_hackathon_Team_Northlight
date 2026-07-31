"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import styles from "./studio.module.css";

type InputMode = "link" | "upload";
type Preview =
  | { kind: "video"; src: string; title: string }
  | { kind: "embed"; src: string; title: string }
  | { kind: "linked"; src: string; title: string };

const INPUT_MODES = [
  { id: "link", label: "PASTE A LINK", number: "01" },
  { id: "upload", label: "UPLOAD A VIDEO", number: "02" },
] as const;

const CAPTION_STYLES = [
  "Clean and readable",
  "Bold for short clips",
  "Minimal for films",
] as const;

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
        src: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
        title: "YouTube video",
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
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [captionStyle, setCaptionStyle] =
    useState<(typeof CAPTION_STYLES)[number]>(CAPTION_STYLES[0]);

  useEffect(() => {
    return () => {
      if (preview?.kind === "video" && preview.src.startsWith("blob:")) {
        URL.revokeObjectURL(preview.src);
      }
    };
  }, [preview]);

  function setVideoFile(file?: File) {
    if (!file || !file.type.startsWith("video/")) {
      setError("Choose a video file to continue.");
      return;
    }

    if (preview?.kind === "video" && preview.src.startsWith("blob:")) {
      URL.revokeObjectURL(preview.src);
    }

    setPreview({
      kind: "video",
      src: URL.createObjectURL(file),
      title: file.name,
    });
    setError("");
    setIsSending(true);
    window.setTimeout(() => setIsSending(false), 900);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setVideoFile(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    setVideoFile(event.dataTransfer.files?.[0]);
  }

  function submitLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPreview = buildPreview(videoLink.trim());

    if (!nextPreview) {
      setError("Paste a complete video URL, including https://");
      return;
    }

    setPreview(nextPreview);
    setError("");
    setIsSending(true);
    window.setTimeout(() => setIsSending(false), 900);
  }

  function resetPreview() {
    setPreview(null);
    setVideoLink("");
    setError("");
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <a className={styles.brand} href="/" aria-label="Return to Verse home">
            VERSE<span>.</span>
          </a>
          <p>VIDEO IN / WORDS OUT</p>
          <a className={styles.close} href="/" aria-label="Close Try Verse">
            <span />
            <span />
          </a>
        </header>

        <div className={styles.workspace}>
          <section className={styles.statement}>
            <p>CAPTION INTAKE / READY</p>
            <h1>
              Bring the
              <span>video.</span>
              Keep every word.
            </h1>
            <div className={styles.statementNote}>
              <span>CC</span>
              <p>
                Start with a link or a file. Verse keeps the interface quiet so
                the video stays in focus.
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
                  onClick={() => {
                    setMode(item.id);
                    setError("");
                  }}
                  type="button"
                >
                  <span>{item.number}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <div
              className={`${styles.stage} ${
                isSending ? styles.isSending : ""
              }`}
            >
              <div className={styles.gradient} aria-hidden="true" />

              {preview ? (
                <div className={styles.preview}>
                  <header>
                    <span>VIDEO READY</span>
                    <strong>{preview.title}</strong>
                    <button onClick={resetPreview} type="button">
                      CHANGE
                    </button>
                  </header>

                  {preview.kind === "video" ? (
                    <video controls src={preview.src}>
                      Your browser does not support video playback.
                    </video>
                  ) : preview.kind === "embed" ? (
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      src={preview.src}
                      title={preview.title}
                    />
                  ) : (
                    <div className={styles.linked}>
                      <span>LINK RECEIVED</span>
                      <strong>{preview.title}</strong>
                      <p>
                        The source is ready. Continue when the caption engine is
                        connected.
                      </p>
                      <a href={preview.src} rel="noreferrer" target="_blank">
                        OPEN SOURCE <ArrowIcon />
                      </a>
                    </div>
                  )}

                  <div className={styles.captionDemo}>
                    <span>LIVE CAPTION</span>
                    <p>Every word arrives with the moment.</p>
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
                  <strong>DROP A VIDEO HERE</strong>
                  <p>OR CLICK TO BROWSE</p>
                  <small>MP4 · MOV · WEBM</small>
                </button>
              )}
            </div>

            <div className={styles.options}>
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
                <span>SESSION</span>
                LOCAL / PRIVATE
              </p>
            </div>

            {error ? <p className={styles.error}>{error}</p> : null}

            <input
              accept="video/*"
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
