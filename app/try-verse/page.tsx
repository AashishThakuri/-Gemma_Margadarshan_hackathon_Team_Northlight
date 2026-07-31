"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import styles from "./studio.module.css";

type Message = {
  id: number;
  role: "verse" | "you";
  text: string;
};

const STARTER_MESSAGES: Message[] = [
  {
    id: 0,
    role: "verse",
    text: "Share a thought, a scene, or a line from your video.",
  },
];

const SUGGESTIONS = [
  "Shape a clean opening caption",
  "Make this line easier to read",
  "Turn a rough idea into a short script",
] as const;

const RESPONSES = [
  "Got it. I’m holding onto the meaning and clearing away the noise.",
  "That has a strong rhythm. Let’s make every word arrive at the right moment.",
  "I can work with that. The next pass will be shorter, clearer, and easier to follow.",
] as const;

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 19 19 5" />
      <path d="M8 5h11v11" />
    </svg>
  );
}

export default function TryVerse() {
  const [messages, setMessages] = useState<Message[]>(STARTER_MESSAGES);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  useEffect(() => {
    return () => {
      if (replyTimer.current) {
        clearTimeout(replyTimer.current);
      }
    };
  }, []);

  function sendMessage(text: string) {
    const nextMessage = text.trim();
    if (!nextMessage || isSending) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "you",
      text: nextMessage,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setIsSending(true);

    replyTimer.current = setTimeout(() => {
      const response =
        RESPONSES[
          Math.abs(nextMessage.length + messages.length) % RESPONSES.length
        ];

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "verse",
          text: response,
        },
      ]);
      setIsSending(false);
    }, 850);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(draft);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="Return to Verse home">
          VERSE<span>.</span>
        </a>
        <p>WORDS, IN MOTION</p>
        <a className={styles.close} href="/" aria-label="Close Try Verse">
          <span />
          <span />
        </a>
      </header>

      <section className={styles.chat} aria-label="Verse conversation">
        <div className={styles.intro}>
          <p>NEW CONVERSATION / {String(messages.length).padStart(2, "0")}</p>
          <h1>
            What do you want
            <span>to say?</span>
          </h1>
        </div>

        <div className={styles.messages} aria-live="polite">
          {messages.map((message) => (
            <article
              className={`${styles.message} ${styles[message.role]}`}
              key={message.id}
            >
              <span>{message.role === "verse" ? "VERSE" : "YOU"}</span>
              <p>{message.text}</p>
            </article>
          ))}

          {isSending ? (
            <article className={`${styles.message} ${styles.verse}`}>
              <span>VERSE</span>
              <div className={styles.typing} aria-label="Verse is responding">
                <i />
                <i />
                <i />
              </div>
            </article>
          ) : null}

          <div ref={messageEnd} />
        </div>

        {messages.length === 1 ? (
          <div className={styles.suggestions}>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setDraft(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        <form
          className={`${styles.composer} ${
            isSending ? styles.isSending : ""
          }`}
          onSubmit={handleSubmit}
        >
          <div className={styles.gradient} aria-hidden="true" />
          <label htmlFor="verse-message">
            <span>WRITE SOMETHING</span>
            <textarea
              autoFocus
              id="verse-message"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              value={draft}
            />
          </label>
          <button
            aria-label="Send message"
            disabled={!draft.trim() || isSending}
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

        <footer className={styles.note}>
          <span>ENTER TO SEND</span>
          <span>SHIFT + ENTER FOR A NEW LINE</span>
        </footer>
      </section>
    </main>
  );
}
