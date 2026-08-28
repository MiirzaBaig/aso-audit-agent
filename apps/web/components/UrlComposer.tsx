"use client";

import { useState } from "react";
import { DeepScanToggle } from "./DeepScanToggle";

const EXAMPLES = [
  { label: "Spotify", url: "https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580" },
  { label: "Duolingo", url: "https://apps.apple.com/us/app/duolingo-language-lessons/id570060128" },
  { label: "Notion", url: "https://apps.apple.com/us/app/notion-notes-docs-tasks/id1232780281" },
];

export function UrlComposer({
  onSubmit,
  busy,
  error,
}: {
  onSubmit: (url: string, deepScan: boolean) => void;
  busy: boolean;
  error: string | null;
}) {
  const [value, setValue] = useState("");
  const [deepScan, setDeepScan] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !busy) onSubmit(value.trim(), deepScan);
  };

  return (
    <form className="composer" onSubmit={submit}>
      <div className={`field ${error ? "err" : ""} ${busy ? "busy" : ""}`}>
        <span className="lead mono" aria-hidden>↳</span>
        <input
          type="text"
          inputMode="url"
          placeholder="Paste an App Store URL…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={busy}
          aria-label="App Store URL"
          autoFocus
        />
        <button type="submit" className="go" disabled={busy || !value.trim()}>
          {busy ? <span className="spin" aria-hidden /> : <>Audit <span className="arr">→</span></>}
        </button>
      </div>

      <div className="row2">
        <div className="examples">
          <span className="try label">Try</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              className="chip"
              onClick={() => {
                setValue(ex.url);
                if (!busy) onSubmit(ex.url, deepScan);
              }}
              disabled={busy}
            >
              {ex.label}
            </button>
          ))}
        </div>
        <DeepScanToggle on={deepScan} onChange={setDeepScan} disabled={busy} />
      </div>

      {error && <p className="errline">{error}</p>}

      <style jsx>{`
        .composer {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          width: 100%;
        }
        .field {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: var(--surface);
          border: 1px solid var(--line-2);
          border-radius: var(--r-md);
          padding: 0.45rem 0.45rem 0.45rem 1rem;
          box-shadow: var(--shadow-1);
          transition: border-color 0.18s var(--ease), box-shadow 0.18s var(--ease);
        }
        .field:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-wash);
        }
        .field.err { border-color: var(--poor); }
        .field.busy { opacity: 0.85; }
        .lead {
          color: var(--ink-4);
          font-size: 1rem;
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
          letter-spacing: -0.01em;
        }
        input::placeholder { color: var(--ink-4); }
        .go {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: var(--ink);
          color: var(--bg);
          border: none;
          border-radius: var(--r-sm);
          padding: 0 1.2rem;
          height: 42px;
          font-weight: 500;
          font-size: 0.9rem;
          min-width: 96px;
          justify-content: center;
          transition: transform 0.14s var(--ease), background 0.14s, opacity 0.14s;
        }
        .go:not(:disabled):hover { transform: translateY(-1px); background: var(--accent); color: var(--on-accent); }
        .go:not(:disabled):active { transform: translateY(0); }
        .go:disabled { opacity: 0.4; cursor: default; }
        .arr { transition: transform 0.16s var(--ease); }
        .go:not(:disabled):hover .arr { transform: translateX(3px); }
        .spin {
          width: 16px;
          height: 16px;
          border: 2px solid color-mix(in srgb, var(--bg) 40%, transparent);
          border-top-color: var(--bg);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        .row2 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          padding: 0.15rem 0.15rem 0.15rem 0.2rem;
        }
        .examples {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .try { margin-right: 0.15rem; }
        @media (max-width: 560px) {
          .row2 { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
        }
        .chip {
          background: var(--surface);
          border: 1px solid var(--line);
          color: var(--ink-2);
          border-radius: 999px;
          padding: 0.3rem 0.85rem;
          font-size: 0.82rem;
          transition: border-color 0.14s, color 0.14s, transform 0.14s var(--ease);
        }
        .chip:not(:disabled):hover {
          border-color: var(--accent);
          color: var(--accent);
          transform: translateY(-1px);
        }
        .chip:disabled { opacity: 0.5; cursor: default; }
        .errline {
          margin: 0;
          padding-left: 0.1rem;
          color: var(--poor);
          font-size: 0.85rem;
          animation: fade 0.25s ease;
        }
      `}</style>
    </form>
  );
}
