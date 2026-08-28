"use client";

import { useState } from "react";
import type { DimensionScore } from "@aso/shared";
import { bandColor } from "@/lib/score-format";

/**
 * The per-dimension score card: an animated meter per dimension, with its
 * weight, an "observed/partial" tag, and expandable evidence. This is the
 * accountability layer — every score shows the data behind it on click.
 */
export function DimensionBars({ dimensions }: { dimensions: DimensionScore[] }) {
  return (
    <div className="bars">
      {dimensions.map((d, i) => (
        <DimensionRow key={d.id} dim={d} index={i} />
      ))}
      <style jsx>{`
        .bars {
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}

function DimensionRow({ dim, index }: { dim: DimensionScore; index: number }) {
  const [open, setOpen] = useState(false);
  const color = bandColor(dim.score, 10);
  const pct = (dim.score / 10) * 100;

  return (
    <div className="row">
      <button
        className="head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="label-col">
          <span className="label">{dim.label}</span>
          {!dim.observable && <span className="tag" title="Not fully observable from public data">partial</span>}
        </div>

        <div className="meter" aria-hidden>
          <div
            className="fill"
            style={{
              width: `${pct}%`,
              background: color,
              animationDelay: `${index * 60}ms`,
            }}
          />
        </div>

        <div className="score-col">
          <span className="score mono" style={{ color }}>
            {dim.score.toFixed(1)}
          </span>
          <span className="weight mono">{dim.weight.toFixed(0)}%</span>
          <span className={`chev ${open ? "open" : ""}`} aria-hidden>›</span>
        </div>
      </button>

      {open && (
        <ul className="evidence">
          {dim.evidence.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      <style jsx>{`
        .row {
          border-bottom: 1px solid var(--border);
        }
        .head {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(120px, 1.1fr) 2fr auto;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 0.25rem;
          background: none;
          border: none;
          text-align: left;
          transition: background 0.12s;
        }
        .head:hover {
          background: var(--panel-2);
        }
        .label-col {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 0;
        }
        .label {
          font-weight: 600;
          font-size: 0.92rem;
          color: var(--ink);
        }
        .tag {
          font-family: var(--font-mono);
          font-size: 0.62rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--ink-3);
          background: var(--panel-2);
          border: 1px solid var(--border);
          padding: 0.05rem 0.35rem;
          border-radius: 5px;
        }
        .meter {
          height: 8px;
          border-radius: 999px;
          background: var(--panel-2);
          overflow: hidden;
        }
        .fill {
          height: 100%;
          border-radius: 999px;
          transform-origin: left;
          animation: grow 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes grow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .score-col {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .score {
          font-size: 1.05rem;
          font-weight: 700;
          min-width: 2.4ch;
          text-align: right;
        }
        .weight {
          font-size: 0.75rem;
          color: var(--ink-faint);
          min-width: 3ch;
        }
        .chev {
          color: var(--ink-faint);
          font-size: 1.2rem;
          transition: transform 0.18s;
        }
        .chev.open {
          transform: rotate(90deg);
          color: var(--accent);
        }
        .evidence {
          margin: 0;
          padding: 0.25rem 0.5rem 1rem 1.4rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          animation: fade 0.25s ease both;
        }
        .evidence li {
          font-size: 0.85rem;
          color: var(--ink-2);
          line-height: 1.5;
        }
        @keyframes fade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 620px) {
          .head {
            grid-template-columns: 1fr auto;
            grid-template-areas: "label score" "meter meter";
            row-gap: 0.5rem;
          }
          .label-col { grid-area: label; }
          .score-col { grid-area: score; }
          .meter { grid-area: meter; }
        }
      `}</style>
    </div>
  );
}
