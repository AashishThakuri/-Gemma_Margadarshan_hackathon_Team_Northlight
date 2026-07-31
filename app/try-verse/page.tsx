"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import styles from "./studio.module.css";

const STUDIO_NAVIGATION = [
  { label: "Caption room", marker: "01", target: "caption-room" },
  { label: "Signal desk", marker: "02", target: "signal-desk" },
  { label: "Recent cuts", marker: "03", target: "recent-cuts" },
] as const;

const LANGUAGES = ["BOTH", "NEPALI", "MAITHILI"] as const;
type Language = (typeof LANGUAGES)[number];

const CAPTION_REEL = [
  {
    nepali: "हरेक शब्द, ठीक समयमा।",
    maithili: "हरेक शब्द, ठीक समय पर।",
  },
  {
    nepali: "तपाईं हेर्नुहोस्। भर्सले सुन्छ।",
    maithili: "अहाँ देखू। भर्स सुनैत अछि।",
  },
  {
    nepali: "कथा चलिरहन्छ, अर्थ छुट्दैन।",
    maithili: "कथा चलैत रहैत अछि, अर्थ नहि छुटैत अछि।",
  },
  {
    nepali: "अब आवाज पढ्न सकिन्छ।",
    maithili: "आब आवाज पढ़ल जा सकैत अछि।",
  },
] as const;

const RECENT_CUTS = [
  {
    id: "mountain-lesson",
    title: "THE MOUNTAIN LESSON",
    detail: "NEPALI · 08:42",
    palette: "coral",
    caption: "कथा चलिरहन्छ, अर्थ छुट्दैन।",
  },
  {
    id: "mithila-stories",
    title: "MITHILA STORIES",
    detail: "MAITHILI · 12:16",
    palette: "sage",
    caption: "आब आवाज पढ़ल जा सकैत अछि।",
  },
  {
    id: "city-interview",
    title: "CITY INTERVIEW",
    detail: "BILINGUAL · 04:09",
    palette: "cream",
    caption: "Every voice stays in the frame.",
  },
] as const;

function isVideoAddress(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function TryVerse() {
  const fileInput = useRef<HTMLInputElement>(null);
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState("");
  const [demoCaption, setDemoCaption] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("BOTH");
  const [captioning, setCaptioning] = useState(false);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [command, setCommand] = useState("");
  const [commandBurst, setCommandBurst] = useState(false);

  const captions = useMemo(() => CAPTION_REEL[captionIndex], [captionIndex]);

  useEffect(() => {
    return () => {
      if (videoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(videoUrl);
      }
      if (burstTimer.current) {
        clearTimeout(burstTimer.current);
      }
    };
  }, [videoUrl]);

  function loadFile(file?: File) {
    if (!file || !file.type.startsWith("video/")) {
      return;
    }

    if (videoUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(videoUrl);
    }

    setVideoUrl(URL.createObjectURL(file));
    setVideoName(file.name);
    setDemoCaption(null);
    setCaptioning(true);
    setCaptionIndex(0);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    loadFile(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    loadFile(event.dataTransfer.files?.[0]);
  }

  function triggerCommandBurst() {
    setCommandBurst(false);
    requestAnimationFrame(() => setCommandBurst(true));
    if (burstTimer.current) {
      clearTimeout(burstTimer.current);
    }
    burstTimer.current = setTimeout(() => setCommandBurst(false), 1100);
  }

  function handleCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = command.trim();
    if (!value) {
      fileInput.current?.click();
      return;
    }

    triggerCommandBurst();
    if (isVideoAddress(value)) {
      if (videoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(videoUrl);
      }
      setVideoUrl(value);
      setVideoName("LINKED VIDEO");
      setDemoCaption(null);
      setCaptioning(true);
      setCaptionIndex(0);
    } else {
      setVideoName(value.toUpperCase());
    }
    setCommand("");
  }

  function loadRecentCut(project: (typeof RECENT_CUTS)[number]) {
    if (videoUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setVideoName(project.title);
    setDemoCaption(project.caption);
    setCaptioning(true);
    setCaptionIndex(RECENT_CUTS.findIndex((item) => item.id === project.id));
    document.getElementById("caption-room")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function displayCaptionLines() {
    if (demoCaption) {
      return <span>{demoCaption}</span>;
    }

    if (language === "NEPALI") {
      return <span>{captions.nepali}</span>;
    }
    if (language === "MAITHILI") {
      return <span>{captions.maithili}</span>;
    }
    return (
      <>
        <span>{captions.nepali}</span>
        <span>{captions.maithili}</span>
      </>
    );
  }

  const hasProject = Boolean(videoUrl || demoCaption);

  return (
    <main className={styles.studio}>
      <aside className={styles.sidebar}>
        <a className={styles.brand} href="/" aria-label="Return to Verse home">
          VERSE<span>.</span>
        </a>

        <p className={styles.sidebarLabel}>LIVE CAPTION STUDIO / 01</p>

        <nav className={styles.sidebarNavigation} aria-label="Studio navigation">
          {STUDIO_NAVIGATION.map((item) => (
            <a href={`#${item.target}`} key={item.target}>
              <span>{item.marker}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className={styles.signalCard}>
          <div className={styles.signalReel} aria-hidden="true">
            <i />
            <i />
          </div>
          <p>SIGNAL</p>
          <strong>{captioning ? "RECEIVING" : "STANDBY"}</strong>
          <div aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => (
              <i
                key={index}
                style={
                  {
                    "--delay": `${index * -70}ms`,
                    "--level": `${24 + (index % 5) * 16}%`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </div>

        <a className={styles.backLink} href="/">
          <span>↙</span> BACK TO THE FILM
        </a>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <span>VERSE OS</span>
            <i aria-hidden="true" />
            <strong>{captioning ? "CAPTION SIGNAL LOCKED" : "READY FOR PICTURE"}</strong>
          </div>
          <time>00:{String(captionIndex * 4).padStart(2, "0")}:12</time>
        </header>

        <section className={styles.captionRoom} id="caption-room">
          <div className={styles.intro}>
            <p>THE CAPTION CUTTING ROOM</p>
            <h1>
              GIVE THE PICTURE
              <span>A VOICE YOU CAN SEE.</span>
            </h1>
          </div>

          <div className={styles.languageDeck} aria-label="Caption language">
            <span>LISTEN IN</span>
            <div>
              {LANGUAGES.map((item) => (
                <button
                  className={language === item ? styles.activeLanguage : ""}
                  key={item}
                  onClick={() => setLanguage(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <section
            className={`${styles.stage} ${dragging ? styles.isDragging : ""}`}
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <div className={styles.stageHeader}>
              <span>FRAME / 24 FPS</span>
              <p>
                <i aria-hidden="true" />
                {hasProject ? videoName : "NO FILM LOADED"}
              </p>
              <span>CC / LIVE</span>
            </div>

            {hasProject ? (
              <div className={styles.player}>
                {videoUrl ? (
                  <video
                    controls
                    onPause={() => setCaptioning(false)}
                    onPlay={() => setCaptioning(true)}
                    onTimeUpdate={(event) => {
                      const nextIndex =
                        Math.floor(event.currentTarget.currentTime / 4) %
                        CAPTION_REEL.length;
                      setCaptionIndex(nextIndex);
                    }}
                    src={videoUrl}
                  >
                    Your browser does not support video playback.
                  </video>
                ) : (
                  <div className={styles.demoFilm} aria-label="Caption demo frame">
                    <span>VOICE</span>
                    <span>BECOMES</span>
                    <span>VISIBLE</span>
                    <div aria-hidden="true" />
                  </div>
                )}

                {captioning && (
                  <div className={styles.captionOverlay} aria-live="polite">
                    <small>VERSE / LIVE</small>
                    {displayCaptionLines()}
                  </div>
                )}

                <button
                  className={styles.replaceButton}
                  onClick={() => fileInput.current?.click()}
                  type="button"
                >
                  REPLACE FILM ↗
                </button>
              </div>
            ) : (
              <button
                className={styles.dropZone}
                onClick={() => fileInput.current?.click()}
                type="button"
              >
                <span className={styles.dropGlyph} aria-hidden="true">
                  <i />
                  <i />
                  <b>CC</b>
                </span>
                <strong>DROP THE MOVING PICTURE</strong>
                <p>OR TAP TO OPEN A VIDEO</p>
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
        </section>

        <section className={styles.signalDesk} id="signal-desk">
          <div className={styles.captionControls}>
            <div>
              <p>CAPTION MOTOR</p>
              <strong>{captioning ? "WORDS ARE ARRIVING" : "MOTOR PAUSED"}</strong>
            </div>
            <button
              aria-pressed={captioning}
              className={captioning ? styles.motorOn : ""}
              disabled={!hasProject}
              onClick={() => setCaptioning((current) => !current)}
              type="button"
            >
              <span />
              {captioning ? "ON" : "OFF"}
            </button>
          </div>

          <div className={styles.transcriptRail}>
            <p>CAPTION REEL</p>
            <div>
              {CAPTION_REEL.map((caption, index) => (
                <button
                  className={captionIndex === index ? styles.activeCue : ""}
                  key={caption.nepali}
                  onClick={() => setCaptionIndex(index)}
                  type="button"
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>
                    {language === "MAITHILI" ? caption.maithili : caption.nepali}
                  </p>
                  <time>00:{String(index * 4).padStart(2, "0")}</time>
                </button>
              ))}
            </div>
          </div>
        </section>

        <form
          className={`${styles.commandBar} ${
            commandBurst ? styles.commandBurst : ""
          }`}
          onSubmit={handleCommand}
        >
          <div className={styles.commandGlow} aria-hidden="true" />
          <label htmlFor="video-command">
            <span>QUICK LOAD</span>
            <input
              autoComplete="off"
              id="video-command"
              onChange={(event) => setCommand(event.target.value)}
              placeholder="PASTE A VIDEO LINK OR NAME THIS CUT..."
              value={command}
            />
          </label>
          <button aria-label="Load video link" type="submit">
            <span>↗</span>
          </button>
        </form>

        <section className={styles.recentSection} id="recent-cuts">
          <header>
            <div>
              <p>ARCHIVE / LOCAL</p>
              <h2>RECENT CUTS</h2>
            </div>
            <span>03 FILMS / NO CLOUD NEEDED</span>
          </header>

          <div className={styles.recentGrid}>
            {RECENT_CUTS.map((project, index) => (
              <button
                className={`${styles.recentCard} ${
                  styles[`palette${project.palette}`]
                }`}
                key={project.id}
                onClick={() => loadRecentCut(project)}
                type="button"
              >
                <div className={styles.cardArtwork}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                  <p>{project.caption}</p>
                </div>
                <footer>
                  <div>
                    <strong>{project.title}</strong>
                    <small>{project.detail}</small>
                  </div>
                  <span>↗</span>
                </footer>
              </button>
            ))}
          </div>
        </section>

        <footer className={styles.studioFooter}>
          <p>VERSE CAPTION STUDIO</p>
          <span>THE VIDEO MOVES. UNDERSTANDING STAYS.</span>
          <time>© 2026</time>
        </footer>
      </section>
    </main>
  );
}
