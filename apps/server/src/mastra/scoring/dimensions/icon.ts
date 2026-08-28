import { clampScore, type DimensionScorer } from "../types.js";

/**
 * Icon. Distinctiveness and small-size legibility are visual judgments the
 * analyst makes from the rendered icon. Deterministically we can only confirm
 * the icon exists at a high resolution (a hygiene check), so this dimension is
 * observable: false and scored with a neutral baseline the analyst refines.
 */
export const scoreIcon: DimensionScorer = ({ listing }) => {
  const evidence: string[] = [];
  const hasHiRes = /512x512|1024/.test(listing.iconUrl) || listing.iconUrl.includes("artwork");

  const score = hasHiRes ? 6 : 5;
  evidence.push(
    hasHiRes
      ? "A high-resolution icon is present. Distinctiveness in search results and legibility at small sizes need visual review — deferred to the analyst."
      : "Icon present but not confirmed at high resolution.",
  );
  evidence.push("Category-appropriateness and whether the icon avoids unreadable text are visual checks for the analyst.");

  return { id: "icon", score: clampScore(score), evidence, observable: false };
};
