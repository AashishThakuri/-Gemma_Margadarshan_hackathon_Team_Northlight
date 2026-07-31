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
type Preview =
  | { kind: "video"; src: string; title: string }
  | { kind: "embed"; src: string; title: string }
  | { kind: "linked"; src: string; title: string };

const INPUT_MODES = [
  { id: "link", label: "PASTE VIDEO URL" },
  { id: "upload", label: "UPLOAD VIDEO" },
] as const;

const CAPTION_STYLES = [
  "Clean",
  "High contrast",
  "Minimal",
  "Editorial",
] as const;

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 resolution;
uniform float elapsed;
uniform float seed;

float randomValue(vec2 point) {
  return fract(sin(dot(point + seed, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 ribbonPalette(float value) {
  vec3 whiteColor = vec3(1.0);
  vec3 skyColor = vec3(0.470588, 0.721569, 0.976471);
  vec3 ultramarineColor = vec3(0.337255, 0.403922, 1.0);
  vec3 irisColor = vec3(0.301961, 0.184314, 0.976471);

  vec3 color = whiteColor;
  color = mix(color, skyColor, smoothstep(0.3318, 0.3786, value));
  color = mix(color, ultramarineColor, smoothstep(0.5814, 0.5886, value));
  color = mix(color, irisColor, smoothstep(0.7964, 0.8000, value));
  return color;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 centered = uv - 0.5;
  centered.x *= resolution.x / resolution.y;

  float ph = elapsed * 1.0;
  float amt = 0.0;
  float direction = 1.0;
  float spin = ph * direction;
  float angle = 38.0 + sin(spin * 0.6) * 28.0 * amt;
  float angleRadians = radians(angle);

  vec2 fieldAxis = vec2(cos(angleRadians), sin(angleRadians));
  vec2 crossAxis = vec2(-sin(angleRadians), cos(angleRadians));
  float along = dot(centered, fieldAxis);
  float cross = dot(centered, crossAxis);

  float waveClock = 20.75 + ph * 1.2;
  float waveOffset =
    (14.0 / 100.0) *
    0.35 *
    sin(cross * 2.4 * 6.28318530718 + waveClock);

  float position = clamp((along / 0.68) + 0.5 + waveOffset, 0.0, 1.0);
  vec3 color = ribbonPalette(position);

  float grain = randomValue(floor(gl_FragCoord.xy));
  color += (grain - 0.5) * 0.085;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function RibbonField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    });

    if (!gl) {
      canvas.dataset.fallback = "true";
      return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
      canvas.dataset.fallback = "true";
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "position");
    const resolutionLocation = gl.getUniformLocation(program, "resolution");
    const elapsedLocation = gl.getUniformLocation(program, "elapsed");
    const seedLocation = gl.getUniformLocation(program, "seed");
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(seedLocation, 174074637);

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const nextWidth = Math.floor(canvas.clientWidth * pixelRatio);
      const nextHeight = Math.floor(canvas.clientHeight * pixelRatio);

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
        gl.viewport(0, 0, nextWidth, nextHeight);
        gl.uniform2f(resolutionLocation, nextWidth, nextHeight);
      }
    };

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const startTime = performance.now();
    let animationFrame = 0;

    const draw = (now: number) => {
      resize();
      const elapsedSeconds = reduceMotion ? 0 : (now - startTime) / 1000;
      gl.uniform1f(elapsedLocation, elapsedSeconds);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!reduceMotion) {
        animationFrame = requestAnimationFrame(draw);
      }
    };

    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <canvas
      aria-hidden="true"
      className={styles.ribbonField}
      ref={canvasRef}
    />
  );
}

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
        src: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
        title: "YouTube video",
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
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mode, setMode] = useState<InputMode>("link");
  const [videoLink, setVideoLink] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [captionStyle, setCaptionStyle] =
    useState<(typeof CAPTION_STYLES)[number]>(CAPTION_STYLES[0]);

  useEffect(() => {
    return () => {
      if (preview?.kind === "video" && preview.src.startsWith("blob:")) {
        URL.revokeObjectURL(preview.src);
      }
      if (sendTimer.current) {
        clearTimeout(sendTimer.current);
      }
    };
  }, [preview]);

  function flashSignal() {
    setIsSending(false);
    requestAnimationFrame(() => setIsSending(true));
    if (sendTimer.current) {
      clearTimeout(sendTimer.current);
    }
    sendTimer.current = setTimeout(() => setIsSending(false), 950);
  }

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
    flashSignal();
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
    flashSignal();
  }

  function resetPreview() {
    setPreview(null);
    setVideoLink("");
    setError("");
  }

  return (
    <main className={styles.page}>
      <RibbonField />

      <header className={styles.topbar}>
        <a className={styles.brand} href="/" aria-label="Return to Verse home">
          VERSE<span>.</span>
        </a>
        <p>CAPTION FIELD / 001</p>
        <a className={styles.close} href="/" aria-label="Close Try Verse">
          CLOSE ↗
        </a>
      </header>

      <section className={styles.hero}>
        <div className={styles.intro}>
          <p>VIDEO ENTERS HERE</p>
          <h1>
            Your video.
            <span>Clear words.</span>
          </h1>
          <small>
            Drop a file or share a link. Verse prepares the space where every
            spoken moment can be followed.
          </small>
        </div>

        <section
          className={`${styles.console} ${
            isSending ? styles.isSending : ""
          }`}
          aria-label="Add a video"
        >
          <div className={styles.consoleGlow} aria-hidden="true" />

          <header className={styles.consoleHeader}>
            <div className={styles.modeSwitch}>
              {INPUT_MODES.map((item) => (
                <button
                  aria-pressed={mode === item.id}
                  className={mode === item.id ? styles.activeMode : ""}
                  key={item.id}
                  onClick={() => {
                    setMode(item.id);
                    setError("");
                  }}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span>{preview ? "SOURCE READY" : "WAITING FOR SOURCE"}</span>
          </header>

          <div className={styles.consoleBody}>
            {preview ? (
              <div className={styles.preview}>
                <header>
                  <div>
                    <span>READY TO CAPTION</span>
                    <strong>{preview.title}</strong>
                  </div>
                  <button onClick={resetPreview} type="button">
                    CHANGE SOURCE
                  </button>
                </header>

                <div className={styles.previewMedia}>
                  {preview.kind === "video" ? (
                    <video controls src={preview.src}>
                      Your browser does not support video playback.
                    </video>
                  ) : preview.kind === "embed" ? (
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      src={preview.src}
                      title={preview.title}
                    />
                  ) : (
                    <div className={styles.linked}>
                      <span>LINK CONNECTED</span>
                      <strong>{preview.title}</strong>
                      <a href={preview.src} rel="noreferrer" target="_blank">
                        VIEW SOURCE <ArrowIcon />
                      </a>
                    </div>
                  )}

                  <div className={styles.captionDemo}>
                    Every word arrives with the moment.
                  </div>
                </div>
              </div>
            ) : mode === "link" ? (
              <form className={styles.linkForm} onSubmit={submitLink}>
                <label htmlFor="video-url">
                  <span>SHARE A VIDEO URL</span>
                  <input
                    autoFocus
                    id="video-url"
                    onChange={(event) => setVideoLink(event.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
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
                <span className={styles.dropMark} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <strong>DROP YOUR VIDEO</strong>
                <p>OR CLICK TO CHOOSE A FILE</p>
                <small>MP4 · MOV · WEBM</small>
              </button>
            )}
          </div>

          <footer className={styles.consoleFooter}>
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
              PRIVATE / LOCAL
            </p>
          </footer>

          {error ? <p className={styles.error}>{error}</p> : null}
        </section>
      </section>

      <footer className={styles.pageFooter}>
        <span>VERSE / LIVE CAPTION SYSTEM</span>
        <span>PASTE · UPLOAD · FOLLOW</span>
      </footer>

      <input
        accept="video/*"
        className={styles.fileInput}
        onChange={handleFileChange}
        ref={fileInput}
        type="file"
      />
    </main>
  );
}
