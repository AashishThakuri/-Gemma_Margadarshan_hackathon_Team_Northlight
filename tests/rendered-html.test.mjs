import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Verse landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Verse — Live Nepali &amp; Maithili Captions<\/title>/);
  assert.match(html, /aria-label="Loading Verse"/);
  assert.match(html, />VERSE\.<\/span><\/p>/);
  assert.match(html, />पद्य<\/span><\/p>/);
  assert.match(html, />छंद<\/span><\/p>/);
  assert.match(html, />詩<\/span><\/p>/);
  assert.doesNotMatch(html, /ENGLISH|NEPALI \/ VERSE|HINDI \/ VERSE|JAPANESE \/ VERSE/);
  assert.match(html, /<nav class="desktop-nav" aria-label="Primary navigation">/);
  assert.match(html, /class="headline-word-gap">AS IT<\/i>/);
  assert.match(html, />HAPPENS\.<\/i>/);
  assert.match(html, />EVERY MOMENT, MADE CLEAR\.<\/a>/);
  assert.doesNotMatch(html, />TWO<\/i>|>LANGUAGES\.<\/i>|NEPALI \+ MAITHILI/);
  assert.match(
    html,
    /class="nav-cta nav-text-mono" href="\/try-verse">TRY VERSE<\/a>/,
  );
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("server-renders the functional Try Verse conversation", async () => {
  const response = await render("/try-verse");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /WORDS, IN MOTION/);
  assert.match(html, /What do you want/);
  assert.match(html, /to say\?/);
  assert.match(html, /Share a thought, a scene, or a line from your video\./);
  assert.match(html, /Type a message\.\.\./);
  assert.match(html, /SHIFT \+ ENTER FOR A NEW LINE/);
  assert.doesNotMatch(html, /RECENT VIDEOS|DROP YOUR VIDEO HERE|CAPTION LANGUAGE/);
  assert.match(html, /type="submit"/);
});

test("keeps the requested typography and smooth-scroll dependencies local", async () => {
  const [css, layout, page, packageJson] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(css, /--font-mono:\s*"Space Mono"/);
  assert.match(css, /\.desktop-nav a,\s*\n\.nav-cta\s*\{[^}]*var\(--font-mono\)/s);
  assert.match(css, /\.nav-text-mono\s*\{[^}]*var\(--font-mono\)/s);
  assert.match(css, /\.nav-text-mono\s*\{[^}]*letter-spacing:\s*0\.12em/s);
  assert.match(css, /\.preloader-word\s*\{[^}]*opacity:\s*0/s);
  assert.match(css, /\.preloader-word\s*\{[^}]*translate:\s*-50%\s+-50%/s);
  assert.match(css, /\.preloader-word:first-child\s*\{[^}]*opacity:\s*1/s);
  assert.match(css, /\.page\.is-preloading\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.about-text p\s*\{[^}]*var\(--font-mono\)/s);
  assert.match(layout, /@fontsource\/space-mono\/400\.css/);
  assert.match(layout, /@fontsource\/space-mono\/700\.css/);
  assert.match(page, /new Lenis\(\{[^}]*autoRaf:\s*true/s);
  assert.match(packageJson, /"@fontsource\/space-mono"/);
  assert.match(packageJson, /"lenis"/);
});
