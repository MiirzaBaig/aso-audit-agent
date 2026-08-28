import type { RecommendationTier } from "@aso/shared";

/** Maps a 0–10 or 0–100 value to a semantic band token. */
export function band(value: number, max: 10 | 100 = 10): "good" | "fair" | "poor" {
  const pct = value / max;
  if (pct >= 0.75) return "good";
  if (pct >= 0.5) return "fair";
  return "poor";
}

export function bandColor(value: number, max: 10 | 100 = 10): string {
  return `var(--${band(value, max)})`;
}

export function bandWash(value: number, max: 10 | 100 = 10): string {
  return `var(--${band(value, max)}-wash)`;
}

export const TIER_META: Record<
  RecommendationTier,
  { label: string; blurb: string; mark: string }
> = {
  "quick-win": {
    label: "Quick wins",
    blurb: "Ship today",
    mark: "01",
  },
  "high-impact": {
    label: "High impact",
    blurb: "More effort, large payoff",
    mark: "02",
  },
  strategic: {
    label: "Strategic",
    blurb: "Longer-term positioning",
    mark: "03",
  },
};

/**
 * The single dimension where fixing it moves the overall score most:
 * highest (weight × points-missing). Returns its id, or null.
 */
export function biggestLever(
  dims: { id: string; score: number; weight: number }[],
): string | null {
  let best: { id: string; gain: number } | null = null;
  for (const d of dims) {
    const gain = d.weight * (10 - d.score);
    if (!best || gain > best.gain) best = { id: d.id, gain };
  }
  return best && best.gain > 0 ? best.id : null;
}

export const GRADE_BLURB: Record<string, string> = {
  A: "Excellent — a well-optimized listing",
  B: "Solid — a few high-value levers remain",
  C: "Middling — clear room to grow",
  D: "Underperforming — several gaps",
  F: "Critical — the fundamentals need work",
};
