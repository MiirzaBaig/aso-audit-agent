"use client";

import Image from "next/image";
import type { AppIdentity, CompetitorComparison, ScoreCard } from "@aso/shared";

/**
 * The app vs. its discovered competitors. The audited app is pinned first as a
 * bold accent row; competitors follow with their objective, observable metrics.
 * A thin rating bar under each star value turns the numbers into a quick visual
 * comparison. The comparison set is a transparent search-based heuristic.
 */
export function CompetitorTable({
  identity,
  scoreCard,
  comparison,
}: {
  identity: AppIdentity;
  scoreCard: ScoreCard;
  comparison: CompetitorComparison;
}) {
  const maxRatings = Math.max(1, ...comparison.competitors.map((c) => c.ratingCount));

  return (
    <div className="wrap">
      <p className="narrative">{comparison.narrative}</p>

      {comparison.competitors.length > 0 ? (
        <div className="list">
          <div className="hrow">
            <span className="label">App</span>
            <span className="label r">Rating</span>
            <span className="label r">Ratings</span>
            <span className="label r">Screens</span>
            <span className="label r">Video</span>
          </div>

          {/* the audited app */}
          <div className="prow you">
            <div className="app">
              <Image src={identity.iconUrl} alt="" width={34} height={34} className="ic" />
              <div className="who">
                <span className="nm">{identity.name}</span>
                <span className="you-tag mono">your app · {scoreCard.overall}/100</span>
              </div>
            </div>
            <span className="v mono dim">—</span>
            <span className="v mono dim">—</span>
            <span className="v mono dim">—</span>
            <span className="v mono dim">—</span>
          </div>

          {comparison.competitors.map((c) => (
            <div className="prow" key={c.appId}>
              <div className="app">
                <Image src={c.iconUrl} alt="" width={34} height={34} className="ic" />
                <span className="nm">{c.name}</span>
              </div>
              <div className="v ratingcell">
                <span className="mono">{c.averageRating.toFixed(1)}★</span>
                <span className="rbar" aria-hidden>
                  <span style={{ width: `${(c.averageRating / 5) * 100}%` }} />
                </span>
              </div>
              <span className="v mono">{compact(c.ratingCount)}</span>
              <span className="v mono">{c.screenshotCount}</span>
              <span className="v mono">{c.hasVideo ? <b className="yes">✓</b> : "—"}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty">No comparable competitors were identified in this storefront.</p>
      )}

      <style jsx>{`
        .wrap { display: flex; flex-direction: column; gap: 1.25rem; }
        .narrative {
          margin: 0;
          font-size: 0.92rem;
          line-height: 1.65;
          color: var(--ink-2);
          max-width: 78ch;
        }
        .list { display: flex; flex-direction: column; }
        .hrow, .prow {
          display: grid;
          grid-template-columns: 1fr 130px 90px 80px 60px;
          align-items: center;
          gap: 0.5rem;
        }
        .hrow {
          padding: 0 0.9rem 0.6rem;
          border-bottom: 1px solid var(--ink);
        }
        .label.r { text-align: right; }
        .prow {
          padding: 0.85rem 0.9rem;
          border-bottom: 1px solid var(--line);
          border-radius: var(--r-sm);
          transition: background 0.14s, transform 0.14s var(--ease);
        }
        .prow:last-child { border-bottom: none; }
        .prow:not(.you):hover { background: var(--surface-2); transform: translateX(2px); }
        .prow.you {
          background: var(--accent-wash);
          box-shadow: inset 3px 0 0 var(--accent);
          border-bottom: 1px solid var(--line);
        }
        .app { display: flex; align-items: center; gap: 0.7rem; min-width: 0; }
        .ic { width: 34px; height: 34px; }
        .who { display: flex; flex-direction: column; min-width: 0; }
        .nm {
          font-weight: 600;
          font-size: 0.9rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .you-tag { font-size: 0.68rem; color: var(--accent); }
        .v { text-align: right; font-size: 0.88rem; color: var(--ink); }
        .v.dim { color: var(--ink-4); }
        .ratingcell {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.3rem;
        }
        .rbar {
          display: block;
          width: 100%;
          max-width: 88px;
          height: 4px;
          background: var(--surface-2);
          border-radius: 999px;
          overflow: hidden;
        }
        .rbar span {
          display: block;
          height: 100%;
          background: var(--good);
          border-radius: 999px;
          transition: width 0.45s var(--ease);
        }
        .yes { color: var(--good); }
        .empty { font-size: 0.88rem; color: var(--ink-3); }
        @media (max-width: 640px) {
          .hrow { display: none; }
          .prow {
            grid-template-columns: 1fr auto;
            gap: 0.75rem 1rem;
          }
          .prow .app { grid-column: 1 / -1; }
          .ratingcell { align-items: flex-start; }
        }
        @media print {
          .wrap { gap: 3mm !important; }
          .narrative {
            max-width: none !important;
            font-size: 8pt !important;
            line-height: 1.35 !important;
          }
          .hrow, .prow {
            grid-template-columns: 1fr 22mm 20mm 16mm 14mm !important;
            gap: 2mm !important;
          }
          .hrow {
            display: grid !important;
            padding: 0 0 2mm !important;
          }
          .prow {
            padding: 2mm 0 !important;
            border-radius: 0 !important;
            transform: none !important;
            background: transparent !important;
          }
          .prow.you {
            background: var(--accent-wash) !important;
            box-shadow: inset 2px 0 0 var(--accent) !important;
            padding-left: 2mm !important;
            padding-right: 2mm !important;
          }
          .ic {
            width: 24px !important;
            height: 24px !important;
          }
          .nm, .v { font-size: 7.5pt !important; }
          .you-tag { font-size: 6.5pt !important; }
          .rbar { max-width: 18mm !important; height: 3px !important; }
        }
      `}</style>
    </div>
  );
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
