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

const NAVIGATION = [
  { label: "Home", code: "01", target: "studio-home" },
  { label: "Recent videos", code: "02", target: "recent-videos" },
  { label: "Caption guide", code: "03", target: "caption-guide" },
  { label: "Language desk", code: "04", target: "language-desk" },
] as const;

const LANGUAGES = ["NEPALI", "MAITHILI", "BOTH"] as const;
type Language = (typeof LANGUAGES)[number];

const CAPTIONS = [
  {
    nepali: "हरेक शब्द, ठीक समयमा।",
    maithili: "हरेक शब्द, ठीक समय पर।",
  },
  {
    nepali: "कथा चलिरहन्छ, अर्थ छुट्दैन।",
    maithili: "कथा चलैत रहैत अछि, अर्थ नहि छुटैत अछि।",
  },
  {
    nepali: "तपाईं हेर्नुहोस्। भर्सले सुन्छ।",
    maithili: "अहाँ देखू। भर्स सुनैत अछि।",
  },
] as const;

const RECENT_VIDEOS = [
  {
    id: "street-stories",
    title: "STREET STORIES",
    detail: "TODAY · NEPALI",
    color: "coral",
    caption: "कथा चलिरहन्छ, अर्थ छुट्दैन।",
    index: "A01",
  },
  {
    id: "mithila-notes",
    title: "MITHILA NOTES",
    detail: "TODAY · MAITHILI",
    color: "sage",
    caption: "अहाँ देखू। भर्स सुनैत अछि।",
    index: "B02",
  },
  {
    id: "studio-interview",
    title: "STUDIO INTERVIEW",
    detail: "YESTERDAY · BILINGUAL",
    color: "yellow",
    caption: "EVERY VOICE STAYS IN FRAME.",
    index: "C03",
  },
] as const;

function isWebAddress(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function TryVerse() {
  const fileInput = useRef<HTMLInputElement>(null);
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [demoCaption, setDemoCaption] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("BOTH");
  const [captionIndex, setCaptionIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [command, setCommand] = useState("");
  const [sending, setSending] = useState(false);

  const hasProject = Boolean(videoUrl || demoCaption);
  const activeCaption = CAPTIONS[captionIndex];

  useEffect(() => {
    return () => {
      if (videoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(videoUrl);
      }
      if (sendTimer.current) {
        clearTimeout(sendTimer.current);
      }
    };
  }, [videoUrl]);

  function loadVideo(file?: File) {
    if (!file || !file.type.startsWith("video/")) {
      return;
    }

    if (videoUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(videoUrl);
    }

    setVideoUrl(URL.createObjectURL(file));
    setProjectName(file.name.replace(/\.[^/.]+$/, "").toUpperCase());
    setDemoCaption(null);
    setCaptionIndex(0);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    loadVideo(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    loadVideo(event.dataTransfer.files?.[0]);
  }

  function flashCommand() {
    setSending(false);
    requestAnimationFrame(() => setSending(true));
    if (sendTimer.current) {
      clearTimeout(sendTimer.current);
    }
    sendTimer.current = setTimeout(() => setSending(false), 900);
  }

  function submitCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = command.trim();

    if (!value) {
      fileInput.current?.click();
      return;
    }

    flashCommand();
    if (isWebAddress(value)) {
      if (videoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(videoUrl);
      }
      setVideoUrl(value);
      setProjectName("LINKED VIDEO");
      setDemoCaption(null);
      setCaptionIndex(0);
    } else {
      setProjectName(value.toUpperCase());
    }
    setCommand("");
  }

  function openRecent(project: (typeof RECENT_VIDEOS)[number]) {
    if (videoUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setProjectName(project.title);
    setDemoCaption(project.caption);
    setLanguage(project.detail.includes("MAITHILI") ? "MAITHILI" : "BOTH");
    setCaptionIndex(RECENT_VIDEOS.findIndex((item) => item.id === project.id));
    document.getElementById("studio-home")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function captionLines() {
    if (demoCaption) {
      return <strong>{demoCaption}</strong>;
    }
    if (language === "NEPALI") {
      return <strong>{activeCaption.nepali}</strong>;
    }
    if (language === "MAITHILI") {
      return <strong>{activeCaption.maithili}</strong>;
    }
    return (
      <>
        <strong>{activeCaption.nepali}</strong>
        <strong>{activeCaption.maithili}</strong>
      </>
    );
  }

  return (
    <main className={styles.app}>
      <aside className={styles.sidebar}>
        <a className={styles.logo} href="/" aria-label="Return to Verse home">
          VERSE<span>.</span>
        </a>

        <nav aria-label="Caption studio navigation">
          {NAVIGATION.map((item) => (
            <a href={`#${item.target}`} key={item.target}>
              <span>{item.code}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <section className={styles.usageCard}>
          <header>
            <span>LOCAL MODE</span>
            <strong>PRIVATE</strong>
          </header>
          <div>
            <p>Video processing</p>
            <span>ON DEVICE</span>
          </div>
          <div>
            <p>Caption languages</p>
            <span>02 READY</span>
          </div>
          <div className={styles.usageBars} aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
          <small>YOUR VIDEO NEVER LEAVES THIS SCREEN.</small>
        </section>

        <a className={styles.homeLink} href="/">
          ← BACK TO WEBSITE
        </a>
      </aside>

      <section className={styles.content}>
        <header className={styles.topbar}>
          <div>
            <p>VERSE CAPTION STUDIO</p>
            <span>LOCAL SESSION / 001</span>
          </div>
          <a href="/">EXIT STUDIO ↗</a>
        </header>

        <div className={styles.dashboard} id="studio-home">
          <section className={styles.heading}>
            <div>
              <p>CAPTION WORKSPACE / READY</p>
              <h1>
                PUT YOUR VIDEO
                <span>INTO WORDS.</span>
              </h1>
            </div>
            <div className={styles.status}>
              <span>CC</span>
              <p>
                SIGNAL
                <strong>{hasProject ? "CONNECTED" : "WAITING"}</strong>
              </p>
            </div>
          </section>

          <form
            className={`${styles.command} ${sending ? styles.isSending : ""}`}
            onSubmit={submitCommand}
          >
            <div className={styles.commandSweep} aria-hidden="true" />
            <label htmlFor="video-link">
              <span>QUICK LOAD</span>
              <input
                autoComplete="off"
                id="video-link"
                onChange={(event) => setCommand(event.target.value)}
                placeholder="PASTE A VIDEO LINK OR NAME THIS PROJECT..."
                value={command}
              />
            </label>
            <button aria-label="Load video" type="submit">
              <span>↗</span>
            </button>
          </form>

          <section
            className={`${styles.uploadPanel} ${
              dragging ? styles.isDragging : ""
            }`}
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <header>
              <p>
                <span>VIDEO INPUT</span>
                <strong>{hasProject ? projectName : "NO FILE SELECTED"}</strong>
              </p>
              <p>
                <span>OUTPUT</span>
                <strong>{language}</strong>
              </p>
            </header>

            {hasProject ? (
              <div className={styles.preview}>
                {videoUrl ? (
                  <video
                    controls
                    onTimeUpdate={(event) => {
                      setCaptionIndex(
                        Math.floor(event.currentTarget.currentTime / 4) %
                          CAPTIONS.length,
                      );
                    }}
                    src={videoUrl}
                  >
                    Your browser does not support video playback.
                  </video>
                ) : (
                  <div className={styles.demoFrame}>
                    <span>THE IMAGE</span>
                    <span>KEEPS MOVING</span>
                    <span>THE MEANING STAYS</span>
                    <i aria-hidden="true" />
                  </div>
                )}

                <div className={styles.captionBubble} aria-live="polite">
                  <small>VERSE / LIVE CAPTION</small>
                  {captionLines()}
                </div>

                <button
                  className={styles.replace}
                  onClick={() => fileInput.current?.click()}
                  type="button"
                >
                  REPLACE VIDEO
                </button>
              </div>
            ) : (
              <button
                className={styles.dropArea}
                onClick={() => fileInput.current?.click()}
                type="button"
              >
                <span className={styles.uploadMark} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <b>CC</b>
                </span>
                <strong>DROP YOUR VIDEO HERE</strong>
                <p>OR CLICK TO CHOOSE A FILE</p>
                <small>MP4 · MOV · WEBM / LOCAL PREVIEW</small>
              </button>
            )}

            <input
              accept="video/mp4,video/quicktime,video/webm,video/*"
              className={styles.fileInput}
              onChange={handleFileChange}
              ref={fileInput}
              type="file"
            />
          </section>

          <section className={styles.controlRow} id="language-desk">
            <div>
              <p>CAPTION LANGUAGE</p>
              <div className={styles.languageButtons}>
                {LANGUAGES.map((item) => (
                  <button
                    className={language === item ? styles.selected : ""}
                    key={item}
                    onClick={() => setLanguage(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.captionGuide} id="caption-guide">
              <p>CAPTION GUIDE</p>
              <ol>
                {CAPTIONS.map((caption, index) => (
                  <li key={caption.nepali}>
                    <button
                      className={captionIndex === index ? styles.activeCue : ""}
                      onClick={() => setCaptionIndex(index)}
                      type="button"
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>
                        {language === "MAITHILI"
                          ? caption.maithili
                          : caption.nepali}
                      </strong>
                      <time>00:{String(index * 4).padStart(2, "0")}</time>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className={styles.recent} id="recent-videos">
            <header>
              <div>
                <p>ARCHIVE / LOCAL</p>
                <h2>RECENT VIDEOS</h2>
              </div>
              <span>SELECT A CUT TO PREVIEW</span>
            </header>

            <div className={styles.videoGrid}>
              {RECENT_VIDEOS.map((video) => (
                <button
                  className={`${styles.videoCard} ${
                    styles[`card${video.color}`]
                  }`}
                  key={video.id}
                  onClick={() => openRecent(video)}
                  type="button"
                >
                  <div className={styles.thumbnail}>
                    <span>{video.index}</span>
                    <div className={styles.frameLines} aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </div>
                    <p>{video.caption}</p>
                    <small>CC</small>
                  </div>
                  <footer>
                    <div>
                      <strong>{video.title}</strong>
                      <span>{video.detail}</span>
                    </div>
                    <b>↗</b>
                  </footer>
                </button>
              ))}
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <span>VERSE / CAPTION STUDIO</span>
          <p>THE VIDEO MOVES. UNDERSTANDING STAYS.</p>
          <span>© 2026</span>
        </footer>
      </section>
    </main>
  );
}
