import { clampScore, type DimensionScorer } from "../types.js";

/**
 * Conversion signals: promotional text, an informative "What's New", and
 * (not observable from the API) In-App Events / custom product pages. We score
 * what we can see and note the rest as unobservable.
 */
export const scoreConversion: DimensionScorer = ({ listing }) => {
  const evidence: string[] = [];
  let score = 0;

  // Promotional text (up to 3 pts) — an updatable, high-visibility slot.
  if (listing.promotionalText.value) {
    score += 3;
    evidence.push("Promotional text is in use — the one listing field editable without a new build.");
  } else {
    evidence.push("No promotional text detected. This 170-char slot updates without review and is ideal for events/announcements — a free conversion lever.");
  }

  // "What's New" quality (up to 4 pts).
  const notes = listing.releaseNotes?.trim() ?? "";
  if (notes.length === 0) {
    evidence.push("\"What's New\" is empty — signals a stale or neglected listing.");
  } else if (/bug fix(es)?|minor|improvements?|stability/i.test(notes) && notes.length < 60) {
    score += 1.5;
    evidence.push(`"What's New" is generic ("${truncate(notes, 50)}") — a missed chance to highlight real value.`);
  } else {
    score += 4;
    evidence.push(`"What's New" is substantive (${notes.length} chars), signalling active maintenance.`);
  }

  // Freshness proxy via version presence (up to 1 pt).
  if (listing.version) score += 1;

  evidence.push("In-App Events and custom product pages aren't exposed in public metadata — recommend verifying manually.");

  return { id: "conversion", score: clampScore(score), evidence, observable: false };
};

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);
