import { clampScore, type DimensionScorer } from "../types.js";

const MAX_SLOTS = 10;

/**
 * Screenshots. Apple allows up to 10 and OCR-indexes on-image text. We can
 * observe *how many* slots are filled (a strong signal on its own) but not the
 * design quality of the images from the API — so we score slot utilisation
 * deterministically and leave the visual-quality judgment to the analyst,
 * flagging the dimension as only partially observable.
 */
export const scoreScreenshots: DimensionScorer = ({ listing }) => {
  const count = listing.screenshotUrls.length;
  const evidence: string[] = [];
  let score = 0;

  // Slot utilisation (up to 7 pts) — the strongest observable lever.
  const utilisation = Math.min(1, count / MAX_SLOTS);
  score += utilisation * 7;
  evidence.push(`${count}/${MAX_SLOTS} screenshot slots used.`);

  if (count === 0) {
    evidence.push("No screenshots at all — this alone tanks conversion; the listing is effectively invisible on the search card.");
    return { id: "screenshots", score: 0, evidence, observable: true };
  }
  if (count < 3) {
    evidence.push("Fewer than 3 screenshots means the search-results preview (which shows the first 1–3) can't communicate value.");
  }
  if (count >= 8) {
    score += 1.5;
    evidence.push("Strong slot coverage — good for storytelling deeper in the gallery.");
  }

  // Baseline credit for having the first-impression slots filled.
  if (count >= 3) score += 1.5;

  evidence.push("On-image text quality and design cohesion require visual review — flagged for the analyst.");

  return { id: "screenshots", score: clampScore(score), evidence, observable: false };
};
