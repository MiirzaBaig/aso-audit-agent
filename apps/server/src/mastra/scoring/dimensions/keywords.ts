import { clampScore, type DimensionScorer } from "../types.js";

/**
 * Keyword field (100-char iOS limit). This field is PRIVATE — Apple never
 * exposes it. We score the *inferred* reconstruction, so this dimension is
 * explicitly `observable: false` and the report frames every finding as
 * directional. We still apply the same best-practice checks a practitioner
 * would (no duplication with title/subtitle, no wasted words, full utilisation)
 * because they hold regardless of the exact string.
 */
const WASTED_WORDS = new Set(["app", "apps", "free", "best", "top", "the", "and"]);

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

  // Utilisation of the 100-char budget (up to 3 pts).
  const utilisation = Math.min(1, field.length / 100);
  score += utilisation * 3;
  evidence.push(`Inferred keyword coverage packs ~${field.length}/100 characters across ${keywords.length} terms.`);

  // No duplication with title/subtitle (up to 2.5 pts).
  const titleSubWords = new Set(
    tokenize(`${listing.title} ${listing.subtitle.value ?? ""}`),
  );
  const dupes = keywords.filter((k) => titleSubWords.has(k.toLowerCase()));
  score += (1 - Math.min(1, dupes.length / Math.max(1, keywords.length))) * 2.5;
  if (dupes.length) {
    evidence.push(`${dupes.length} inferred keyword(s) duplicate the title/subtitle (${dupes.slice(0, 4).join(", ")}). Apple already indexes those — the field should hold *net-new* terms.`);
  } else {
    evidence.push("No inferred duplicate terms with the title/subtitle — efficient separation of indexed fields.");
  }

  // No internal duplicates or spacing waste (up to 1.5 pts).
  const exact = keywords.map((k) => k.toLowerCase());
  const duplicateCount = exact.length - new Set(exact).size;
  const hasCommaSpaces = /,\s+/.test(field);
  const hygienePenalty = duplicateCount + (hasCommaSpaces ? 1 : 0);
  score += (1 - Math.min(1, hygienePenalty / Math.max(1, keywords.length))) * 1.5;
  if (duplicateCount || hasCommaSpaces) {
    evidence.push(
      `${duplicateCount ? `${duplicateCount} internal duplicate keyword(s)` : "No internal duplicates"}, ${hasCommaSpaces ? "but spaces after commas waste characters" : "and no spaces after commas"}.`,
    );
  } else {
    evidence.push("Comma packing is clean: no internal duplicates and no spaces after commas.");
  }

  // No wasted words/category terms (up to 2 pts).
  const categoryWords = new Set(tokenize([listing.primaryCategory, ...listing.genres].join(" ")));
  const wasted = keywords.filter((k) => {
    const lower = k.toLowerCase();
    return WASTED_WORDS.has(lower) || categoryWords.has(lower);
  });
  score += (1 - Math.min(1, wasted.length / Math.max(1, keywords.length))) * 2;
  if (wasted.length) {
    evidence.push(`Wasted words detected (${wasted.join(", ")}): generic words and category names burn the 100-char budget.`);
  } else {
    evidence.push("No obvious wasted generic/category words detected in the inferred field.");
  }

  // Avoid plural/singular pairs where one form usually covers both (up to 1 pt).
  const pluralPairs = findPluralPairs(exact);
  score += pluralPairs.length ? 0 : 1;
  if (pluralPairs.length) {
    evidence.push(`Potential singular/plural waste: ${pluralPairs.slice(0, 3).join(", ")}.`);
  } else {
    evidence.push("No obvious singular/plural duplicate pairs detected.");
  }

  return { id: "keywords", score: clampScore(score), evidence, observable: false };
};

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 2);
}

function findPluralPairs(words: string[]): string[] {
  const set = new Set(words);
  const pairs: string[] = [];
  for (const word of set) {
    if (word.endsWith("s") && word.length > 4) {
      const singular = word.slice(0, -1);
      if (set.has(singular)) pairs.push(`${singular}/${word}`);
    }
  }
  return pairs;
}
