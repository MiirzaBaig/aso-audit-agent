"use client";

import type { KeywordRank } from "@aso/shared";

/**
 * Measured App Store search positions for the app's key terms — live evidence
 * of discoverability that turns the inferred keyword field into hard numbers.
 */
export function KeywordRanks({ ranks }: { ranks: KeywordRank[] }) {
  if (!ranks.length) return null;

  return (
    <div className="wrap">
      <p className="intro">
        Live App Store search positions — we searched each term and found where this app
        actually ranks.
      </p>
      <div className="grid">
        {ranks.map((r) => (
          <RankChip key={r.keyword} r={r} />
        ))}
      </div>
      <style jsx>{`
        .wrap { display: flex; flex-direction: column; gap: 1rem; }
        .intro { margin: 0; font-size: 0.88rem; color: var(--ink-3); max-width: 70ch; }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 0.75rem;
        }
      `}</style>
    </div>
  );
}

function RankChip({ r }: { r: KeywordRank }) {
  const found = r.rank !== null;
  const tone = !found ? "poor" : r.rank! <= 5 ? "good" : r.rank! <= 20 ? "fair" : "poor";
  const color = `var(--${tone})`;
  const wash = `var(--${tone}-wash)`;

  return (
    <div className="chip">
      <div className="top">
        <span className="kw">{r.keyword}</span>
      </div>
      <div className="val" style={{ color }}>
        {found ? (
          <>
            <span className="hash">#</span>
            <span className="rank mono">{r.rank}</span>
          </>
        ) : (
          <span className="miss mono">not in top {r.scanned}</span>
        )}
      </div>
      <span className="badge mono" style={{ color, background: wash }}>
        {!found ? "invisible" : r.rank! <= 5 ? "top 5" : r.rank! <= 20 ? "page 1–2" : "buried"}
      </span>

      <style jsx>{`
        .chip {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.9rem 1rem;
          border: 1px solid var(--line);
          border-radius: var(--r-md);
          background: var(--surface);
          transition: border-color 0.15s, transform 0.15s var(--ease);
        }
        .chip:hover { border-color: var(--line-2); transform: translateY(-2px); }
        .kw {
          font-size: 0.82rem;
          color: var(--ink-2);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .val { display: flex; align-items: baseline; gap: 0.15rem; }
        .hash { font-size: 1.1rem; font-weight: 600; opacity: 0.6; }
        .rank { font-size: 2rem; font-weight: 700; letter-spacing: -0.04em; line-height: 1; }
        .miss { font-size: 0.9rem; color: var(--ink-3); }
        .badge {
          align-self: flex-start;
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 0.15rem 0.45rem;
          border-radius: 5px;
        }
      `}</style>
    </div>
  );
}
