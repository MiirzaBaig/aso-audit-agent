import { clampScore, type DimensionScorer } from "../types.js";

const TITLE_LIMIT = 30;

/**
 * Title (30-char limit). Apple weights the title most heavily for keyword
 * ranking, so utilisation and keyword presence dominate the score.
 *
 * Checks: character utilisation, whether the title carries a keyword beyond the
 * brand, brand-vs-keyword balance, and stuffing (too many separators).
 */
export const scoreTitle: DimensionScorer = ({ listing }) => {
  const title = listing.title.trim();
  const len = title.length;
  const evidence: string[] = [];
  let score = 0;

  // Utilisation (up to 4 pts): reward using the scarce 30 chars.
  const utilisation = Math.min(1, len / TITLE_LIMIT);
  score += utilisation * 4;
  evidence.push(`Title "${title}" uses ${len}/${TITLE_LIMIT} characters (${Math.round(utilisation * 100)}% of the limit).`);

  // Keyword beyond brand (up to 4 pts): a separator (— - : |) usually means the
  // developer added a descriptive keyword phrase after the brand.
  const hasDescriptor = /[-–—:|]/.test(title) || title.split(/\s+/).length >= 3;
  if (hasDescriptor) {
    score += 4;
    evidence.push("Title pairs the brand with a descriptive keyword phrase — good for discovery beyond brand searches.");
  } else {
    evidence.push("Title appears to be brand-only, leaving keyword ranking value on the table.");
  }

  // Natural reading, not stuffed (up to 2 pts): penalise 3+ separators.
  const separators = (title.match(/[-–—:|,&]/g) ?? []).length;
  if (separators <= 2) {
    score += 2;
  } else {
    score += 0.5;
    evidence.push(`Title uses ${separators} separators, which reads as keyword-stuffed rather than natural.`);
  }

  if (len < 15) {
    evidence.push(`Only ${len} characters used — there is room to add a high-value keyword.`);
  }

  return { id: "title", score: clampScore(score), evidence, observable: true };
};
