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
type CaptionLanguage = "nepali" | "maithili";
type Preview =
  | { kind: "video"; src: string; title: string }
  | { kind: "embed"; src: string; title: string; youtubeId?: string }
  | { kind: "linked"; src: string; title: string };

type CaptionCue = {
  start: number;
  end: number;
  text: string;
};

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLIFrameElement,
        options: { events: { onReady: () => void } },
      ) => YouTubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const DEMO_VIDEO_ID = "nBpPe9UweWs";
const DEMO_PREVIEW: Preview = {
  kind: "embed",
  src: `https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}?enablejsapi=1&rel=0&cc_load_policy=0`,
  title: "Weather and Small Talk — 30 second demo",
  youtubeId: DEMO_VIDEO_ID,
};

const DEMO_CAPTIONS: Record<CaptionLanguage, CaptionCue[]> = {
  nepali: [
    {
      start: 4.97,
      end: 8.969,
      text: "ब्रर्र! आज त साह्रै जाडो छ। हो, अलि चिसो छ।",
    },
    {
      start: 8.969,
      end: 12.75,
      text: "पच्चीस डिग्री छ। बेलायतमा यो कति हुन्थ्यो?",
    },
    {
      start: 12.75,
      end: 17.75,
      text: "ओहो, शून्यभन्दा केही तल। तर म अङ्ग्रेज हुँ भनेर कसरी थाहा पाउनुभयो?",
    },
    {
      start: 17.75,
      end: 20.97,
      text: "तपाईंको लवजबाट थाहा पाएँ। ओहो!",
    },
  ],
  maithili: [
    {
      start: 4.97,
      end: 8.969,
      text: "बाप रे! आइ बहुत जाड़ अछि। हँ, कनिक ठंढ अछि।",
    },
    {
      start: 8.969,
      end: 12.75,
      text: "पच्चीस डिग्री अछि। इंग्लैंडमे ई कतेक होइत?",
    },
    {
      start: 12.75,
      end: 17.75,
      text: "ओह, शून्यसँ किछु कम। मुदा अहाँकेँ कोना बुझल जे हम अंग्रेज छी?",
    },
    {
      start: 17.75,
      end: 20.97,
      text: "अहाँक लहजासँ बुझि गेलहुँ। ओह!",
    },
  ],
};

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
        src: `https://www.youtube-nocookie.com/embed/${youtubeId}?enablejsapi=1&rel=0&cc_load_policy=0`,
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
  const youtubeFrame = useRef<HTMLIFrameElement>(null);
  const youtubePlayer = useRef<YouTubePlayer | null>(null);
  const captionClock = useRef<number | null>(null);
  const playbackTime = useRef(0);
  const captionLanguageRef = useRef<CaptionLanguage>("nepali");
  const [mode, setMode] = useState<InputMode>("link");
  const [videoLink, setVideoLink] = useState("");
  const [preview, setPreview] = useState<Preview | null>(DEMO_PREVIEW);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [captionLanguage, setCaptionLanguage] =
    useState<CaptionLanguage>("nepali");
  const [currentCaption, setCurrentCaption] = useState("");
  const [captionStyle, setCaptionStyle] =
    useState<(typeof CAPTION_STYLES)[number]>(CAPTION_STYLES[0]);

  useEffect(() => {
    captionLanguageRef.current = captionLanguage;
    const cue = DEMO_CAPTIONS[captionLanguage].find(
      ({ start, end }) =>
        playbackTime.current >= start && playbackTime.current < end,
    );
    setCurrentCaption(cue?.text ?? "");
  }, [captionLanguage]);

  useEffect(() => {
    return () => {
      if (preview?.kind === "video" && preview.src.startsWith("blob:")) {
        URL.revokeObjectURL(preview.src);
      }
    };
  }, [preview]);

  useEffect(() => {
    if (
      preview?.kind !== "embed" ||
      !preview.youtubeId ||
      !youtubeFrame.current
    ) {
      setCurrentCaption("");
      return;
    }

    let cancelled = false;

    const syncCaption = () => {
      try {
        playbackTime.current = youtubePlayer.current?.getCurrentTime() ?? 0;
        if (preview.youtubeId !== DEMO_VIDEO_ID) return;

        const cue = DEMO_CAPTIONS[captionLanguageRef.current].find(
          ({ start, end }) =>
            playbackTime.current >= start && playbackTime.current < end,
        );
        setCurrentCaption((current) =>
          current === (cue?.text ?? "") ? current : (cue?.text ?? ""),
        );
      } catch {
        // The player may not be ready during its first few frames.
      }
    };

    const connectPlayer = () => {
      if (cancelled || !window.YT?.Player || !youtubeFrame.current) return;
      youtubePlayer.current?.destroy();
      youtubePlayer.current = new window.YT.Player(youtubeFrame.current, {
        events: {
          onReady: () => {
            syncCaption();
            captionClock.current = window.setInterval(syncCaption, 100);
          },
        },
      });
    };

    if (window.YT?.Player) {
      connectPlayer();
    } else {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        connectPlayer();
      };

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      if (captionClock.current !== null) {
        window.clearInterval(captionClock.current);
        captionClock.current = null;
      }
      youtubePlayer.current?.destroy();
      youtubePlayer.current = null;
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
                    setPreview(null);
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
                      key={preview.src}
                      ref={preview.youtubeId ? youtubeFrame : undefined}
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

                  {preview.kind === "embed" &&
                  preview.youtubeId === DEMO_VIDEO_ID ? (
                    <>
                      <div
                        className={styles.languageSwitch}
                        aria-label="Caption language"
                      >
                        {(["nepali", "maithili"] as const).map((language) => (
                          <button
                            aria-pressed={captionLanguage === language}
                            className={
                              captionLanguage === language
                                ? styles.activeLanguage
                                : ""
                            }
                            key={language}
                            onClick={() => setCaptionLanguage(language)}
                            type="button"
                          >
                            {language.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <div
                        aria-live="polite"
                        className={`${styles.captionDemo} ${
                          currentCaption ? styles.captionActive : ""
                        }`}
                      >
                        <span>LIVE / {captionLanguage.toUpperCase()}</span>
                        <p>
                          {currentCaption ||
                            "PLAY THE VIDEO — CAPTIONS BEGIN WITH THE FIRST WORD"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className={styles.captionDemo}>
                      <span>VIDEO READY</span>
                      <p>Caption processing is ready for this source.</p>
                    </div>
                  )}
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
