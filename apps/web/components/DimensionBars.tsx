"use client";

import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import type { DimensionScore } from "@aso/shared";
import { bandColor, bandWash, biggestLever } from "@/lib/score-format";

type Filter = "all" | "strong" | "weak";

/** Why a dimension is only partially observable — shown in the badge tooltip. */
function observabilityReason(id: string): string {
  switch (id) {
    case "keywords":
      return "Apple keeps the iOS keyword field private — this is inferred from the title, subtitle and description.";
    case "screenshots":
      return "Slot count is measured and Deep scan can OCR captions, but design cohesion still needs a visual review.";
    case "video":
      return "Public metadata confirms presence only; hook, pacing and muted comprehension need a manual watch.";
    case "reviews":
      return "Ratings and recent review text are measured, but developer response coverage is not in Apple's public RSS feed.";
    case "icon":
      return "Icon presence is confirmed, but distinctiveness at small sizes is a visual judgment.";
    case "conversion":
      return "In-App Events and custom product pages aren't exposed in public metadata.";
    case "competitive":
      return "Competitors are a search-based heuristic, not Apple's real ranking neighbours.";
    default:
      return "Not fully observable from public data.";
  }
}

/**
 * Interactive dimension breakdown: collapsed rows sorted worst→best, each with
 * a bold colored score chip + mini-meter. A segment toggle filters to
 * strengths / needs-work. The single highest-leverage weak dimension is tagged.
 * Evidence expands on tap — nothing is dumped by default.
 */
export function DimensionBars({ dimensions }: { dimensions: DimensionScore[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const lever = useMemo(() => biggestLever(dimensions), [dimensions]);

  useEffect(() => {
    const showAllForPdf = () => flushSync(() => setFilter("all"));
    window.addEventListener("beforeprint", showAllForPdf);
    return () => window.removeEventListener("beforeprint", showAllForPdf);
  }, []);

  const sorted = useMemo(
    () => [...dimensions].sort((a, b) => a.score - b.score),
    [dimensions],
  );
  const shown = sorted.filter((d) =>
    filter === "all" ? true : filter === "strong" ? d.score >= 7.5 : d.score < 7.5,
  );

  const counts = {
    all: dimensions.length,
    strong: dimensions.filter((d) => d.score >= 7.5).length,
    weak: dimensions.filter((d) => d.score < 7.5).length,
  };

  return (
    <div className="wrap">
      <div className="toolbar">
        <div className="segment" role="tablist" aria-label="Filter dimensions">
          {(["all", "strong", "weak"] as const).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              className={filter === f ? "seg on" : "seg"}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "strong" ? "Strengths" : "Needs work"}
              <span className="c mono">{counts[f]}</span>
            </button>
          ))}
        </div>
        <Legend />
      </div>
      <p className="weight-note">
        Brief weights total 110%, so this report preserves the relative weights and
        normalizes them to a true 100-point score.
      </p>

      <div className="rows">
        {shown.map((d, i) => (
          <DimensionRow key={d.id} dim={d} index={i} isLever={d.id === lever} />
        ))}
      </div>

      <style jsx>{`
        .wrap { display: flex; flex-direction: column; gap: 1.25rem; }
        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .weight-note {
          margin: -0.25rem 0 0;
          max-width: 72ch;
          font-size: 0.76rem;
          line-height: 1.45;
          color: var(--ink-4);
        }
        .segment {
          display: inline-flex;
          padding: 3px;
          background: var(--surface-2);
          border: 1px solid var(--line);
          border-radius: 999px;
        }
        .seg {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          border: none;
          background: none;
          color: var(--ink-3);
          font-size: 0.82rem;
          font-weight: 500;
          padding: 0.35rem 0.85rem;
          border-radius: 999px;
          transition: color 0.15s, background 0.2s var(--ease), transform 0.14s var(--ease);
        }
        .seg:not(.on):hover {
          color: var(--ink);
          background: color-mix(in srgb, var(--surface) 72%, transparent);
        }
        .seg:active { transform: translateY(1px); }
        .seg .c {
          font-size: 0.68rem;
          color: var(--ink-4);
        }
        .seg.on {
          background: var(--surface);
          color: var(--ink);
          box-shadow: var(--shadow-1);
        }
        .seg.on .c { color: var(--accent); }
        .rows { display: flex; flex-direction: column; }
        @media print {
          .wrap { gap: 3mm !important; }
          .toolbar { display: none !important; }
          .weight-note {
            margin: 0 !important;
            font-size: 7pt !important;
          }
          .rows { gap: 0 !important; }
        }
      `}</style>
    </div>
  );
}

function Legend() {
  return (
    <div className="legend">
      <Dot c="var(--good)" l="7.5+" />
      <Dot c="var(--fair)" l="5–7.5" />
      <Dot c="var(--poor)" l="<5" />
      <style jsx>{`
        .legend { display: flex; gap: 0.9rem; }
      `}</style>
    </div>
  );
}
function Dot({ c, l }: { c: string; l: string }) {
  return (
    <span className="d">
      <span className="dot" style={{ background: c }} aria-hidden />
      <span className="l mono">{l}</span>
      <style jsx>{`
        .d { display: inline-flex; align-items: center; gap: 0.35rem; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .l { font-size: 0.68rem; color: var(--ink-4); }
      `}</style>
    </span>
  );
}

function DimensionRow({
  dim,
  index,
  isLever,
}: {
  dim: DimensionScore;
  index: number;
  isLever: boolean;
}) {
  const [open, setOpen] = useState(false);
  const color = bandColor(dim.score, 10);
  const wash = bandWash(dim.score, 10);
  const pct = (dim.score / 10) * 100;

  return (
    <div className={`row ${open ? "open" : ""}`} style={{ ["--i" as string]: index }}>
      <button className="head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="rail" style={{ background: color, opacity: isLever ? 1 : 0.28 }} aria-hidden />

        <span className="chip mono" style={{ color, background: wash }}>
          {dim.score.toFixed(1)}
        </span>

        <div className="mid">
          <div className="titles">
            <span className="name">{dim.label}</span>
            {isLever && <span className="lever">biggest lever</span>}
            {!dim.observable && (
              <span
                className="tag"
                tabIndex={0}
                data-tip={observabilityReason(dim.id)}
                aria-label={`Partially observable: ${observabilityReason(dim.id)}`}
              >
                inferred
                <span className="tip" role="tooltip">{observabilityReason(dim.id)}</span>
              </span>
            )}
          </div>
          <div className="meter" aria-hidden>
            <div
              className="fill"
              style={{ width: `${pct}%`, background: color, animationDelay: `${index * 45}ms` }}
            />
          </div>
        </div>

        <span className="weight mono">{dim.weight.toFixed(0)}%</span>
        <span className={`chev ${open ? "on" : ""}`} aria-hidden>›</span>
      </button>

      <div className={`evwrap ${open ? "open" : ""}`}>
        <div className="evinner">
          <ul className="evidence">
            {dim.evidence.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      </div>

      <style jsx>{`
        .row {
          border-bottom: 1px solid var(--line);
          animation: fade 0.4s ease both;
          animation-delay: calc(var(--i) * 30ms);
        }
        .row:last-child { border-bottom: none; }
        .head {
          width: 100%;
          display: grid;
          grid-template-columns: 3px 3rem 1fr auto auto;
          align-items: center;
          gap: 0.9rem;
          padding: 0.85rem 0.6rem 0.85rem 0;
          background: none;
          border: none;
          text-align: left;
          transition: background 0.14s, transform 0.14s var(--ease);
          border-radius: var(--r-sm);
        }
        .head:hover { background: var(--surface-2); transform: translateX(2px); }
        .head:active { transform: translateX(0); }
        .rail {
          height: 30px;
          width: 3px;
          border-radius: 2px;
          transition: opacity 0.2s;
        }
        .chip {
          justify-self: start;
          font-size: 0.9rem;
          font-weight: 700;
          padding: 0.28rem 0;
          width: 3rem;
          text-align: center;
          border-radius: var(--r-xs);
          letter-spacing: -0.02em;
        }
        .mid { min-width: 0; display: flex; flex-direction: column; gap: 0.45rem; }
        .titles { display: flex; align-items: center; gap: 0.5rem; }
        .name { font-weight: 600; font-size: 0.95rem; color: var(--ink); }
        .lever {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--accent);
          background: var(--accent-wash);
          border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
          padding: 0.1rem 0.4rem;
          border-radius: 5px;
          white-space: nowrap;
        }
        .tag {
          position: relative;
          font-family: var(--font-mono);
          font-size: 0.58rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--ink-4);
          border: 1px dashed var(--line-2);
          padding: 0.08rem 0.35rem;
          border-radius: 5px;
          cursor: help;
          transition: color 0.15s, border-color 0.15s;
        }
        .tag:hover, .tag:focus-visible { color: var(--ink-2); border-color: var(--ink-4); outline: none; }
        .tip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          width: max-content;
          max-width: 240px;
          padding: 0.5rem 0.65rem;
          background: var(--ink);
          color: var(--bg);
          font-family: var(--font-body);
          font-size: 0.72rem;
          letter-spacing: 0;
          text-transform: none;
          line-height: 1.4;
          border-radius: var(--r-sm);
          box-shadow: var(--shadow-3);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.18s, transform 0.18s var(--ease);
          z-index: 20;
        }
        .tip::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: var(--ink);
        }
        .tag:hover .tip, .tag:focus-visible .tip {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .meter {
          height: 5px;
          border-radius: 999px;
          background: var(--surface-2);
          overflow: hidden;
          max-width: 340px;
        }
        .fill {
          height: 100%;
          border-radius: 999px;
          transform-origin: left;
          animation: grow 0.7s var(--ease) both;
        }
        @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .weight { font-size: 0.76rem; color: var(--ink-4); min-width: 3ch; text-align: right; }
        .chev {
          color: var(--ink-4);
          font-size: 1.2rem;
          transition: transform 0.2s var(--ease), color 0.15s;
        }
        .chev.on { transform: rotate(90deg); color: var(--accent); }
        /* smooth height reveal via grid-rows 0fr→1fr */
        .evwrap {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.32s var(--ease);
        }
        .evwrap.open { grid-template-rows: 1fr; }
        .evinner { overflow: hidden; }
        .evidence {
          margin: 0;
          padding: 0.1rem 0.6rem 1.1rem 6.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          opacity: 0;
          transform: translateY(-4px);
          transition: opacity 0.28s ease 0.05s, transform 0.28s var(--ease) 0.05s;
        }
        .evwrap.open .evidence { opacity: 1; transform: translateY(0); }
        .evidence li { font-size: 0.84rem; color: var(--ink-2); line-height: 1.55; }
        @media (max-width: 620px) {
          .head { grid-template-columns: 3px auto 1fr auto; gap: 0.6rem; }
          .chev { display: none; }
          .evidence { padding-left: 1.5rem; }
        }
        @media print {
          .row {
            break-inside: avoid !important;
            animation: none !important;
          }
          .head {
            grid-template-columns: 3px 26px 1fr 28px !important;
            gap: 3mm !important;
            padding: 2.5mm 0 !important;
            transform: none !important;
            background: transparent !important;
          }
          .chip {
            width: 26px !important;
            padding: 0 !important;
            font-size: 8pt !important;
          }
          .titles { flex-wrap: wrap !important; gap: 1.5mm !important; }
          .lever, .tag { font-size: 6pt !important; }
          .tip, .chev { display: none !important; }
          .meter { max-width: none !important; height: 3px !important; }
          .evwrap { grid-template-rows: 1fr !important; }
          .evinner { overflow: visible !important; }
          .evidence {
            padding: 0 0 2.5mm 10mm !important;
            gap: 1mm !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .evidence li {
            font-size: 8pt !important;
            line-height: 1.35 !important;
          }
        }
      `}</style>
    </div>
  );
}
