"use client";

import Image from "next/image";
import type { CSSProperties, MouseEvent } from "react";

const NAVIGATION = [
  { label: "ABOUT", href: "#about" },
  { label: "FEATURES", href: "#features" },
  { label: "LANGUAGES", href: "#languages" },
  { label: "CONTACT", href: "mailto:hello@boli.live" },
];

const FLOWER_PETALS = Array.from({ length: 6 }, (_, index) => index * 60);

function closeMobileMenu(event: MouseEvent<HTMLAnchorElement>) {
  event.currentTarget.closest("details")?.removeAttribute("open");
}

export default function Home() {
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
          <div className="hero-copy" id="about">
            <div className="headline-wrap">
              <p className="eyebrow">LIVE CAPTIONS • दुई भाषा • TWO LANGUAGES</p>
              <h1>
                CAPTIONS
                <br />
                THAT SPEAK
                <br />
                YOUR
                <br />
                LANGUAGE.
              </h1>

              <a className="language-disc" href="#languages" aria-label="Nepali and Maithili">
                <span>NEPALI</span>
                <span>+ MAITHILI</span>
              </a>
            </div>

            <p className="intro">
              Live captions that listen, understand, and keep up—bringing every
              Nepali and Maithili voice clearly onto the screen.
            </p>
          </div>

          <div className="visual-panel" id="features">
            <div className="panel-stamp" aria-hidden="true">
              <span>LISTEN</span>
              <span>UNDERSTAND</span>
              <span>CAPTION</span>
            </div>

            <div className="flower-frame" aria-hidden="true">
              <div className="petals">
                {FLOWER_PETALS.map((angle) => (
                  <span
                    className="petal"
                    key={angle}
                    style={{ "--petal-angle": `${angle}deg` } as CSSProperties}
                  />
                ))}
              </div>
              <div className="image-glow" />
              <Image
                className="hero-image"
                src="/Hero-section-image.png"
                alt="Three retro cassette tapes floating together"
                width={1024}
                height={1536}
                priority
                unoptimized
              />
            </div>

            <div className="language-key" id="languages">
              <span>नेपाली</span>
              <i aria-hidden="true" />
              <span>मैथिली</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
