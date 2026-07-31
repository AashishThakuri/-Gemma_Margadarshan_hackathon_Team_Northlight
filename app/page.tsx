"use client";

import Image from "next/image";
import { animate, createScope } from "animejs";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";

const PRELOADER_WORDS = [
  {
    label: "VERSE.",
    language: "IDENTITY",
    color: "#11110c",
    foreground: "#f3d9b9",
  },
  {
    label: "सुन्नुहोस्",
    language: "NEPALI / LISTEN",
    color: "#d86f55",
    foreground: "#11110c",
  },
  {
    label: "सुनू",
    language: "MAITHILI / LISTEN",
    color: "#75b178",
    foreground: "#11110c",
  },
  {
    label: "UNDERSTAND.",
    language: "EVERY MOMENT",
    color: "#11110c",
    foreground: "#f3d9b9",
  },
] as const;

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
  { label: "LANGUAGES", href: "#languages" },
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
  const pageRoot = useRef<HTMLElement>(null);
  const preloaderRoot = useRef<HTMLDivElement>(null);
  const preloaderCounter = useRef<HTMLSpanElement>(null);
  const artworkRoot = useRef<HTMLElement>(null);
  const aboutArtworkRoot = useRef<HTMLDivElement>(null);
  const heroRoot = useRef<HTMLDivElement>(null);
  const [isPreloading, setIsPreloading] = useState(true);
  const [showFloatingNavigation, setShowFloatingNavigation] = useState(false);

  useEffect(() => {
    const root = preloaderRoot.current;
    const counter = preloaderCounter.current;

    if (!root || !counter) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    document.body.classList.add("is-loading");

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const progress = { value: 0 };

    const context = gsap.context(() => {
      const words = gsap.utils.toArray<HTMLElement>(".preloader-word");

      gsap.set(words, {
        autoAlpha: 0,
        rotateX: -72,
        yPercent: 125,
        transformOrigin: "50% 100%",
      });
      gsap.set(words[0], { autoAlpha: 1, rotateX: 0, yPercent: 0 });

      const timeline = gsap.timeline({
        defaults: { ease: "power4.out" },
        onComplete: () => {
          document.body.classList.remove("is-loading");
          setIsPreloading(false);
        },
      });

      timeline
        .to(
          progress,
          {
            value: 100,
            duration: reducedMotion ? 0.7 : 4.1,
            ease: "power2.inOut",
            onUpdate: () => {
              counter.textContent = String(Math.round(progress.value)).padStart(
                3,
                "0",
              );
            },
          },
          0,
        )
        .to(
          ".preloader-progress-fill",
          {
            scaleX: 1,
            duration: reducedMotion ? 0.7 : 4.1,
            ease: "power2.inOut",
          },
          0,
        );

      if (!reducedMotion) {
        words.forEach((word, index) => {
          if (index === 0) {
            timeline.to(
              word,
              {
                autoAlpha: 0,
                rotateX: 54,
                yPercent: -125,
                duration: 0.58,
                ease: "power3.in",
              },
              0.68,
            );
            return;
          }

          const revealAt = index * 0.86;
          timeline
            .to(
              root,
              {
                backgroundColor: PRELOADER_WORDS[index].color,
                color: PRELOADER_WORDS[index].foreground,
                duration: 0.52,
                ease: "power2.inOut",
              },
              revealAt - 0.2,
            )
            .to(
              word,
              {
                autoAlpha: 1,
                rotateX: 0,
                yPercent: 0,
                duration: 0.72,
              },
              revealAt,
            );

          if (index < words.length - 1) {
            timeline.to(
              word,
              {
                autoAlpha: 0,
                rotateX: 54,
                yPercent: -125,
                duration: 0.58,
                ease: "power3.in",
              },
              revealAt + 0.68,
            );
          }
        });
      } else {
        timeline.set(words, { autoAlpha: 0 }, 0.55);
        timeline.set(words.at(-1) ?? words[0], {
          autoAlpha: 1,
          rotateX: 0,
          yPercent: 0,
        });
      }

      timeline.to(
        root,
        {
          clipPath: "inset(0 0 100% 0 round 0 0 48% 48%)",
          duration: reducedMotion ? 0.3 : 0.95,
          ease: "power4.inOut",
        },
        reducedMotion ? 0.7 : 3.65,
      );
    }, root);

    return () => {
      document.body.classList.remove("is-loading");
      context.revert();
    };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      lerp: 0.16,
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1,
      wheelMultiplier: 1,
    });

    const updateScrollTrigger = () => ScrollTrigger.update();
    const tick = (time: number) => lenis.raf(time * 1000);

    lenis.on("scroll", updateScrollTrigger);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(500, 33);

    if (isPreloading) {
      lenis.stop();
    } else {
      lenis.start();
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }

    return () => {
      lenis.off("scroll", updateScrollTrigger);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [isPreloading]);

  useEffect(() => {
    const root = pageRoot.current;

    if (!root || isPreloading) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      return;
    }

    const context = gsap.context(() => {
      const opening = gsap.timeline({
        defaults: { ease: "power4.out" },
      });

      opening
        .fromTo(
          ".navbar",
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", duration: 0.9 },
          0,
        )
        .fromTo(
          ".headline-box h1 > span > i",
          { rotateX: -70, yPercent: 125 },
          {
            rotateX: 0,
            yPercent: 0,
            duration: 1.05,
            stagger: 0.09,
            transformOrigin: "50% 100%",
          },
          0.12,
        )
        .fromTo(
          ".language-bar",
          { clipPath: "inset(0 100% 0 0)" },
          { clipPath: "inset(0 0% 0 0)", duration: 0.95 },
          0.42,
        )
        .fromTo(
          ".visual-panel",
          { clipPath: "inset(0 0 100% 0)", filter: "saturate(.35)" },
          {
            clipPath: "inset(0 0 0% 0)",
            filter: "saturate(1)",
            duration: 1.25,
          },
          0.22,
        );

      gsap.fromTo(
        ".about-heading h2 > span",
        { rotateX: -68, yPercent: 120 },
        {
          rotateX: 0,
          yPercent: 0,
          duration: 1.05,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".about-copy",
            start: "top 72%",
            once: true,
          },
        },
      );

      gsap.fromTo(
        ".about-text p",
        { clipPath: "inset(0 0 100% 0)", y: "2.4rem" },
        {
          clipPath: "inset(0 0 0% 0)",
          y: 0,
          duration: 0.95,
          ease: "power3.out",
          stagger: 0.16,
          scrollTrigger: {
            trigger: ".about-text",
            start: "top 78%",
            once: true,
          },
        },
      );

      gsap.fromTo(
        ".features-heading h2 > span",
        { rotateX: -68, yPercent: 120 },
        {
          rotateX: 0,
          yPercent: 0,
          duration: 1.05,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".features-heading",
            start: "top 74%",
            once: true,
          },
        },
      );

      gsap.utils.toArray<HTMLElement>(".feature-row").forEach((row, index) => {
        gsap.fromTo(
          row.querySelectorAll("h3, p"),
          {
            clipPath: "inset(0 0 100% 0)",
            y: "2rem",
          },
          {
            clipPath: "inset(0 0 0% 0)",
            y: 0,
            duration: 0.82,
            ease: "power3.out",
            stagger: 0.11,
            delay: index * 0.025,
            scrollTrigger: {
              trigger: row,
              start: "top 86%",
              once: true,
            },
          },
        );
      });

      gsap.fromTo(
        ".footer-brand-lockup h2",
        { letterSpacing: "0.08em", opacity: 0 },
        {
          letterSpacing: "-0.075em",
          opacity: 1,
          duration: 1.05,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".site-footer",
            start: "top 88%",
            once: true,
          },
        },
      );
    }, root);

    return () => context.revert();
  }, [isPreloading]);

  useEffect(() => {
    const hero = heroRoot.current;

    if (!hero) {
      return;
    }

    const heroObserver = new IntersectionObserver(
      ([entry]) => setShowFloatingNavigation(!entry.isIntersecting),
      { threshold: 0 },
    );

    heroObserver.observe(hero);
    return () => heroObserver.disconnect();
  }, []);

  useEffect(() => {
    const root = artworkRoot.current;

    if (!root || isPreloading) {
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
  }, [isPreloading]);

  useEffect(() => {
    const root = aboutArtworkRoot.current;

    if (!root || isPreloading) {
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
  }, [isPreloading]);

  return (
    <main
      className={`page${isPreloading ? " is-preloading" : ""}`}
      id="home"
      ref={pageRoot}
    >
      {isPreloading && (
        <div
          className="preloader"
          ref={preloaderRoot}
          role="status"
          aria-label="Loading Verse"
        >
          <div className="preloader-meta">
            <span>VERSE / LIVE CAPTION SYSTEM</span>
            <span>LANGUAGE IS ARRIVING</span>
          </div>

          <div className="preloader-word-stage" aria-hidden="true">
            {PRELOADER_WORDS.map((word) => (
              <p className="preloader-word" key={word.label}>
                <span>{word.label}</span>
                <small>{word.language}</small>
              </p>
            ))}
          </div>

          <div className="preloader-orbit" aria-hidden="true" />

          <div className="preloader-progress">
            <span ref={preloaderCounter}>000</span>
            <div aria-hidden="true">
              <i className="preloader-progress-fill" />
            </div>
            <span>100</span>
          </div>
        </div>
      )}

      <section className="site-shell" aria-label="Verse live captioning">
        <header className="navbar">
          <a className="brand" href="#home" aria-label="Verse home">
            VERSE<span>.</span>
          </a>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {NAVIGATION.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <a className="nav-cta" href="#features">
            TRY VERSE
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
                TRY VERSE
              </a>
            </nav>
          </details>
        </header>

        <div className="hero" ref={heroRoot}>
          <section className="message-panel">
            <div className="headline-box">
              <h1>
                <span>
                  <i>LIVE</i>
                </span>
                <span>
                  <i>CAPTIONS.</i>
                </span>
                <span>
                  <i>TWO</i>
                </span>
                <span>
                  <i>LANGUAGES.</i>
                </span>
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
              <h2 id="about-title">
                <span>ABOUT</span>
              </h2>
              <span aria-hidden="true">✦</span>
            </div>

            <div className="about-text">
              <p>
                Verse helps Nepali and Maithili speakers follow every kind of
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
              <h2 id="features-title">
                <span>FEATURES</span>
              </h2>
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

        <footer className="site-footer" id="contact">
          <div className="footer-brand-lockup">
            <p>
              <span aria-hidden="true" />
              FINAL CAPTION / 00:00:00
            </p>
            <h2>
              VERSE<span>.</span>
            </h2>
          </div>

          <div className="footer-caption-line">
            <p>EVERY WORD, RIGHT WHEN IT MATTERS.</p>
            <i aria-hidden="true" />
          </div>

          <div className="footer-bottom">
            <p>© 2026 VERSE. ALL RIGHTS RESERVED.</p>
            <p>THE VIDEO MOVES. UNDERSTANDING STAYS.</p>
          </div>
        </footer>

        {showFloatingNavigation && (
          <details className="floating-navigation">
            <summary aria-label="Open page navigation">
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </summary>
            <nav aria-label="Floating page navigation">
              <a href="#home" onClick={closeMobileMenu}>
                <span>01</span>
                HOME
              </a>
              {NAVIGATION.map((item, index) => (
                <a href={item.href} key={item.href} onClick={closeMobileMenu}>
                  <span>{String(index + 2).padStart(2, "0")}</span>
                  {item.label}
                </a>
              ))}
            </nav>
          </details>
        )}
      </section>
    </main>
  );
}
