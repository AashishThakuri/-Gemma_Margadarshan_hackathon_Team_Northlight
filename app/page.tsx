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
  { id: "middle-right", x: 477, y: 414, size: 34 },
  { id: "bottom-left", x: 294, y: 663, size: 33 },
  { id: "bottom-right", x: 439, y: 677, size: 33 },
] as const;

const CASSETTE_WINDOWS = [
  { id: "top", x: 405, y: 181, width: 76, height: 42, rotate: -7 },
  { id: "middle", x: 401, y: 423, width: 74, height: 39, rotate: -1 },
  { id: "bottom", x: 366, y: 672, width: 68, height: 37, rotate: 4 },
] as const;

const NAVIGATION = [
  { label: "ABOUT", href: "#about" },
  { label: "FEATURES", href: "#features" },
  { label: "LANGUAGES", href: "#languages" },
  { label: "CONTACT", href: "mailto:hello@boli.live" },
];

function closeMobileMenu(event: MouseEvent<HTMLAnchorElement>) {
  event.currentTarget.closest("details")?.removeAttribute("open");
}

export default function Home() {
  const artworkRoot = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = artworkRoot.current;

    if (!root) {
      return;
    }

    const syncArtworkMarkers = () => {
      const scale = Math.max(
        root.clientWidth / ARTWORK_SIZE.width,
        root.clientHeight / ARTWORK_SIZE.height,
      );
      const offsetX = (root.clientWidth - ARTWORK_SIZE.width * scale) / 2;
      const offsetY = (root.clientHeight - ARTWORK_SIZE.height * scale) / 2;

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

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => markerObserver.disconnect();
    }

    const scope = createScope({ root }).add(() => {
      animate(".artwork-motion", {
        y: ["-0.18rem", "0.22rem"],
        rotate: [-0.22, 0.22],
        scale: [1.006, 1.014],
        duration: 4800,
        ease: "inOutSine",
        alternate: true,
        loop: true,
      });

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
          <section className="message-panel" id="about">
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
            id="features"
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
                    className="artwork-marker reel-marker"
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
      </section>
    </main>
  );
}
