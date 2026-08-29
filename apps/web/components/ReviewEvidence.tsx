"use client";

import { useState } from "react";
import type { ReviewTheme } from "@aso/shared";

/**
 * The proof layer. The Ratings & Reviews score references "recurring complaint
 * themes" — here the user can open any theme and read the ACTUAL reviews it was
 * mined from, verbatim. It turns "trust the score" into "verify it yourself".
 */
export function ReviewEvidence({
  themes,
  total,
}: {
  themes: ReviewTheme[];
  total: number;
}) {
  if (!themes.length) return null;

  return (
    <div className="wrap">
      <p className="intro">
        Themes mined from <b>{total} real recent reviews</b>. Open one to read the source
        reviews — nothing here is generated.
      </p>
      <div className="themes">
        {themes.map((t) => (
          <ThemeRow key={`${t.sentiment}-${t.theme}`} t={t} />
        ))}
      </div>
      <style jsx>{`
        .wrap { display: flex; flex-direction: column; gap: 1rem; }
        .intro { margin: 0; font-size: 0.88rem; color: var(--ink-3); }
        .intro b { color: var(--ink); font-weight: 600; }
        .themes {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
        }
        @media print {
          .wrap { gap: 3mm !important; }
          .intro { font-size: 8pt !important; }
          .themes {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 3mm !important;
          }
        }
      `}</style>
    </div>
  );
}

function ThemeRow({ t }: { t: ReviewTheme }) {
  const [open, setOpen] = useState(false);
  const isComplaint = t.sentiment === "complaint";
  const color = isComplaint ? "var(--poor)" : "var(--good)";
  const wash = isComplaint ? "var(--poor-wash)" : "var(--good-wash)";

  return (
    <>
      <button
        className={`pill ${open ? "on" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ ["--c" as string]: color, ["--w" as string]: wash }}
      >
        <span className="dot" aria-hidden />
        <span className="t">{t.theme}</span>
        <span className="n mono">{t.count}</span>
        <span className={`chev ${open ? "open" : ""}`} aria-hidden>›</span>
      </button>

      <div className={`samples ${open ? "open" : ""}`} style={{ ["--c" as string]: color }}>
        {t.samples.map((s, i) => (
          <blockquote key={i} className="review">
            <div className="rhead">
              <span className="stars" aria-label={`${s.rating} stars`}>
                {"★".repeat(s.rating)}
                <span className="empty">{"★".repeat(5 - s.rating)}</span>
              </span>
              <span className="author">{s.author}</span>
            </div>
            {s.title && <p className="rtitle">{s.title}</p>}
            <p className="rbody">{s.body}</p>
          </blockquote>
        ))}
      </div>

      <style jsx>{`
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.75rem;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: var(--surface);
          color: var(--ink-2);
          font-size: 0.85rem;
          font-weight: 500;
          transition: border-color 0.15s, background 0.15s, transform 0.15s var(--ease);
        }
        .pill:hover { transform: translateY(-1px); border-color: var(--c); }
        .pill.on {
          background: var(--w);
          border-color: var(--c);
          color: var(--ink);
        }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--c); }
        .n { font-size: 0.72rem; color: var(--ink-4); }
        .chev {
          color: var(--ink-4);
          transition: transform 0.2s var(--ease);
        }
        .chev.open { transform: rotate(90deg); color: var(--c); }
        .samples {
          flex-basis: 100%;
          display: none;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 0.75rem;
          margin: 0.25rem 0 0.5rem;
          animation: fade 0.3s ease both;
        }
        .samples.open { display: grid; }
        .review {
          margin: 0;
          padding: 0.85rem 1rem;
          border: 1px solid var(--line);
          border-left: 3px solid var(--c);
          border-radius: var(--r-sm);
          background: var(--surface);
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .rhead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .stars { font-size: 0.8rem; color: var(--fair); letter-spacing: 0.05em; }
        .empty { color: var(--line-2); }
        .author { font-size: 0.72rem; color: var(--ink-4); }
        .rtitle { margin: 0; font-size: 0.86rem; font-weight: 600; color: var(--ink); }
        .rbody { margin: 0; font-size: 0.82rem; color: var(--ink-2); line-height: 1.5; }
        @media print {
          .pill { display: none !important; }
          .samples {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 2.5mm !important;
            margin: 0 !important;
            break-inside: avoid !important;
          }
          .review {
            padding: 2.5mm 3mm !important;
            border-radius: 5px !important;
            break-inside: avoid !important;
            gap: 1mm !important;
          }
          .rhead { gap: 2mm !important; }
          .stars, .author { font-size: 7pt !important; }
          .rtitle { font-size: 8pt !important; }
          .rbody {
            font-size: 7.5pt !important;
            line-height: 1.35 !important;
          }
        }
      `}</style>
    </>
  );
}
