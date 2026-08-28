"use client";

import type { Recommendation, RecommendationTier } from "@aso/shared";
import { RECOMMENDATION_TIERS } from "@aso/shared";
import { TIER_META } from "@/lib/score-format";

/**
 * The prioritized action plan, grouped into the three tiers the brief asks for.
 * Text changes render as a before → after diff so the recommendation is
 * literally actionable, not just described.
 */
export function Recommendations({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <div className="tiers">
      {RECOMMENDATION_TIERS.map((tier) => {
        const items = recommendations.filter((r) => r.tier === tier);
        if (!items.length) return null;
        return <TierColumn key={tier} tier={tier} items={items} />;
      })}
      <style jsx>{`
        .tiers {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.25rem;
          align-items: start;
        }
      `}</style>
    </div>
  );
}

function TierColumn({ tier, items }: { tier: RecommendationTier; items: Recommendation[] }) {
  const meta = TIER_META[tier];
  return (
    <section className="col">
      <header>
        <span className="sym" aria-hidden>{meta.symbol}</span>
        <div>
          <h3>{meta.label}</h3>
          <span className="blurb">{meta.blurb}</span>
        </div>
        <span className="count mono">{items.length}</span>
      </header>
      <div className="cards">
        {items.map((r, i) => (
          <RecCard key={i} rec={r} />
        ))}
      </div>
      <style jsx>{`
        .col {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }
        header {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding-bottom: 0.6rem;
          border-bottom: 2px solid var(--border-strong);
        }
        .sym {
          font-size: 1.05rem;
          color: var(--accent);
        }
        h3 {
          font-size: 1rem;
          font-weight: 700;
        }
        .blurb {
          font-size: 0.72rem;
          color: var(--ink-3);
        }
        .count {
          margin-left: auto;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--accent);
          background: var(--accent-soft);
          border-radius: 999px;
          min-width: 1.6rem;
          height: 1.6rem;
          display: grid;
          place-items: center;
        }
        .cards {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }
      `}</style>
    </section>
  );
}

function RecCard({ rec }: { rec: Recommendation }) {
  const hasDiff = rec.before !== null || rec.after !== null;
  return (
    <article className="card">
      <div className="dim mono">{rec.dimension}</div>
      <h4>{rec.title}</h4>
      <p className="rationale">{rec.rationale}</p>

      {hasDiff && (
        <div className="diff">
          <div className="line before">
            <span className="k mono">before</span>
            <span className="v">{rec.before ?? "—"}</span>
          </div>
          <div className="line after">
            <span className="k mono">after</span>
            <span className="v">{rec.after ?? "—"}</span>
          </div>
        </div>
      )}

      <div className="evidence">
        <span className="dot" aria-hidden />
        {rec.evidence}
      </div>

      <style jsx>{`
        .card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem 1.05rem;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
        }
        .card:hover {
          border-color: var(--border-strong);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .dim {
          font-size: 0.66rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink-faint);
        }
        h4 {
          font-size: 0.98rem;
          font-weight: 700;
          line-height: 1.3;
          font-family: var(--font-display);
        }
        .rationale {
          margin: 0;
          font-size: 0.86rem;
          color: var(--ink-2);
          line-height: 1.5;
        }
        .diff {
          display: flex;
          flex-direction: column;
          gap: 1px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .line {
          display: grid;
          grid-template-columns: 4.2rem 1fr;
          gap: 0.5rem;
          padding: 0.5rem 0.65rem;
          font-size: 0.82rem;
        }
        .before {
          background: var(--poor-soft);
        }
        .after {
          background: var(--good-soft);
        }
        .k {
          font-size: 0.64rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding-top: 0.12rem;
        }
        .before .k { color: var(--poor); }
        .after .k { color: var(--good); }
        .v {
          color: var(--ink);
          word-break: break-word;
          line-height: 1.4;
        }
        .evidence {
          display: flex;
          gap: 0.5rem;
          font-size: 0.76rem;
          color: var(--ink-3);
          font-style: italic;
          line-height: 1.45;
          padding-top: 0.15rem;
        }
        .dot {
          flex: none;
          margin-top: 0.4rem;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
        }
      `}</style>
    </article>
  );
}
