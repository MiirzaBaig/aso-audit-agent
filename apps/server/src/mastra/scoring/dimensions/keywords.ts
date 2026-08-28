import { clampScore, type DimensionScorer } from "../types.js";

/**
 * Keyword field (100-char iOS limit). This field is PRIVATE — Apple never
 * exposes it. We score the *inferred* reconstruction, so this dimension is
 * explicitly `observable: false` and the report frames every finding as
 * directional. We still apply the same best-practice checks a practitioner
 * would (no duplication with title/subtitle, no wasted words, full utilisation)
 * because they hold regardless of the exact string.
 */
const WASTED_WORDS = new Set(["app", "free", "best", "top", "the", "and"]);

export const scoreKeywords: DimensionScorer = ({ listing }) => {
  const field = listing.keywordField.value ?? "";
  const evidence: string[] = [
    "The iOS keyword field is private; the following is based on an inferred reconstruction from the title, subtitle and description.",
  ];

  if (!field) {
    evidence.push("Could not infer any keyword signal — the listing's public text is very sparse.");
    return { id: "keywords", score: 3, evidence, observable: false };
  }

  const keywords = field.split(",").map((k) => k.trim()).filter(Boolean);
  let score = 0;

  // Utilisation of the 100-char budget (up to 4 pts).
  const utilisation = Math.min(1, field.length / 100);
  score += utilisation * 4;
  evidence.push(`Inferred keyword coverage packs ~${field.length}/100 characters across ${keywords.length} terms.`);

  // No duplication with title/subtitle (up to 3 pts).
  const titleSubWords = new Set(
    tokenize(`${listing.title} ${listing.subtitle.value ?? ""}`),
  );
  const dupes = keywords.filter((k) => titleSubWords.has(k.toLowerCase()));
  score += (1 - Math.min(1, dupes.length / Math.max(1, keywords.length))) * 3;
  if (dupes.length) {
    evidence.push(`${dupes.length} inferred keyword(s) duplicate the title/subtitle (${dupes.slice(0, 4).join(", ")}). Apple already indexes those — the field should hold *net-new* terms.`);
  }

  // No wasted words (up to 3 pts).
  const wasted = keywords.filter((k) => WASTED_WORDS.has(k.toLowerCase()));
  score += (1 - Math.min(1, wasted.length / Math.max(1, keywords.length))) * 3;
  if (wasted.length) {
    evidence.push(`Wasted words detected (${wasted.join(", ")}): "app", "free" and category names never help ranking and burn the 100-char budget.`);
  }

  return { id: "keywords", score: clampScore(score), evidence, observable: false };
};

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 2);
}
