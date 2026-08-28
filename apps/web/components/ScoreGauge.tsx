"use client";

import { useEffect, useRef, useState } from "react";
import { bandColor, GRADE_BLURB } from "@/lib/score-format";

interface Props {
  overall: number;
  grade: string;
}

/**
 * The report's headline instrument: a radial gauge whose arc animates in and
 * whose number counts up once on mount. Arc color is semantic (good/fair/poor),
 * deliberately distinct from the cobalt accent.
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
    const dur = 1150;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * overall));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [overall]);

  const R = 82;
  const C = 2 * Math.PI * R;
  const pct = n / 100;
  const color = bandColor(overall, 100);
  const grades = ["A", "B", "C", "D", "F"] as const;

  return (
    <div className="gauge">
      <svg viewBox="0 0 200 200" width="184" height="184" role="img" aria-label={`Overall ASO score ${overall} out of 100`}>
        <circle cx="100" cy="100" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          transform="rotate(-90 100 100)"
          style={{ transition: "stroke-dashoffset 0.05s linear" }}
        />
        <text x="100" y="98" textAnchor="middle" className="num mono">{n}</text>
        <text x="100" y="122" textAnchor="middle" className="denom mono">out of 100</text>
      </svg>

      <div className="grades" role="presentation">
        {grades.map((g) => (
          <span key={g} className={`g ${g === grade ? "on" : ""}`} style={g === grade ? { color, borderColor: color } : undefined}>
            {g}
          </span>
        ))}
      </div>
      <p className="blurb">{GRADE_BLURB[grade] ?? ""}</p>

      <style jsx>{`
        .gauge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.85rem;
        }
        .num {
          font-size: 3.1rem;
          font-weight: 600;
          fill: var(--ink);
          letter-spacing: -0.03em;
        }
        .denom {
          font-size: 0.72rem;
          fill: var(--ink-4);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .grades {
          display: flex;
          gap: 0.3rem;
        }
        .g {
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
          border-radius: 7px;
          border: 1px solid var(--line);
          font-family: var(--font-mono);
          font-size: 0.78rem;
          font-weight: 500;
          color: var(--ink-4);
          background: var(--surface);
          transition: transform 0.2s var(--ease);
        }
        .g.on {
          font-weight: 700;
          transform: scale(1.12);
          background: var(--surface);
        }
        .blurb {
          margin: 0;
          font-size: 0.82rem;
          color: var(--ink-3);
          max-width: 24ch;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
