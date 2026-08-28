"use client";

import { useState } from "react";

const EXAMPLES = [
  {
    label: "Spotify",
    url: "https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580",
  },
  {
    label: "Duolingo",
    url: "https://apps.apple.com/us/app/duolingo-language-lessons/id570060128",
  },
  {
    label: "Notion",
    url: "https://apps.apple.com/us/app/notion-notes-docs-tasks/id1232780281",
  },
];

/**
 * The URL entry point. Accepts any App Store URL (or a bare app id) and offers
 * a few examples so a reviewer can try it in one click.
 */
export function UrlComposer({
  onSubmit,
  busy,
  error,
}: {
  onSubmit: (url: string) => void;
  busy: boolean;
  error: string | null;
}) {
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !busy) onSubmit(value.trim());
  };

  return (
    <form className="composer" onSubmit={submit}>
      <div className={`field ${error ? "error" : ""}`}>
        <input
          type="text"
          inputMode="url"
          placeholder="Paste an App Store URL…  https://apps.apple.com/us/app/…/id…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={busy}
          aria-label="App Store URL"
          autoFocus
        />
        <button type="submit" className="go" disabled={busy || !value.trim()}>
          {busy ? <span className="spin" aria-hidden /> : "Audit"}
        </button>
      </div>

      <div className="examples">
        <span className="try">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            className="chip"
            onClick={() => {
              setValue(ex.url);
              if (!busy) onSubmit(ex.url);
            }}
            disabled={busy}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {error && <p className="err">{error}</p>}

      <style jsx>{`
        .composer {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          width: 100%;
        }
        .field {
          display: flex;
          gap: 0.5rem;
          background: var(--panel);
          border: 1.5px solid var(--border-strong);
          border-radius: 14px;
          padding: 0.4rem 0.4rem 0.4rem 1rem;
          box-shadow: var(--shadow-md);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .field:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px var(--accent-soft);
        }
        .field.error {
          border-color: var(--poor);
        }
        input {
          flex: 1;
          border: none;
          background: none;
          color: var(--ink);
          font-size: 1rem;
          font-family: var(--font-body);
          outline: none;
          min-width: 0;
        }
        input::placeholder {
          color: var(--ink-faint);
        }
        .go {
          background: var(--accent);
          color: var(--accent-ink);
          border: none;
          border-radius: 10px;
          padding: 0 1.3rem;
          height: 44px;
          font-weight: 700;
          font-size: 0.95rem;
          min-width: 96px;
          display: grid;
          place-items: center;
          transition: background 0.15s, transform 0.12s;
        }
        .go:not(:disabled):hover {
          background: var(--accent-strong);
          transform: translateY(-1px);
        }
        .go:disabled {
          opacity: 0.55;
          cursor: default;
        }
        .spin {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .examples {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          padding-left: 0.25rem;
        }
        .try {
          font-size: 0.8rem;
          color: var(--ink-faint);
        }
        .chip {
          background: var(--panel-2);
          border: 1px solid var(--border);
          color: var(--ink-2);
          border-radius: 999px;
          padding: 0.28rem 0.8rem;
          font-size: 0.82rem;
          transition: border-color 0.12s, color 0.12s;
        }
        .chip:not(:disabled):hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .chip:disabled { opacity: 0.5; cursor: default; }
        .err {
          margin: 0;
          padding-left: 0.25rem;
          color: var(--poor);
          font-size: 0.85rem;
        }
      `}</style>
    </form>
  );
}
