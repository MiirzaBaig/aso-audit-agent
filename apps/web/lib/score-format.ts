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

export function bandSoft(value: number, max: 10 | 100 = 10): string {
  return `var(--${band(value, max)}-soft)`;
}

export const TIER_META: Record<
  RecommendationTier,
  { label: string; blurb: string; symbol: string }
> = {
  "quick-win": {
    label: "Quick Wins",
    blurb: "Ship today · high impact",
    symbol: "⚡",
  },
  "high-impact": {
    label: "High-Impact Changes",
    blurb: "More effort · large payoff",
    symbol: "◆",
  },
  strategic: {
    label: "Strategic",
    blurb: "Longer-term positioning",
    symbol: "◇",
  },
};

export const GRADE_BLURB: Record<string, string> = {
  A: "Excellent — a well-optimized listing",
  B: "Solid — a few high-value levers remain",
  C: "Middling — clear room to grow",
  D: "Underperforming — several gaps",
  F: "Critical — the fundamentals need work",
};
