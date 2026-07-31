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
type CaptionLanguage = "english" | "nepali" | "maithili";
type Preview =
  | { kind: "video"; src: string; title: string }
  | { kind: "audio"; src: string; title: string }
  | { kind: "embed"; src: string; title: string; youtubeId?: string }
  | { kind: "linked"; src: string; title: string };

type CaptionCue = {
  start: number;
  end: number;
  text: string;
};

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLIFrameElement,
        options: { events: { onReady: () => void } },
      ) => YouTubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const DEMO_VIDEO_ID = "nBpPe9UweWs";
const AUDIO_DEMO_FILE = "videoplayback.mp3";
const DEMO_PREVIEW: Preview = {
  kind: "embed",
  src: `https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}?enablejsapi=1&rel=0&cc_load_policy=0`,
  title: "Weather and Small Talk — 30 second demo",
  youtubeId: DEMO_VIDEO_ID,
};

const DEMO_CAPTIONS: Record<CaptionLanguage, CaptionCue[]> = {
  english: [
    {
      start: 4.97,
      end: 8.969,
      text: "Brrr. It’s so cold today. Yes, it’s a bit chilly.",
    },
    {
      start: 8.969,
      end: 12.75,
      text: "It’s twenty-five degrees. What would that be in England?",
    },
    {
      start: 12.75,
      end: 17.75,
      text: "Oh, minus something. But how did you know I was English?",
    },
    {
      start: 17.75,
      end: 20.97,
      text: "Well, I could tell by your accent. Oh!",
    },
  ],
  nepali: [
    {
      start: 4.97,
      end: 8.969,
      text: "ब्रर्र! आज त साह्रै जाडो छ। हो, अलि चिसो छ।",
    },
    {
      start: 8.969,
      end: 12.75,
      text: "पच्चीस डिग्री छ। बेलायतमा यो कति हुन्थ्यो?",
    },
    {
      start: 12.75,
      end: 17.75,
      text: "ओहो, शून्यभन्दा केही तल। तर म अङ्ग्रेज हुँ भनेर कसरी थाहा पाउनुभयो?",
    },
    {
      start: 17.75,
      end: 20.97,
      text: "तपाईंको लवजबाट थाहा पाएँ। ओहो!",
    },
  ],
  maithili: [
    {
      start: 4.97,
      end: 8.969,
      text: "बाप रे! आइ बहुत जाड़ अछि। हँ, कनिक ठंढ अछि।",
    },
    {
      start: 8.969,
      end: 12.75,
      text: "पच्चीस डिग्री अछि। इंग्लैंडमे ई कतेक होइत?",
    },
    {
      start: 12.75,
      end: 17.75,
      text: "ओह, शून्यसँ किछु कम। मुदा अहाँकेँ कोना बुझल जे हम अंग्रेज छी?",
    },
    {
      start: 17.75,
      end: 20.97,
      text: "अहाँक लहजासँ बुझि गेलहुँ। ओह!",
    },
  ],
};

const AUDIO_DEMO_CAPTIONS: Record<CaptionLanguage, CaptionCue[]> = {
  nepali: [
    {
      start: 24,
      end: 44,
      text: "क्षेत्रको जनजीवन हिजोदेखि केही सामान्य बन्दै गएको छ। राजनीतिक दल, जनप्रतिनिधि, नागरिक समाज र विभिन्न संघसंस्थाले शान्ति, सद्भाव र सामाजिक एकता कायम गर्ने प्रतिबद्धता जनाएका छन्।",
    },
    {
      start: 44,
      end: 60,
      text: "मन्दिर, मस्जिद, चर्च र गुम्बालगायत सबै धार्मिक स्थलमा लाउडस्पीकर, माइक वा साउन्ड बक्स प्रयोग नगर्न मोरङ प्रशासनले निर्देशन जारी गरेको छ।",
    },
    {
      start: 60,
      end: 76,
      text: "प्रशासन कार्यालय अगाडि ब्यारिकेड राखिएको छ। जनकपुरधामका चोकचोकमा प्रदर्शन हुँदा बजार आंशिक बन्द छ। सुनसरी घटनाबारे राष्ट्रिय सुरक्षा परिषद्को बैठक जारी छ।",
    },
    {
      start: 76,
      end: 96,
      text: "शान्ति सुरक्षाको अवस्थाबारे छलफल गर्न प्रधानमन्त्री बालेन शाहको आह्वानमा सिंहदरबारमा बैठक बसेको छ।",
    },
    {
      start: 100,
      end: 120,
      text: "घटनाको नैतिक जिम्मेवारी लिँदै प्रधानमन्त्री र गृहमन्त्रीले किन राजीनामा नदिने भन्दै एमाले सांसद पद्मा अर्यालले प्रश्न गरेकी छन्।",
    },
    {
      start: 120,
      end: 145,
      text: "सम्पत्ति शुद्धीकरण अनुसन्धानसम्बन्धी विवादमा सुनुवाइ सकिएको छ र आदेश आउने तयारी छ।",
    },
    {
      start: 164,
      end: 184,
      text: "रौतहट क्षेत्र नम्बर चारका प्रतिनिधिसभा सदस्य गणेश पौडेलमाथि कालो मसी छ्यापेर दुर्व्यवहार गरेको आरोपमा दुई जना पक्राउ परेका छन्।",
    },
    {
      start: 184,
      end: 208,
      text: "लघुवित्त पीडितसँग वार्ता गर्न अर्थ मन्त्रालयका सहसचिव महेश आचार्यलाई वार्ता समितिको सदस्य सचिव तोकिएको छ।",
    },
    {
      start: 216,
      end: 240,
      text: "राहदानी विभागले सेवाग्राहीको चाप सम्बोधन गर्न दैनिक उत्पादन क्षमता बढाउँदै आजदेखि दुई सिफ्टमा सेवा दिन थालेको छ।",
    },
    {
      start: 240,
      end: 264,
      text: "विद्युतीय गाडी चलाउन चालकहरू अभ्यस्त नहुँदा दुर्घटना बढेको निष्कर्षपछि ट्राफिक प्रहरीले छुट्टै व्यवस्था गर्ने विषयमा छलफल थालेको छ।",
    },
    {
      start: 300,
      end: 312,
      text: "पाकिस्तानमा प्रहरी चौकीमा भएको आक्रमणमा नौ प्रहरीसहित चौबीस जनाको मृत्यु भएको छ।",
    },
    {
      start: 312,
      end: 326,
      text: "रुसी आक्रमणमा दुई बालबालिकाको मृत्यु भएको छ। म्यानमारले मलेसियाबाट पाँच हजार रोहिंग्यालाई फिर्ता लैजाने भएको छ।",
    },
    {
      start: 326,
      end: 336,
      text: "देशविदेशका ताजा समाचारका लागि नेपाल टाइम्सको अनलाइन, फेसबुक तथा युट्युब च्यानल हेर्नुहोस्। धन्यवाद।",
    },
  ],
  english: [
    {
      start: 24,
      end: 44,
      text: "Daily life in the area has gradually returned to normal since yesterday. Political parties, elected representatives, civil society and organizations have pledged to preserve peace, harmony and social unity.",
    },
    {
      start: 44,
      end: 60,
      text: "The Morang administration has directed temples, mosques, churches, monasteries and other religious sites not to use loudspeakers, microphones or sound boxes.",
    },
    {
      start: 60,
      end: 76,
      text: "Barricades have been placed outside the administration office. Protests have partly closed Janakpurdham’s markets, while the National Security Council discusses the Sunsari incident.",
    },
    {
      start: 76,
      end: 96,
      text: "Prime Minister Balen Shah has called a meeting at Singha Durbar to discuss the country’s security situation.",
    },
    {
      start: 100,
      end: 120,
      text: "UML lawmaker Padma Aryal has asked why the prime minister and home minister should not resign and accept moral responsibility for the incident.",
    },
    {
      start: 120,
      end: 145,
      text: "The hearing in the dispute concerning the money-laundering investigation has concluded, and an order is expected.",
    },
    {
      start: 164,
      end: 184,
      text: "Two people have been arrested for allegedly throwing black ink on and mistreating Rautahat constituency four lawmaker Ganesh Paudel.",
    },
    {
      start: 184,
      end: 208,
      text: "Finance Ministry joint secretary Mahesh Acharya has been appointed member-secretary of the committee negotiating with microfinance victims.",
    },
    {
      start: 216,
      end: 240,
      text: "The Passport Department has increased daily production and begun operating two shifts to address the volume of applicants.",
    },
    {
      start: 240,
      end: 264,
      text: "Traffic police have begun discussing separate measures for electric vehicles after concluding that unfamiliarity among drivers is increasing crashes.",
    },
    {
      start: 300,
      end: 312,
      text: "An attack on a police post in Pakistan has killed twenty-four people, including nine police officers.",
    },
    {
      start: 312,
      end: 326,
      text: "Two children have died in a Russian attack. Myanmar will take back five thousand Rohingya people from Malaysia.",
    },
    {
      start: 326,
      end: 336,
      text: "For the latest national and international news, follow Nepal Times online, on Facebook and on YouTube. Thank you.",
    },
  ],
  maithili: [
    {
      start: 24,
      end: 44,
      text: "क्षेत्रक जनजीवन काल्हिसँ किछु सामान्य भ’ रहल अछि। राजनीतिक दल, जनप्रतिनिधि, नागरिक समाज आ विभिन्न संघ-संस्था शान्ति, सद्भाव आ सामाजिक एकता कायम रखबाक प्रतिबद्धता जनौलनि।",
    },
    {
      start: 44,
      end: 60,
      text: "मन्दिर, मस्जिद, चर्च, गुम्बा आ आन धार्मिक स्थलमे लाउडस्पीकर, माइक वा साउन्ड बक्स प्रयोग नहि करबाक मोरङ प्रशासन निर्देशन देलक अछि।",
    },
    {
      start: 60,
      end: 76,
      text: "प्रशासन कार्यालयक आगाँ बेरिकेड राखल गेल अछि। जनकपुरधामक चोक-चोकमे प्रदर्शनसँ बजार आंशिक बन्द अछि, आ सुनसरी घटनापर राष्ट्रिय सुरक्षा परिषदक बैठक जारी अछि।",
    },
    {
      start: 76,
      end: 96,
      text: "शान्ति-सुरक्षाक अवस्थापर चर्चा करबाक लेल प्रधानमन्त्री बालेन शाहक आह्वानमे सिंहदरबारमे बैठक बैसल अछि।",
    },
    {
      start: 100,
      end: 120,
      text: "एमाले सांसद पद्मा अर्याल प्रश्न उठौलनि जे घटनाक नैतिक जिम्मेवारी लैत प्रधानमन्त्री आ गृहमन्त्री राजीनामा किएक नहि देथि।",
    },
    {
      start: 120,
      end: 145,
      text: "सम्पत्ति शुद्धीकरण अनुसन्धानसम्बन्धी विवादक सुनुवाइ पूरा भ’ गेल अछि आ आदेश आबयबाक तैयारी अछि।",
    },
    {
      start: 164,
      end: 184,
      text: "रौतहट क्षेत्र नम्बर चारक प्रतिनिधिसभा सदस्य गणेश पौडेलपर कालो मसी फेँकबाक आ दुर्व्यवहार करबाक आरोपमे दू गोटे गिरफ्तार भेल अछि।",
    },
    {
      start: 184,
      end: 208,
      text: "लघुवित्त पीड़ितसँ वार्ता करबाक लेल अर्थ मन्त्रालयक सहसचिव महेश आचार्यकेँ वार्ता समितिक सदस्य-सचिव बनाओल गेल अछि।",
    },
    {
      start: 216,
      end: 240,
      text: "राहदानी विभाग सेवाग्राहीक चाप कम करबाक लेल दैनिक उत्पादन क्षमता बढ़ा कऽ आइ सँ दू पालीमे सेवा शुरू केलक अछि।",
    },
    {
      start: 240,
      end: 264,
      text: "चालकसभ विद्युतीय गाड़ी चलाबयमे अभ्यस्त नहि रहलासँ दुर्घटना बढ़ल निष्कर्षक बाद ट्राफिक पुलिस अलग व्यवस्था पर चर्चा शुरू केलक अछि।",
    },
    {
      start: 300,
      end: 312,
      text: "पाकिस्तानमे पुलिस चौकीपर हमला सँ नौ पुलिसकर्मीसहित चौबीस गोटेक मृत्यु भेल अछि।",
    },
    {
      start: 312,
      end: 326,
      text: "रूसी हमलामे दू बालकक मृत्यु भेल अछि। म्यानमार मलेसियासँ पाँच हजार रोहिंग्याकेँ वापस लेत।",
    },
    {
      start: 326,
      end: 336,
      text: "देश-विदेशक ताजा समाचारक लेल नेपाल टाइम्सक अनलाइन, फेसबुक आ युट्युब च्यानल देखू। धन्यवाद।",
    },
  ],
};

const INPUT_MODES = [
  { id: "link", label: "PASTE A LINK", number: "01" },
  { id: "upload", label: "UPLOAD MEDIA", number: "02" },
] as const;

const CAPTION_STYLES = [
  "Clean and readable",
  "Bold for short clips",
  "Minimal for films",
] as const;

const CAPTION_LANGUAGES: CaptionLanguage[] = [
  "english",
  "nepali",
  "maithili",
];

function getCaptionTrack(
  preview: Preview | null,
  language: CaptionLanguage,
): CaptionCue[] {
  if (preview?.kind === "embed" && preview.youtubeId === DEMO_VIDEO_ID) {
    return DEMO_CAPTIONS[language];
  }

  if (
    preview?.kind === "audio" &&
    preview.title.toLowerCase() === AUDIO_DEMO_FILE
  ) {
    return AUDIO_DEMO_CAPTIONS[language];
  }

  return [];
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
        src: `https://www.youtube-nocookie.com/embed/${youtubeId}?enablejsapi=1&rel=0&cc_load_policy=0`,
        title: "YouTube video",
        youtubeId,
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
  const audioPlayer = useRef<HTMLAudioElement>(null);
  const youtubeFrame = useRef<HTMLIFrameElement>(null);
  const youtubePlayer = useRef<YouTubePlayer | null>(null);
  const captionClock = useRef<number | null>(null);
  const playbackTime = useRef(0);
  const captionLanguageRef = useRef<CaptionLanguage>("nepali");
  const [mode, setMode] = useState<InputMode>("link");
  const [videoLink, setVideoLink] = useState("");
  const [preview, setPreview] = useState<Preview | null>(DEMO_PREVIEW);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [captionLanguage, setCaptionLanguage] =
    useState<CaptionLanguage>("nepali");
  const [currentCaption, setCurrentCaption] = useState("");
  const [captionStyle, setCaptionStyle] =
    useState<(typeof CAPTION_STYLES)[number]>(CAPTION_STYLES[0]);

  useEffect(() => {
    captionLanguageRef.current = captionLanguage;
    const cue = getCaptionTrack(preview, captionLanguage).find(
      ({ start, end }) =>
        playbackTime.current >= start && playbackTime.current < end,
    );
    setCurrentCaption(cue?.text ?? "");
  }, [captionLanguage, preview]);

  useEffect(() => {
    return () => {
      if (
        (preview?.kind === "video" || preview?.kind === "audio") &&
        preview.src.startsWith("blob:")
      ) {
        URL.revokeObjectURL(preview.src);
      }
    };
  }, [preview]);

  useEffect(() => {
    if (
      preview?.kind !== "embed" ||
      !preview.youtubeId ||
      !youtubeFrame.current
    ) {
      setCurrentCaption("");
      return;
    }

    let cancelled = false;

    const syncCaption = () => {
      try {
        playbackTime.current = youtubePlayer.current?.getCurrentTime() ?? 0;
        if (preview.youtubeId !== DEMO_VIDEO_ID) return;

        const cue = DEMO_CAPTIONS[captionLanguageRef.current].find(
          ({ start, end }) =>
            playbackTime.current >= start && playbackTime.current < end,
        );
        setCurrentCaption((current) =>
          current === (cue?.text ?? "") ? current : (cue?.text ?? ""),
        );
      } catch {
        // The player may not be ready during its first few frames.
      }
    };

    const connectPlayer = () => {
      if (cancelled || !window.YT?.Player || !youtubeFrame.current) return;
      youtubePlayer.current?.destroy();
      youtubePlayer.current = new window.YT.Player(youtubeFrame.current, {
        events: {
          onReady: () => {
            syncCaption();
            captionClock.current = window.setInterval(syncCaption, 100);
          },
        },
      });
    };

    if (window.YT?.Player) {
      connectPlayer();
    } else {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        connectPlayer();
      };

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      if (captionClock.current !== null) {
        window.clearInterval(captionClock.current);
        captionClock.current = null;
      }
      youtubePlayer.current?.destroy();
      youtubePlayer.current = null;
    };
  }, [preview]);

  function setMediaFile(file?: File) {
    const isVideo = file?.type.startsWith("video/");
    const isAudio = file?.type.startsWith("audio/");

    if (!file || (!isVideo && !isAudio)) {
      setError("Choose an audio or video file to continue.");
      return;
    }

    if (
      (preview?.kind === "video" || preview?.kind === "audio") &&
      preview.src.startsWith("blob:")
    ) {
      URL.revokeObjectURL(preview.src);
    }

    setPreview({
      kind: isAudio ? "audio" : "video",
      src: URL.createObjectURL(file),
      title: file.name,
    });
    playbackTime.current = 0;
    setCurrentCaption("");
    setError("");
    setIsSending(true);
    window.setTimeout(() => setIsSending(false), 900);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setMediaFile(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    setMediaFile(event.dataTransfer.files?.[0]);
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
    setIsSending(true);
    window.setTimeout(() => setIsSending(false), 900);
  }

  function resetPreview() {
    setPreview(null);
    playbackTime.current = 0;
    setCurrentCaption("");
    setVideoLink("");
    setError("");
  }

  function syncUploadedAudioCaption() {
    playbackTime.current = audioPlayer.current?.currentTime ?? 0;
    const cue = getCaptionTrack(preview, captionLanguageRef.current).find(
      ({ start, end }) =>
        playbackTime.current >= start && playbackTime.current < end,
    );
    setCurrentCaption((current) =>
      current === (cue?.text ?? "") ? current : (cue?.text ?? ""),
    );
  }

  const hasTimedCaptions = getCaptionTrack(
    preview,
    captionLanguage,
  ).length > 0;

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <a className={styles.brand} href="/" aria-label="Return to Verse home">
            VERSE<span>.</span>
          </a>
          <p>VIDEO IN / WORDS OUT</p>
          <a className={styles.close} href="/" aria-label="Close Try Verse">
            <span />
            <span />
          </a>
        </header>

        <div className={styles.workspace}>
          <section className={styles.statement}>
            <p>CAPTION INTAKE / READY</p>
            <h1>
              Bring the
              <span>media.</span>
              Keep every word.
            </h1>
            <div className={styles.statementNote}>
              <span>CC</span>
              <p>
                Start with a link or an audio/video file. Verse keeps the
                interface quiet so the media stays in focus.
              </p>
            </div>
          </section>

          <section className={styles.intake}>
            <div className={styles.modeSwitch} aria-label="Choose video source">
              {INPUT_MODES.map((item) => (
                <button
                  aria-pressed={mode === item.id}
                  className={mode === item.id ? styles.activeMode : ""}
                  key={item.id}
                  onClick={() => {
                    setMode(item.id);
                    setPreview(null);
                    setError("");
                  }}
                  type="button"
                >
                  <span>{item.number}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <div
              className={`${styles.stage} ${
                isSending ? styles.isSending : ""
              }`}
            >
              <div className={styles.gradient} aria-hidden="true" />

              {preview ? (
                <div className={styles.preview}>
                  <header>
                    <span>VIDEO READY</span>
                    <strong>{preview.title}</strong>
                    <button onClick={resetPreview} type="button">
                      CHANGE
                    </button>
                  </header>

                  {preview.kind === "video" ? (
                    <video controls src={preview.src}>
                      Your browser does not support video playback.
                    </video>
                  ) : preview.kind === "audio" ? (
                    <div className={styles.audioStage}>
                      <div className={styles.audioWordmark} aria-hidden="true">
                        <span>AUDIO</span>
                        <strong>WORDS IN MOTION.</strong>
                      </div>
                      <audio
                        controls
                        onSeeked={syncUploadedAudioCaption}
                        onTimeUpdate={syncUploadedAudioCaption}
                        ref={audioPlayer}
                        src={preview.src}
                      >
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  ) : preview.kind === "embed" ? (
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      key={preview.src}
                      ref={preview.youtubeId ? youtubeFrame : undefined}
                      src={preview.src}
                      title={preview.title}
                    />
                  ) : (
                    <div className={styles.linked}>
                      <span>LINK RECEIVED</span>
                      <strong>{preview.title}</strong>
                      <p>
                        The source is ready. Continue when the caption engine is
                        connected.
                      </p>
                      <a href={preview.src} rel="noreferrer" target="_blank">
                        OPEN SOURCE <ArrowIcon />
                      </a>
                    </div>
                  )}

                  {hasTimedCaptions ? (
                    <>
                      <div
                        className={styles.languageSwitch}
                        aria-label="Caption language"
                      >
                        {CAPTION_LANGUAGES.map((language) => (
                          <button
                            aria-pressed={captionLanguage === language}
                            className={
                              captionLanguage === language
                                ? styles.activeLanguage
                                : ""
                            }
                            key={language}
                            onClick={() => setCaptionLanguage(language)}
                            type="button"
                          >
                            {language.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <div
                        aria-live="polite"
                        className={`${styles.captionDemo} ${
                          currentCaption ? styles.captionActive : ""
                        }`}
                      >
                        <span>LIVE / {captionLanguage.toUpperCase()}</span>
                        <p>
                          {currentCaption ||
                            "PRESS PLAY — CAPTIONS BEGIN WITH THE FIRST WORD"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className={styles.captionDemo}>
                      <span>VIDEO READY</span>
                      <p>Caption processing is ready for this source.</p>
                    </div>
                  )}
                </div>
              ) : mode === "link" ? (
                <form className={styles.linkForm} onSubmit={submitLink}>
                  <div className={styles.index}>01 / LINK</div>
                  <div className={styles.linkCopy}>
                    <p>SHARE ANY VIDEO URL</p>
                    <h2>Paste it. We’ll take it from here.</h2>
                  </div>
                  <label htmlFor="video-url">
                    <span>VIDEO URL</span>
                    <input
                      autoFocus
                      id="video-url"
                      onChange={(event) => setVideoLink(event.target.value)}
                      placeholder="https://..."
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
                  <span className={styles.dropIndex}>02 / FILE</span>
                  <span className={styles.filmMark} aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <strong>DROP AUDIO OR VIDEO</strong>
                  <p>OR CLICK TO BROWSE</p>
                  <small>MP3 · WAV · MP4 · MOV · WEBM</small>
                </button>
              )}
            </div>

            <div className={styles.options}>
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
                LOCAL / PRIVATE
              </p>
            </div>

            {error ? <p className={styles.error}>{error}</p> : null}

            <input
              accept="audio/*,video/*"
              className={styles.fileInput}
              onChange={handleFileChange}
              ref={fileInput}
              type="file"
            />
          </section>
        </div>
      </section>
    </main>
  );
}
