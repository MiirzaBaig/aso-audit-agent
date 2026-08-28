import type { Competitor, AppListing, ScoreCard, DimensionScore } from "@aso/shared";
import { DIMENSION_LABELS, NORMALISED_WEIGHTS } from "./weights.js";
import type { DimensionScorer, ScoringContext } from "./types.js";
import { scoreTitle } from "./dimensions/title.js";
import { scoreSubtitle } from "./dimensions/subtitle.js";
import { scoreKeywords } from "./dimensions/keywords.js";
import { scoreDescription } from "./dimensions/description.js";
import { scoreScreenshots } from "./dimensions/screenshots.js";
import { scoreVideo } from "./dimensions/video.js";
import { scoreReviews } from "./dimensions/reviews.js";
import { scoreIcon } from "./dimensions/icon.js";
import { scoreConversion } from "./dimensions/conversion.js";
import { scoreCompetitive } from "./dimensions/competitive.js";

/** Ordered so the report reads top-to-bottom in the brief's dimension order. */
const SCORERS: DimensionScorer[] = [
  scoreTitle,
  scoreSubtitle,
  scoreKeywords,
  scoreDescription,
  scoreScreenshots,
  scoreVideo,
  scoreReviews,
  scoreIcon,
  scoreConversion,
  scoreCompetitive,
];

/**
 * The deterministic core. Given a listing and its competitors, computes every
 * dimension score and the weighted overall — with zero LLM involvement. This is
 * the guarantee that the audit's numbers are grounded and reproducible; the
 * model only ever explains these results.
 */
export function computeScoreCard(
  listing: AppListing,
  competitors: Competitor[],
): ScoreCard {
  const ctx: ScoringContext = { listing, competitors };

  const dimensions: DimensionScore[] = SCORERS.map((scorer) => {
    const raw = scorer(ctx);
    return {
      id: raw.id,
      label: DIMENSION_LABELS[raw.id],
      score: raw.score,
      weight: round2(NORMALISED_WEIGHTS[raw.id]),
      evidence: raw.evidence,
      observable: raw.observable,
    };
  });

  const overall = Math.round(
    dimensions.reduce((sum, d) => sum + (d.score / 10) * NORMALISED_WEIGHTS[d.id], 0),
  );

  return { overall, grade: toGrade(overall), dimensions };
}

function toGrade(overall: number): ScoreCard["grade"] {
  if (overall >= 85) return "A";
  if (overall >= 70) return "B";
  if (overall >= 55) return "C";
  if (overall >= 40) return "D";
  return "F";
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export { NORMALISED_WEIGHTS, RAW_WEIGHTS, RAW_WEIGHT_TOTAL, DIMENSION_LABELS } from "./weights.js";
