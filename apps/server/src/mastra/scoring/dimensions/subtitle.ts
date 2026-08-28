import { clampScore, type DimensionScorer } from "../types.js";

const SUBTITLE_LIMIT = 30;

/**
 * Subtitle (30-char limit). Its whole job is to add *distinct* secondary
 * keywords and a benefit — repeating the title wastes indexed space.
 *
 * When the subtitle isn't recoverable from public data we say so and score
 * conservatively rather than inventing a value (observable: false).
 */
export const scoreSubtitle: DimensionScorer = ({ listing }) => {
  const subtitle = listing.subtitle.value?.trim() ?? null;
  const evidence: string[] = [];

  if (!subtitle) {
    evidence.push("No subtitle could be observed from public data. If the listing has none, this is a major missed opportunity: the subtitle is a free 30-char keyword slot.");
    return { id: "subtitle", score: 2, evidence, observable: false };
  }

  const len = subtitle.length;
  let score = 0;

  // Utilisation (up to 4 pts).
  const utilisation = Math.min(1, len / SUBTITLE_LIMIT);
  score += utilisation * 4;
  evidence.push(`Subtitle "${subtitle}" uses ${len}/${SUBTITLE_LIMIT} characters.`);

  // Distinct from title (up to 4 pts): penalise word overlap with the title.
  const titleWords = new Set(tokenize(listing.title));
  const subWords = tokenize(subtitle);
  const overlap = subWords.filter((w) => titleWords.has(w));
  const overlapRatio = subWords.length ? overlap.length / subWords.length : 1;
  score += (1 - overlapRatio) * 4;
  if (overlap.length) {
    evidence.push(`Subtitle repeats ${overlap.length} word(s) already in the title (${overlap.join(", ")}) — Apple indexes these once, so the repetition is wasted.`);
  } else {
    evidence.push("Subtitle introduces entirely new keywords versus the title — efficient use of indexed space.");
  }

  // Benefit-driven language (up to 2 pts).
  if (/\b(free|fast|easy|track|save|learn|create|manage|discover|plan|edit|share|find)\b/i.test(subtitle)) {
    score += 2;
    evidence.push("Subtitle uses benefit/action language, which aids conversion as well as ranking.");
  } else {
    score += 0.5;
  }

  return { id: "subtitle", score: clampScore(score), evidence, observable: true };
};

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 2);
}
