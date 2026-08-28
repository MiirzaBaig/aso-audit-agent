import { z } from "zod";
import { competitorSchema } from "./listing";

/**
 * The ten ASO dimensions. Ids are stable and used as keys everywhere
 * (scoring engine, LLM prompt, UI), so they live in one place.
 */
export const DIMENSION_IDS = [
  "title",
  "subtitle",
  "keywords",
  "description",
  "screenshots",
  "video",
  "reviews",
  "icon",
  "conversion",
  "competitive",
] as const;

export type DimensionId = (typeof DIMENSION_IDS)[number];

export const dimensionIdSchema = z.enum(DIMENSION_IDS);

/**
 * Result of scoring a single dimension. Produced by the deterministic engine —
 * the LLM never sets `score`. `observable` flags dimensions we could only
 * partially measure from public data (e.g. keywords), so the UI can caveat them.
 */
export const dimensionScoreSchema = z.object({
  id: dimensionIdSchema,
  label: z.string(),
  /** 0–10, one decimal. */
  score: z.number().min(0).max(10),
  /** Contribution weight as a percentage of the 100-point total (normalised). */
  weight: z.number().min(0).max(100),
  /** Concrete data points that justify the score. */
  evidence: z.array(z.string()),
  /** False when the dimension is not fully observable from public data. */
  observable: z.boolean(),
});
export type DimensionScore = z.infer<typeof dimensionScoreSchema>;

export const scoreCardSchema = z.object({
  /** Weighted sum of dimensions, 0–100, rounded. */
  overall: z.number().min(0).max(100),
  grade: z.enum(["A", "B", "C", "D", "F"]),
  dimensions: z.array(dimensionScoreSchema),
});
export type ScoreCard = z.infer<typeof scoreCardSchema>;

export const RECOMMENDATION_TIERS = [
  "quick-win",
  "high-impact",
  "strategic",
] as const;
export type RecommendationTier = (typeof RECOMMENDATION_TIERS)[number];

/**
 * A single prioritised recommendation. The LLM produces these; each must cite
 * evidence, and text changes must carry a concrete before/after.
 */
export const recommendationSchema = z.object({
  tier: z.enum(RECOMMENDATION_TIERS),
  dimension: dimensionIdSchema,
  title: z.string(),
  /** Why this matters, referencing the evidence. */
  rationale: z.string(),
  /** The actual data point this is grounded in. */
  evidence: z.string(),
  /** Present only for text changes (title, subtitle, keywords, captions). */
  before: z.string().nullable(),
  after: z.string().nullable(),
});
export type Recommendation = z.infer<typeof recommendationSchema>;

export const competitorComparisonSchema = z.object({
  competitors: z.array(competitorSchema),
  /** One-paragraph narrative of where the app stands vs. the set. */
  narrative: z.string(),
});
export type CompetitorComparison = z.infer<typeof competitorComparisonSchema>;

/**
 * A complaint/praise theme mined from real reviews, carried with the actual
 * reviews it was extracted from. This is the "prove it's not fabricated" data:
 * the UI lets the user open a theme and read the source reviews verbatim.
 */
export const reviewThemeSchema = z.object({
  theme: z.string(),
  sentiment: z.enum(["complaint", "praise"]),
  count: z.number().int().nonnegative(),
  samples: z.array(
    z.object({
      rating: z.number().min(1).max(5),
      title: z.string(),
      body: z.string(),
      author: z.string(),
    }),
  ),
});
export type ReviewTheme = z.infer<typeof reviewThemeSchema>;

/**
 * Where the app actually ranks in App Store search for a given keyword. Turns
 * the *inferred* keyword field into *measured* positions — real evidence of
 * discoverability, not a guess.
 */
export const keywordRankSchema = z.object({
  keyword: z.string(),
  /** 1-based rank within the search results, or null if not found in the top N. */
  rank: z.number().int().positive().nullable(),
  /** How many results were scanned (the ceiling for "not found"). */
  scanned: z.number().int().nonnegative(),
});
export type KeywordRank = z.infer<typeof keywordRankSchema>;

/** The complete audit the UI renders. */
export const auditReportSchema = z.object({
  scoreCard: scoreCardSchema,
  /** One-line executive summary. */
  headline: z.string(),
  recommendations: z.array(recommendationSchema),
  competitorComparison: competitorComparisonSchema,
  /** Themes mined from real reviews, each with the source reviews attached. */
  reviewEvidence: z.array(reviewThemeSchema),
  /** Total recent reviews analysed (for the "based on N real reviews" line). */
  reviewsAnalysed: z.number().int().nonnegative(),
  /** Measured App Store search ranks for a few of the app's key terms. */
  keywordRanks: z.array(keywordRankSchema),
  /** Fields we could not observe and had to infer or skip. Shown as a caveat. */
  limitations: z.array(z.string()),
});
export type AuditReport = z.infer<typeof auditReportSchema>;

/**
 * The narrow slice of the report the LLM is responsible for. Scores and
 * competitor metrics are computed deterministically and merged in afterwards,
 * so the model cannot invent numbers.
 */
export const analystOutputSchema = z.object({
  headline: z.string(),
  recommendations: z.array(recommendationSchema).min(9).max(15),
  competitorNarrative: z.string(),
});
export type AnalystOutput = z.infer<typeof analystOutputSchema>;
