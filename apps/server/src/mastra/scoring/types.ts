import type { AppListing, Competitor, DimensionId } from "@aso/shared";

/** Everything a dimension scorer is allowed to see. */
export interface ScoringContext {
  listing: AppListing;
  competitors: Competitor[];
}

/** The raw output of a single dimension scorer (before weight is attached). */
export interface RawDimensionResult {
  id: DimensionId;
  /** 0–10. */
  score: number;
  /** Concrete, data-backed justifications. */
  evidence: string[];
  /** False when the dimension can't be fully measured from public data. */
  observable: boolean;
}

export type DimensionScorer = (ctx: ScoringContext) => RawDimensionResult;

/** Clamp + round to one decimal — every scorer funnels through this. */
export const clampScore = (n: number): number =>
  Math.round(Math.max(0, Math.min(10, n)) * 10) / 10;
