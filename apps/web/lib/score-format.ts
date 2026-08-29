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

/**
 * A tiny inline SVG path per dimension — a visual anchor for the action-plan
 * left rail. All drawn on a 24×24 grid, stroked (currentColor).
 */
export const DIMENSION_ICON: Record<string, string> = {
  title: "M4 7h16M4 12h10M4 17h7",
  subtitle: "M4 8h16M4 13h9",
  keywords: "M7 8l-3 4 3 4M17 8l3 4-3 4M14 6l-4 12",
  description: "M5 5h14v14H5zM8 9h8M8 12h8M8 15h5",
  screenshots: "M4 6h6v12H4zM14 6h6v12h-6",
  video: "M5 5h14v14H5zM10 9l5 3-5 3z",
  reviews: "M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.3-4.8-2.5-4.8 2.5.9-5.3L4.2 9.7l5.4-.8z",
  icon: "M5 5h14v14H5zM9 10a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0M5 16l4-4 3 3 3-3 4 4",
  conversion: "M4 18l5-5 4 3 7-8M14 8h5v5",
  competitive: "M6 20V10M12 20V4M18 20v-7",
};

/** Effort read straight off the tier — quick wins are low-effort by definition. */
export function effortFor(tier: RecommendationTier): { label: string; dots: number } {
  if (tier === "quick-win") return { label: "low effort", dots: 1 };
  if (tier === "high-impact") return { label: "medium effort", dots: 2 };
  return { label: "high effort", dots: 3 };
}

export const GRADE_BLURB: Record<string, string> = {
  A: "Excellent — a well-optimized listing",
  B: "Solid — a few high-value levers remain",
  C: "Middling — clear room to grow",
  D: "Underperforming — several gaps",
  F: "Critical — the fundamentals need work",
};
