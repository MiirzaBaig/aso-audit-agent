import { clampScore, type DimensionScorer } from "../types.js";

const MAX_SLOTS = 10;

/**
 * Screenshots. Apple allows up to 10 and OCR-indexes on-image text. We score
 * slot utilisation deterministically, and when screenshot OCR succeeded we also
 * assess the on-image copy — which makes the dimension fully observable instead
 * of deferring the text check to a human.
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
  if (count >= 3) score += 1.5;

  // On-image text via OCR (up to +2, and makes the dimension observable).
  const ocr = listing.screenshotText.value;
  if (ocr && ocr.length) {
    const wordCount = ocr.length;
    const sample = ocr.slice(0, 8).join(", ");
    if (wordCount >= 4) {
      score = Math.min(10, score + 1);
      evidence.push(`OCR read on-image text across the first screenshots (Apple indexes this): "${sample}"…`);
    } else {
      evidence.push(`OCR found little on-image text ("${sample}") — captions are a missed keyword and value-prop surface.`);
      score = Math.max(0, score - 0.5);
    }
    return { id: "screenshots", score: clampScore(score), evidence, observable: true };
  }

  // OCR unavailable — fall back to slot-count only, flagged partial.
  evidence.push("On-image text quality and design cohesion require visual review — OCR was unavailable.");
  return { id: "screenshots", score: clampScore(score), evidence, observable: false };
};
