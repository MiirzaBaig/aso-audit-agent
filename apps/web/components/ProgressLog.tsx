"use client";

import { useEffect, useState } from "react";

/**
 * Keeps the user informed while the audit runs. The audit is a single backend
 * call, so we surface the real pipeline stages on a timed reveal — each line
 * corresponds to an actual step the server performs (discover competitors,
 * compute the deterministic score card, synthesize the action plan).
 */
const STAGES = [
  "Reading the listing metadata from Apple",
  "Pulling recent ratings & reviews",
  "Finding category competitors",
  "Scoring 10 dimensions against Apple's ranking heuristics",
  "Writing the prioritized action plan",
] as const;

export function ProgressLog() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => Math.min(a + 1, STAGES.length - 1));
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="log" role="status" aria-live="polite">
      <span className="eyebrow">Running audit</span>
      <ul>
        {STAGES.map((s, i) => {
          const state = i < active ? "done" : i === active ? "active" : "pending";
          return (
            <li key={s} className={state}>
              <span className="mark" aria-hidden>
                {state === "done" ? "✓" : state === "active" ? "" : ""}
              </span>
              <span className="text">{s}</span>
            </li>
          );
        })}
      </ul>

      <style jsx>{`
        .log {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.1rem 1.25rem;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          animation: fade 0.3s ease both;
        }
        @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
        ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        li {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          font-size: 0.9rem;
          transition: color 0.3s;
        }
        li.pending { color: var(--ink-faint); }
        li.active { color: var(--ink); font-weight: 600; }
        li.done { color: var(--ink-2); }
        .mark {
          width: 18px;
          height: 18px;
          flex: none;
          display: grid;
          place-items: center;
          border-radius: 50%;
          font-size: 0.7rem;
        }
        li.done .mark {
          background: var(--good);
          color: var(--accent-ink);
        }
        li.pending .mark {
          border: 2px solid var(--border-strong);
        }
        li.active .mark {
          border: 2px solid var(--accent);
          border-top-color: transparent;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
