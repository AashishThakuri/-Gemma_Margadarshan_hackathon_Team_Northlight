"use client";

import Image from "next/image";
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

          <section className="visual-panel" id="features" aria-label="Live caption visual">
            <Image
              className="reference-art"
              src="/poster-reference.png"
              alt="Three oversized retro cassette tapes over a cream flower"
              width={1731}
              height={909}
              priority
              unoptimized
            />
          </section>
        </div>
      </section>
    </main>
  );
}
