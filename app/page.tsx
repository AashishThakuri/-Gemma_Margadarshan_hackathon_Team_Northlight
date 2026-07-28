"use client";

import Image from "next/image";
import { animate, createScope } from "animejs";
import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";

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

    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const scope = createScope({ root }).add(() => {
      animate(".reference-art", {
        y: ["-0.25rem", "0.3rem"],
        rotate: [-0.35, 0.35],
        scale: [1.012, 1.025],
        duration: 4500,
        ease: "inOutSine",
        alternate: true,
        loop: true,
      });
    });

    return () => scope.revert();
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
            <Image
              className="reference-art"
              src="/poster-art-right.png"
              alt="Three oversized retro cassette tapes over a cream flower"
              width={783}
              height={830}
              priority
              unoptimized
            />
          </section>
        </div>
      </section>
    </main>
  );
}
