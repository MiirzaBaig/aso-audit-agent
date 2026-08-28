import { clampScore, type DimensionScorer } from "../types.js";

/**
 * Description. Apple doesn't index the description for keywords (iOS), so this
 * dimension is about *conversion*: does the copy above the "more" fold hook the
 * reader, is it benefit-framed, does it carry social proof and a clear CTA?
 *
 * The fold sits at roughly the first ~3 lines / ~250 chars on a phone.
 */
const FOLD_CHARS = 250;

export const scoreDescription: DimensionScorer = ({ listing }) => {
  const desc = listing.description.trim();
  const fold = desc.slice(0, FOLD_CHARS);
  const evidence: string[] = [];
  let score = 0;

  // Has a description at all.
  if (desc.length < 50) {
    evidence.push(`Description is only ${desc.length} characters — far too thin to convert visitors.`);
    return { id: "description", score: 1, evidence, observable: true };
  }

  // Hook above the fold (up to 3 pts): first lines should be punchy, not a wall.
  const firstLine = desc.split(/\n/)[0]?.trim() ?? "";
  if (firstLine.length > 0 && firstLine.length <= 120) {
    score += 3;
    evidence.push(`Opens with a concise hook: "${truncate(firstLine, 80)}".`);
  } else {
    score += 1;
    evidence.push("The first line is long or empty — the copy above the \"more\" cutoff doesn't hook quickly.");
  }

  // Benefit framing (up to 2 pts).
  if (/\b(you|your)\b/i.test(fold)) {
    score += 2;
    evidence.push("Above-fold copy is reader-addressed (\"you/your\"), which frames features as benefits.");
  } else {
    evidence.push("Above-fold copy is feature-first rather than benefit-framed (no direct \"you/your\").");
  }

  // Social proof (up to 2.5 pts).
  if (/\b(\d[\d,.]*\s*(million|k|m|\+)|award|#1|featured|trusted|users|downloads|rated)\b/i.test(desc)) {
    score += 2.5;
    evidence.push("Description includes social proof (user counts, awards, or \"featured\"), which lifts conversion.");
  } else {
    evidence.push("No social proof found (user counts, awards, press) — a proven conversion lever left unused.");
  }

  // Clear CTA (up to 2.5 pts).
  if (/\b(download|try|get started|sign up|start|join|subscribe|install)\b/i.test(desc)) {
    score += 2.5;
    evidence.push("Description contains an explicit call to action.");
  } else {
    evidence.push("No clear call to action in the description.");
  }

  return { id: "description", score: clampScore(score), evidence, observable: true };
};

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);
