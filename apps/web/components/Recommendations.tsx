"use client";

import type { Recommendation, RecommendationTier } from "@aso/shared";
import { RECOMMENDATION_TIERS } from "@aso/shared";
import { TIER_META } from "@/lib/score-format";

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
          <RecRow key={i} rec={r} />
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
      `}</style>
    </section>
  );
}

function RecRow({ rec }: { rec: Recommendation }) {
  const hasDiff = rec.before !== null || rec.after !== null;
  return (
    <li className="row">
      <div className="meta">
        <span className="dim label">{rec.dimension}</span>
      </div>

      <div className="content">
        <h5>{rec.title}</h5>
        <p className="rationale">{rec.rationale}</p>

        {hasDiff && (
          <div className="diff">
            <div className="d-line">
              <span className="d-k mono from">from</span>
              <span className="d-v old">{rec.before ?? "—"}</span>
            </div>
            <div className="d-line">
              <span className="d-k mono to">to</span>
              <span className="d-v new">{rec.after ?? "—"}</span>
            </div>
          </div>
        )}

        <p className="evidence">{rec.evidence}</p>
      </div>

      <style jsx>{`
        .row {
          display: grid;
          grid-template-columns: 130px 1fr;
          gap: 1.5rem;
          padding: 1.4rem 0;
          border-bottom: 1px solid var(--line);
        }
        .row:last-child { border-bottom: none; }
        .meta { padding-top: 0.2rem; }
        .dim { color: var(--ink-4); }
        .content { min-width: 0; display: flex; flex-direction: column; gap: 0.55rem; }
        h5 {
          font-family: var(--font-display);
          font-size: 1.02rem;
          font-weight: 600;
          line-height: 1.3;
          letter-spacing: -0.02em;
          max-width: 62ch;
        }
        .rationale {
          margin: 0;
          font-size: 0.9rem;
          color: var(--ink-2);
          line-height: 1.6;
          max-width: 68ch;
        }
        .diff {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin: 0.35rem 0 0.15rem;
          max-width: 70ch;
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
          color: var(--ink);
          background: var(--good-wash);
          box-shadow: inset 2px 0 0 var(--good);
        }
        .evidence {
          margin: 0.2rem 0 0;
          font-size: 0.78rem;
          color: var(--ink-4);
          line-height: 1.5;
          font-family: var(--font-mono);
          max-width: 70ch;
        }
        @media (max-width: 640px) {
          .row { grid-template-columns: 1fr; gap: 0.6rem; }
          .meta { padding-top: 0; }
        }
      `}</style>
    </li>
  );
}
