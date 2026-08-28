import type { DimensionId } from "@aso/shared";

/**
 * The raw weights as published in the take-home brief.
 *
 * NOTE — the brief's weights sum to 110%, not 100%:
 *   20+15+15+10+15+5+15+5+5+5 = 110
 * (Another candidate flagged this in the gist comments, and it checks out.)
 *
 * Rather than silently pick a subset, we keep the brief's *relative* emphasis
 * exactly as given and normalise the total to 100 so the final score is a
 * genuine "out of 100". The normalisation is transparent: every raw weight is
 * scaled by 100/110. This is documented in the README decision log.
 */
export const RAW_WEIGHTS: Record<DimensionId, number> = {
  title: 20,
  subtitle: 15,
  keywords: 15,
  description: 10,
  screenshots: 15,
  video: 5,
  reviews: 15,
  icon: 5,
  conversion: 5,
  competitive: 5,
};

export const RAW_WEIGHT_TOTAL = Object.values(RAW_WEIGHTS).reduce((a, b) => a + b, 0); // 110

/** Weights normalised to sum to exactly 100. */
export const NORMALISED_WEIGHTS: Record<DimensionId, number> = Object.fromEntries(
  (Object.entries(RAW_WEIGHTS) as [DimensionId, number][]).map(([id, w]) => [
    id,
    (w / RAW_WEIGHT_TOTAL) * 100,
  ]),
) as Record<DimensionId, number>;

export const DIMENSION_LABELS: Record<DimensionId, string> = {
  title: "Title",
  subtitle: "Subtitle",
  keywords: "Keyword Field",
  description: "Description",
  screenshots: "Screenshots",
  video: "App Preview Video",
  reviews: "Ratings & Reviews",
  icon: "Icon",
  conversion: "Conversion Signals",
  competitive: "Competitive Position",
};
