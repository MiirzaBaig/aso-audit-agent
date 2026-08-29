"use client";

import { useState } from "react";
import type { Recommendation, RecommendationTier } from "@aso/shared";
import { RECOMMENDATION_TIERS } from "@aso/shared";
import { TIER_META, DIMENSION_ICON, effortFor } from "@/lib/score-format";

/**
 * The ranked action plan as a single vertical reading column — no cards.
 * Tiers are lightweight section headers; each recommendation is a row divided
 * by a hairline rule. Text changes render as an inline from → to diff. This
 * reads top-to-bottom like a well-set document, not a wall of boxes.
 */
export function Recommendations({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <div className="plan">
      {RECOMMENDATION_TIERS.map((tier) => {
        const items = recommendations.filter((r) => r.tier === tier);
        if (!items.length) return null;
        return <TierBlock key={tier} tier={tier} items={items} />;
      })}
      <style jsx>{`
        .plan {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }
        @media print {
          .plan { gap: 5mm !important; }
        }
      `}</style>
    </div>
  );
}

function TierBlock({ tier, items }: { tier: RecommendationTier; items: Recommendation[] }) {
  const meta = TIER_META[tier];
  return (
    <section className="tier">
      <header>
        <span className="mark mono">{meta.mark}</span>
        <h4>{meta.label}</h4>
        <span className="blurb">{meta.blurb}</span>
        <span className="count mono">{items.length}</span>
      </header>

      <ol className="rows">
        {items.map((r, i) => (
          <RecRow key={i} rec={r} index={i + 1} />
        ))}
      </ol>

      <style jsx>{`
        .tier { display: flex; flex-direction: column; }
        header {
          display: flex;
          align-items: baseline;
          gap: 0.7rem;
          padding-bottom: 0.85rem;
          border-bottom: 1px solid var(--ink);
          margin-bottom: 0.25rem;
        }
        .mark { font-size: 0.8rem; color: var(--accent); font-weight: 500; }
        h4 { font-size: 1.05rem; font-weight: 600; }
        .blurb { font-size: 0.78rem; color: var(--ink-3); }
        .count { margin-left: auto; font-size: 0.78rem; color: var(--ink-4); }
        .rows { list-style: none; margin: 0; padding: 0; }
        @media print {
          .tier { break-inside: auto !important; }
          header {
            padding-bottom: 2mm !important;
            margin-bottom: 0 !important;
          }
          h4 { font-size: 10pt !important; }
          .blurb { display: none !important; }
        }
      `}</style>
    </section>
  );
}

function RecRow({ rec, index }: { rec: Recommendation; index: number }) {
  const hasDiff = rec.before !== null || rec.after !== null;
  const effort = effortFor(rec.tier);
  const iconPath = DIMENSION_ICON[rec.dimension];

  return (
    <li className="row">
      <div className="rail">
        <span className="idx mono">{String(index).padStart(2, "0")}</span>
        <span className="dicon" aria-hidden>
          {iconPath && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d={iconPath} />
            </svg>
          )}
        </span>
        <span className="dim mono">{rec.dimension}</span>
      </div>

      <div className="content">
        <div className="titlerow">
          <h5>{rec.title}</h5>
          <span className="effort" title={effort.label}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={`edot ${i < effort.dots ? "on" : ""}`} />
            ))}
          </span>
        </div>
        <p className="rationale">{rec.rationale}</p>

        {hasDiff && (
          <div className="diff">
            <div className="d-line">
              <span className="d-k mono from">from</span>
              <span className="d-v old">{rec.before ?? "—"}</span>
            </div>
            <div className="d-line">
              <span className="d-k mono to">to</span>
              <span className="d-v new">
                {rec.after ?? "—"}
                {rec.after && <CopyButton text={rec.after} />}
              </span>
            </div>
          </div>
        )}

        <p className="evidence">{rec.evidence}</p>
      </div>

      <style jsx>{`
        .row {
          display: grid;
          grid-template-columns: 118px 1fr;
          gap: 1.25rem;
          padding: 0.95rem 0.5rem;
          border-bottom: 1px solid var(--line);
          border-radius: var(--r-sm);
          transition: background 0.16s var(--ease);
        }
        .row:last-child { border-bottom: none; }
        .row:hover { background: var(--surface-2); }

        /* left rail — index + dimension icon + label, a real anchor */
        .rail {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          padding-top: 0.1rem;
        }
        .idx {
          font-size: 0.72rem;
          color: var(--ink-4);
          font-weight: 500;
        }
        .dicon {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: var(--surface-2);
          border: 1px solid var(--line);
          color: var(--ink-3);
          transition: color 0.16s, border-color 0.16s, background 0.16s;
        }
        .dicon svg { width: 16px; height: 16px; }
        .row:hover .dicon {
          color: var(--accent);
          border-color: color-mix(in srgb, var(--accent) 30%, transparent);
          background: var(--accent-wash);
        }
        .dim {
          font-size: 0.6rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ink-4);
        }
        .content { min-width: 0; display: flex; flex-direction: column; gap: 0.35rem; }
        .titlerow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
        }
        h5 {
          font-family: var(--font-display);
          font-size: 0.98rem;
          font-weight: 600;
          line-height: 1.3;
          letter-spacing: -0.02em;
          max-width: 60ch;
        }
        .effort {
          display: inline-flex;
          gap: 3px;
          flex: none;
          align-items: center;
        }
        .edot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--line-2);
        }
        .edot.on { background: var(--accent); }
        .rationale {
          margin: 0;
          font-size: 0.87rem;
          color: var(--ink-2);
          line-height: 1.55;
          max-width: 68ch;
        }
        .diff {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          margin: 0.25rem 0 0.1rem;
          max-width: 72ch;
        }
        .d-line {
          display: grid;
          grid-template-columns: 3rem 1fr;
          gap: 0.75rem;
          align-items: start;
        }
        .d-k {
          font-size: 0.64rem;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          padding-top: 0.2rem;
        }
        .from { color: var(--ink-4); }
        .to { color: var(--good); }
        .d-v {
          font-size: 0.88rem;
          line-height: 1.5;
          word-break: break-word;
          padding: 0.3rem 0.65rem;
          border-radius: var(--r-xs);
        }
        .old {
          color: var(--ink-3);
          background: var(--surface-2);
          text-decoration: line-through;
          text-decoration-color: var(--ink-4);
        }
        .new {
          position: relative;
          color: var(--ink);
          background: var(--good-wash);
          box-shadow: inset 2px 0 0 var(--good);
          padding-right: 2rem;
        }
        .evidence {
          margin: 0.15rem 0 0;
          font-size: 0.76rem;
          color: var(--ink-4);
          line-height: 1.45;
          font-family: var(--font-mono);
          max-width: 70ch;
        }
        @media (max-width: 640px) {
          .row { grid-template-columns: 1fr; gap: 0.7rem; padding: 1rem 0.15rem; }
          /* rail becomes a compact horizontal strip above the content */
          .rail {
            flex-direction: row;
            align-items: center;
            gap: 0.55rem;
          }
          .dim { margin-left: auto; }
          .d-v { font-size: 0.84rem; }
        }
        @media print {
          .row {
            grid-template-columns: 24mm 1fr !important;
            gap: 5mm !important;
            padding: 3mm 0 !important;
            break-inside: avoid !important;
            border-radius: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            transform: none !important;
          }
          .content { gap: 1.5mm !important; }
          h5 {
            font-size: 9.5pt !important;
            line-height: 1.25 !important;
            max-width: none !important;
          }
          .rationale {
            font-size: 8pt !important;
            line-height: 1.35 !important;
            max-width: none !important;
          }
          .diff { gap: 1mm !important; margin: 1mm 0 !important; max-width: none !important; }
          .d-line {
            grid-template-columns: 11mm 1fr !important;
            gap: 2mm !important;
          }
          .d-k { font-size: 6.5pt !important; }
          .d-v {
            font-size: 7.5pt !important;
            line-height: 1.3 !important;
            padding: 1mm 2mm !important;
          }
          .evidence {
            font-size: 7pt !important;
            line-height: 1.3 !important;
            max-width: none !important;
          }
          .effort, .dicon { display: none !important; }
          .new { padding-right: 2mm !important; }
        }
      `}</style>
    </li>
  );
}

/** Copy-the-rewrite button that lives inside the green "to" value on hover. */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };
  return (
    <button className={`copy ${copied ? "done" : ""}`} onClick={copy} aria-label="Copy rewrite" title="Copy">
      {copied ? (
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4L19 6" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4h9a1 1 0 011 1v11M6 8h9a1 1 0 011 1v9a1 1 0 01-1 1H6a1 1 0 01-1-1V9a1 1 0 011-1z" /></svg>
      )}
      <style jsx>{`
        .copy {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--ink-4);
          opacity: 0.45;
          transition: opacity 0.15s, color 0.15s, background 0.15s, border-color 0.15s,
            transform 0.12s var(--ease);
        }
        .copy:hover {
          opacity: 1;
          color: var(--good);
          background: var(--surface);
          border-color: var(--line);
          transform: translateY(-1px);
        }
        .copy:active { transform: translateY(0); }
        .copy.done { opacity: 1; color: var(--good); }
      `}</style>
    </button>
  );
}
