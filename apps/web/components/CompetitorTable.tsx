"use client";

import Image from "next/image";
import type { AppIdentity, CompetitorComparison, ScoreCard } from "@aso/shared";

/**
 * Side-by-side comparison of the audited app against its discovered
 * competitors. The app's own row is pinned first and highlighted; the metrics
 * are the objective, observable ones (rating, volume, screenshots, video).
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
  return (
    <div className="wrap">
      <p className="narrative">{comparison.narrative}</p>

      {comparison.competitors.length > 0 ? (
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th className="app-col">App</th>
                <th>ASO</th>
                <th>Rating</th>
                <th>Ratings</th>
                <th>Screens</th>
                <th>Video</th>
              </tr>
            </thead>
            <tbody>
              <tr className="self">
                <td className="app-col">
                  <Image src={identity.iconUrl} alt="" width={30} height={30} className="ic" />
                  <span className="name">{identity.name}</span>
                  <span className="you mono">you</span>
                </td>
                <td className="mono strong">{scoreCard.overall}</td>
                <td className="mono">—</td>
                <td className="mono">—</td>
                <td className="mono">—</td>
                <td className="mono">—</td>
              </tr>
              {comparison.competitors.map((c) => (
                <tr key={c.appId}>
                  <td className="app-col">
                    <Image src={c.iconUrl} alt="" width={30} height={30} className="ic" />
                    <span className="name">{c.name}</span>
                  </td>
                  <td className="mono muted">—</td>
                  <td className="mono">{c.averageRating.toFixed(1)}★</td>
                  <td className="mono">{compact(c.ratingCount)}</td>
                  <td className="mono">{c.screenshotCount}</td>
                  <td className="mono">{c.hasVideo ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">No comparable competitors were identified in this storefront.</p>
      )}

      <style jsx>{`
        .wrap {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .narrative {
          margin: 0;
          font-size: 0.92rem;
          line-height: 1.6;
          color: var(--ink-2);
        }
        .scroll {
          overflow-x: auto;
          border: 1px solid var(--border);
          border-radius: var(--radius);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }
        th {
          text-align: right;
          font-family: var(--font-mono);
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink-3);
          font-weight: 500;
          padding: 0.7rem 0.9rem;
          background: var(--panel-2);
          white-space: nowrap;
        }
        th.app-col {
          text-align: left;
        }
        td {
          padding: 0.7rem 0.9rem;
          text-align: right;
          border-top: 1px solid var(--border);
          color: var(--ink);
          white-space: nowrap;
        }
        td.app-col {
          text-align: left;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .self td {
          background: var(--accent-soft);
        }
        .strong {
          font-weight: 700;
          color: var(--accent);
        }
        .muted {
          color: var(--ink-faint);
        }
        .name {
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 22ch;
        }
        .you {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--accent);
          border: 1px solid var(--accent);
          border-radius: 5px;
          padding: 0.05rem 0.3rem;
        }
        .empty {
          font-size: 0.88rem;
          color: var(--ink-3);
          font-style: italic;
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
