"use client";

import Image from "next/image";
import { animate, createScope } from "animejs";
import { useEffect, useRef } from "react";
import type { CSSProperties, MouseEvent } from "react";

const ARTWORK_SIZE = { width: 783, height: 830 } as const;

const CASSETTE_REELS = [
  { id: "top-left", x: 330, y: 193, size: 36 },
  { id: "top-right", x: 480, y: 167, size: 36 },
  { id: "middle-left", x: 326, y: 432, size: 34 },
  { id: "middle-right", x: 477, y: 421, size: 34 },
  { id: "bottom-left", x: 294, y: 670, size: 33 },
  { id: "bottom-right", x: 439, y: 684, size: 33 },
] as const;

const CASSETTE_WINDOWS = [
  { id: "top", x: 405, y: 181, width: 76, height: 42, rotate: -7 },
  { id: "middle", x: 401, y: 423, width: 74, height: 39, rotate: -1 },
  { id: "bottom", x: 366, y: 672, width: 68, height: 37, rotate: 4 },
] as const;

const ABOUT_ARTWORK_SIZE = { width: 1295, height: 1216 } as const;

const ABOUT_CASSETTE_REELS = [
  { id: "left", x: 490, y: 633, size: 70 },
  { id: "right", x: 786, y: 635, size: 70 },
] as const;

const ABOUT_CASSETTE_WINDOW = {
  x: 642,
  y: 620,
  width: 150,
  height: 70,
} as const;

const NAVIGATION = [
  { label: "ABOUT", href: "#about" },
  { label: "FEATURES", href: "#features" },
  { label: "EDITIONS", href: "#editions" },
  { label: "LANGUAGES", href: "#languages" },
  { label: "CONTACT", href: "mailto:hello@boli.live" },
];

const FEATURES = [
  {
    heading: "REAL-TIME CAPTIONS",
    subheading:
      "See every word as it happens with ultra-low delay, so you never miss a thing.",
  },
  {
    heading: "HIGH ACCURACY",
    subheading:
      "AI-powered precision designed to understand context, not just words.",
  },
  {
    heading: "MULTI-LANGUAGE",
    subheading:
      "Built for seamless Nepali and Maithili conversations across every kind of video.",
  },
  {
    heading: "ACCESSIBLE FOR ALL",
    subheading:
      "Clear, readable captions designed so everyone can follow along.",
  },
] as const;

const EDITIONS = [
  {
    number: "01",
    title: "LIVE AS SPOKEN",
    subtitle: "Real-time captions",
    theme: "coral",
    mark: "LIVE",
  },
  {
    number: "02",
    title: "TWO TONGUES",
    subtitle: "Nepali + Maithili",
    theme: "cream",
    mark: "दुई",
  },
  {
    number: "03",
    title: "CLEAR ENOUGH",
    subtitle: "Readable for everyone",
    theme: "sage",
    mark: "CC",
  },
  {
    number: "04",
    title: "EVERY FRAME",
    subtitle: "Video without barriers",
    theme: "ink",
    mark: "PLAY",
  },
] as const;

function closeMobileMenu(event: MouseEvent<HTMLAnchorElement>) {
  event.currentTarget.closest("details")?.removeAttribute("open");
}

function observeArtworkMarkers(
  root: HTMLElement,
  artworkSize: { width: number; height: number },
) {
  const syncArtworkMarkers = () => {
    const scale = Math.max(
      root.clientWidth / artworkSize.width,
      root.clientHeight / artworkSize.height,
    );
    const offsetX = (root.clientWidth - artworkSize.width * scale) / 2;
    const offsetY = (root.clientHeight - artworkSize.height * scale) / 2;

    root.querySelectorAll<HTMLElement>("[data-art-x]").forEach((marker) => {
      const x = Number(marker.dataset.artX);
      const y = Number(marker.dataset.artY);
      const width = Number(marker.dataset.artWidth ?? marker.dataset.artSize);
      const height = Number(marker.dataset.artHeight ?? marker.dataset.artSize);

      marker.style.setProperty("--marker-x", `${offsetX + x * scale}px`);
      marker.style.setProperty("--marker-y", `${offsetY + y * scale}px`);
      marker.style.setProperty("--marker-width", `${width * scale}px`);
      marker.style.setProperty("--marker-height", `${height * scale}px`);
    });
  };

  syncArtworkMarkers();
  const markerObserver = new ResizeObserver(syncArtworkMarkers);
  markerObserver.observe(root);
  return markerObserver;
}

export default function Home() {
  const artworkRoot = useRef<HTMLElement>(null);
  const aboutArtworkRoot = useRef<HTMLDivElement>(null);
  const editionsRoot = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = artworkRoot.current;

    if (!root) {
      return;
    }

    const markerObserver = observeArtworkMarkers(root, ARTWORK_SIZE);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => markerObserver.disconnect();
    }

    const scope = createScope({ root }).add(() => {
      animate(".reel-disc", {
        rotate: "1turn",
        duration: 2600,
        ease: "linear",
        loop: true,
      });

      animate(".tape-strip", {
        x: ["-42%", "42%"],
        opacity: [0.25, 0.72, 0.25],
        duration: 1800,
        delay: (_, index) => index * 240,
        ease: "inOutSine",
        alternate: true,
        loop: true,
      });
    });

    return () => {
      markerObserver.disconnect();
      scope.revert();
    };
  }, []);

  useEffect(() => {
    const root = editionsRoot.current;

    if (!root) {
      return;
    }

    const revealEditions = () => root.classList.add("is-visible");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealEditions();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          revealEditions();
          observer.disconnect();
        }
      },
      { threshold: 0.32 },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = aboutArtworkRoot.current;

    if (!root) {
      return;
    }

    const markerObserver = observeArtworkMarkers(root, ABOUT_ARTWORK_SIZE);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => markerObserver.disconnect();
    }

    const scope = createScope({ root }).add(() => {
      animate(".reel-disc", {
        rotate: "1turn",
        duration: 2300,
        ease: "linear",
        loop: true,
      });

      animate(".tape-strip", {
        x: ["-42%", "42%"],
        opacity: [0.28, 0.78, 0.28],
        duration: 1700,
        ease: "inOutSine",
        alternate: true,
        loop: true,
      });
    });

    return () => {
      markerObserver.disconnect();
      scope.revert();
    };
  }, []);

  return (
    <main className="page" id="home">
      <section className="site-shell" aria-label="Boli live captioning">
        <header className="navbar">
          <a className="brand" href="#home" aria-label="Boli home">
            BOLI<span>.</span>
          </a>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {NAVIGATION.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <a className="nav-cta" href="#features">
            TRY BOLI
          </a>

          <details className="mobile-menu">
            <summary aria-label="Open navigation">
              <span />
              <span />
              <span />
            </summary>
            <nav aria-label="Mobile navigation">
              {NAVIGATION.map((item) => (
                <a key={item.label} href={item.href} onClick={closeMobileMenu}>
                  {item.label}
                </a>
              ))}
              <a href="#features" onClick={closeMobileMenu}>
                TRY BOLI
              </a>
            </nav>
          </details>
        </header>

        <div className="hero">
          <section className="message-panel">
            <div className="headline-box">
              <h1>
                <span>LIVE</span>
                <span>CAPTIONS.</span>
                <span>TWO</span>
                <span>LANGUAGES.</span>
              </h1>
            </div>

            <a className="language-bar" id="languages" href="#features">
              NEPALI + MAITHILI
            </a>
          </section>

          <section
            className="visual-panel"
            aria-label="Live caption visual"
            ref={artworkRoot}
          >
            <div className="artwork-motion">
              <Image
                className="reference-art"
                src="/poster-art-right.png"
                alt="Three oversized retro cassette tapes over a cream flower"
                width={ARTWORK_SIZE.width}
                height={ARTWORK_SIZE.height}
                priority
                unoptimized
              />

              <div className="cassette-motion" aria-hidden="true">
                {CASSETTE_REELS.map((reel) => (
                  <span
                    className="artwork-marker reel-marker landing-reel-marker"
                    data-art-x={reel.x}
                    data-art-y={reel.y}
                    data-art-size={reel.size}
                    key={reel.id}
                  >
                    <span className="reel-disc" />
                  </span>
                ))}

                {CASSETTE_WINDOWS.map((window) => (
                  <span
                    className="artwork-marker tape-window"
                    data-art-x={window.x}
                    data-art-y={window.y}
                    data-art-width={window.width}
                    data-art-height={window.height}
                    key={window.id}
                    style={{
                      "--window-rotation": `${window.rotate}deg`,
                    } as CSSProperties}
                  >
                    <span className="tape-strip" />
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="about-section" id="about" aria-labelledby="about-title">
          <div className="about-visual" ref={aboutArtworkRoot}>
            <Image
              className="about-image"
              src="/about-section-image.png"
              alt="A retro live-caption cassette, headphones, speaker, and caption notes"
              width={1295}
              height={1216}
              unoptimized
            />

            <div className="about-cassette-motion" aria-hidden="true">
              {ABOUT_CASSETTE_REELS.map((reel) => (
                <span
                  className="artwork-marker reel-marker"
                  data-art-x={reel.x}
                  data-art-y={reel.y}
                  data-art-size={reel.size}
                  key={reel.id}
                >
                  <span className="reel-disc" />
                </span>
              ))}

              <span
                className="artwork-marker tape-window"
                data-art-x={ABOUT_CASSETTE_WINDOW.x}
                data-art-y={ABOUT_CASSETTE_WINDOW.y}
                data-art-width={ABOUT_CASSETTE_WINDOW.width}
                data-art-height={ABOUT_CASSETTE_WINDOW.height}
              >
                <span className="tape-strip" />
              </span>
            </div>
          </div>

          <div className="about-copy">
            <div className="about-heading">
              <h2 id="about-title">ABOUT</h2>
              <span aria-hidden="true">✦</span>
            </div>

            <div className="about-text">
              <p>
                Boli helps Nepali and Maithili speakers follow every kind of
                video without missing the moment. It listens as content plays
                and turns speech into clear, readable captions in real time.
              </p>
              <p>
                From lessons and livestreams to interviews and everyday clips,
                our goal is simple: make video easier to understand, more
                inclusive, and accessible wherever people press play.
              </p>
            </div>
          </div>
        </section>

        <section
          className="features-section"
          id="features"
          aria-labelledby="features-title"
        >
          <div className="features-copy">
            <header className="features-heading">
              <h2 id="features-title">FEATURES</h2>
              <p>Live captions made to understand every moment.</p>
            </header>

            <div className="feature-list">
              {FEATURES.map((feature) => (
                <article className="feature-row" key={feature.heading}>
                  <div className="feature-copy">
                    <h3>{feature.heading}</h3>
                    <p>{feature.subheading}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="features-visual">
            <Image
              className="features-image"
              src="/feature-art-turntable-v1.png"
              alt="A coral turntable surrounded by retro floral collage art"
              width={1254}
              height={1254}
              unoptimized
            />
            <span className="feature-disc-motion" aria-hidden="true" />
          </div>
        </section>

        <section
          className="editions-section"
          id="editions"
          aria-labelledby="editions-title"
          ref={editionsRoot}
        >
          <header className="editions-heading">
            <div>
              <p>BOLI / LANGUAGE COLLECTION</p>
              <h2 id="editions-title">BOLI EDITIONS</h2>
            </div>
            <p>
              Four pocket-sized stories about keeping every voice in the
              frame.
            </p>
          </header>

          <div className="editions-shelf">
            {EDITIONS.map((edition, index) => (
              <article
                className="edition-card"
                key={edition.title}
                style={{ "--edition-index": index } as CSSProperties}
              >
                <div className={`edition-book edition-book--${edition.theme}`}>
                  <span className="edition-page-block" aria-hidden="true" />
                  <span className="edition-bottom-pages" aria-hidden="true" />
                  <span className="edition-spine" aria-hidden="true">
                    <b>BOLI</b>
                    <small>{edition.number}</small>
                  </span>

                  <div className="edition-cover">
                    <span className="edition-number">{edition.number}</span>
                    <span className="edition-mark">{edition.mark}</span>
                    <div>
                      <h3>{edition.title}</h3>
                      <p>{edition.subtitle}</p>
                    </div>
                    <span className="edition-imprint">BOLI PRESS</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
