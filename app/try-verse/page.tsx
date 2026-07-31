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
  { id: "link", label: "Video link" },
  { id: "upload", label: "Upload" },
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

float noise(vec2 point) {
  return fract(sin(dot(point + seed, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 palette(float position) {
  vec3 whiteColor = vec3(1.0);
  vec3 skyColor = vec3(0.470588, 0.721569, 0.976471);
  vec3 ultramarineColor = vec3(0.337255, 0.403922, 1.0);
  vec3 irisColor = vec3(0.301961, 0.184314, 0.976471);

  vec3 color = whiteColor;
  color = mix(color, skyColor, smoothstep(0.3318, 0.3786, position));
  color = mix(color, ultramarineColor, smoothstep(0.5814, 0.5886, position));
  color = mix(color, irisColor, smoothstep(0.7964, 0.8000, position));
  return color;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 cssUv = vec2(uv.x, 1.0 - uv.y);

  float t = elapsed;
  float ph = t * 1.0;
  float amt = 0.0;
  float direction = 1.0;
  float spin = ph * direction;
  float angle = 38.0 + sin(spin * 0.6) * 28.0 * amt;
  float radiansAngle = radians(angle);

  vec2 fieldAxis = normalize(vec2(sin(radiansAngle), cos(radiansAngle)));
  vec2 crossAxis = vec2(fieldAxis.y, -fieldAxis.x);
  float axisSpan = fieldAxis.x + fieldAxis.y;
  float along = dot(cssUv, fieldAxis) / axisSpan;
  float cross = dot(cssUv - 0.5, crossAxis);

  float waveClock = 20.75 + ph * 1.2;
  float waveOffset =
    (14.0 / 100.0) *
    0.35 *
    sin(cross * 2.4 * 6.28318530718 + waveClock);

  float fieldPosition = clamp(along + waveOffset, 0.0, 1.0);
  vec3 color = palette(fieldPosition);

  vec2 grainCell = floor(gl_FragCoord.xy);
  float fineGrain = noise(grainCell);
  float softGrain = noise(floor(grainCell * 0.48) + 31.7);
  float texture = ((fineGrain - 0.5) * 0.105) + ((softGrain - 0.5) * 0.025);
  color += texture;

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
      const width = Math.floor(canvas.clientWidth * pixelRatio);
      const height = Math.floor(canvas.clientHeight * pixelRatio);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        gl.uniform2f(resolutionLocation, width, height);
      }
    };

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const startTime = performance.now();
    let animationFrame = 0;

    const draw = (now: number) => {
      resize();
      const elapsedSeconds = reducedMotion ? 0 : (now - startTime) / 1000;
      gl.uniform1f(elapsedLocation, elapsedSeconds);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!reducedMotion) {
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
    sendTimer.current = setTimeout(() => setIsSending(false), 900);
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
        <p className={styles.status}>
          <i aria-hidden="true" />
          LIVE CAPTION STUDIO
        </p>
        <a className={styles.close} href="/">
          BACK TO FILM <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className={styles.stage}>
        <div className={styles.intro}>
          <p>VOICE, MADE VISIBLE</p>
          <h1>
            Make every frame
            <em>understood.</em>
          </h1>
          <small>
            Bring the video. Verse gives every spoken moment somewhere clear
            to land.
          </small>
        </div>

        <div className={styles.captionSlip} aria-hidden="true">
          <span>00:00:08</span>
          Every word arrives with the moment.
        </div>

        <section
          className={`${styles.dock} ${isSending ? styles.isSending : ""}`}
          aria-label="Add a video"
        >
          <header className={styles.dockHeader}>
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
            <span>{preview ? "SOURCE READY" : "CHOOSE A SOURCE"}</span>
          </header>

          <div className={styles.dockBody}>
            {preview ? (
              <div className={styles.preview}>
                <header>
                  <div>
                    <span>READY TO CAPTION</span>
                    <strong>{preview.title}</strong>
                  </div>
                  <button onClick={resetPreview} type="button">
                    CHANGE
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
                        VIEW SOURCE <i aria-hidden="true">↗</i>
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
                  <span>PASTE ANY VIDEO LINK</span>
                  <input
                    autoFocus
                    id="video-url"
                    onChange={(event) => setVideoLink(event.target.value)}
                    placeholder="youtube.com / vimeo.com / direct video"
                    type="url"
                    value={videoLink}
                  />
                </label>
                <button
                  aria-label="Use this video link"
                  disabled={!videoLink.trim()}
                  type="submit"
                >
                  <span className={styles.arrowFront}>↗</span>
                  <span className={styles.arrowBack}>↗</span>
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
                <span className={styles.dropIcon} aria-hidden="true">
                  <i />
                </span>
                <span>
                  <strong>DROP A VIDEO HERE</strong>
                  <small>or choose from your device · MP4 · MOV · WEBM</small>
                </span>
              </button>
            )}
          </div>

          <footer className={styles.dockFooter}>
            <label htmlFor="caption-style">
              CAPTION LOOK
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
            <p>PRIVATE ON THIS DEVICE</p>
          </footer>

          {error ? <p className={styles.error}>{error}</p> : null}
        </section>
      </section>

      <footer className={styles.pageFooter}>
        <span>VERSE / 2026</span>
        <span>PRESS PLAY. FOLLOW THE MOMENT.</span>
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
