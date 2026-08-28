"use client";

import { useEffect, useRef, useState } from "react";
import { bandColor, GRADE_BLURB } from "@/lib/score-format";

interface Props {
  overall: number;
  grade: string;
}

/**
 * The hero of the report: a radial gauge that animates the arc and counts the
 * number up on mount. The arc color is semantic (good/fair/poor), deliberately
 * distinct from the indigo accent.
 */
export function ScoreGauge({ overall, grade }: Props) {
  const [n, setN] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(overall);
      return;
    }
    const start = performance.now();
    const dur = 1100;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setN(Math.round(eased * overall));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [overall]);

  const R = 78;
  const C = 2 * Math.PI * R;
  const pct = n / 100;
  const color = bandColor(overall, 100);

  return (
    <div className="gauge">
      <svg viewBox="0 0 200 200" width="200" height="200" role="img" aria-label={`Overall ASO score ${overall} out of 100`}>
        <circle cx="100" cy="100" r={R} fill="none" stroke="var(--border)" strokeWidth="12" />
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          transform="rotate(-90 100 100)"
          style={{ transition: "stroke-dashoffset 0.05s linear" }}
        />
        <text x="100" y="96" textAnchor="middle" className="num mono" fill="var(--ink)">
          {n}
        </text>
        <text x="100" y="120" textAnchor="middle" className="denom mono" fill="var(--ink-faint)">
          / 100
        </text>
      </svg>
      <div className="meta">
        <span className="grade-pill" style={{ color, borderColor: color }}>
          Grade {grade}
        </span>
        <p>{GRADE_BLURB[grade] ?? ""}</p>
      </div>

      <style jsx>{`
        .gauge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
        .num {
          font-size: 3.2rem;
          font-weight: 700;
        }
        .denom {
          font-size: 0.9rem;
        }
        .meta {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
        }
        .grade-pill {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 0.25rem 0.7rem;
          border: 1.5px solid;
          border-radius: 999px;
        }
        .meta p {
          margin: 0;
          font-size: 0.85rem;
          color: var(--ink-3);
          max-width: 22ch;
        }
      `}</style>
    </div>
  );
}
