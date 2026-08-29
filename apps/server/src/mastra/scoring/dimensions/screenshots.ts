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

  // Slot utilisation (up to 5 pts) — every missing slot is lost storytelling.
  const utilisation = Math.min(1, count / MAX_SLOTS);
  score += utilisation * 5;
  evidence.push(`${count}/${MAX_SLOTS} screenshot slots used.`);

  if (count === 0) {
    evidence.push("No screenshots at all — this alone tanks conversion; the listing is effectively invisible on the search card.");
    return { id: "screenshots", score: 0, evidence, observable: true };
  }
  if (count < 3) {
    evidence.push("Fewer than 3 screenshots means the search-results preview (which shows the first 1–3) can't communicate value.");
  } else {
    score += 2;
    evidence.push("At least 3 screenshots are present, so the search-results preview has enough slots to communicate the core value.");
  }
  if (count >= 8) {
    score += 1;
    evidence.push("Strong slot coverage — good for storytelling deeper in the gallery.");
  }

  // On-image text via OCR (up to +2). Design cohesion still needs a human eye.
  const ocr = listing.screenshotText.value;
  if (ocr && ocr.length) {
    const wordCount = ocr.length;
    const sample = ocr.slice(0, 8).join(", ");
    if (wordCount >= 10) {
      score = Math.min(10, score + 2);
      evidence.push(`OCR read on-image text across the first screenshots (Apple indexes this): "${sample}"…`);
    } else if (wordCount >= 4) {
      score = Math.min(10, score + 1);
      evidence.push(`OCR found some on-image text across the first screenshots: "${sample}"… Add stronger keyword-rich captions.`);
    } else {
      evidence.push(`OCR found little on-image text ("${sample}") — captions are a missed keyword and value-prop surface.`);
      score = Math.max(0, score - 0.5);
    }
    evidence.push("Visual hierarchy and design cohesion still require manual review from the screenshot gallery.");
    return { id: "screenshots", score: clampScore(score), evidence, observable: false };
  }

  // OCR unavailable — fall back to slot-count only, flagged partial.
  evidence.push("On-image text quality, first-screen value communication and design cohesion require visual review — OCR was unavailable.");
  return { id: "screenshots", score: clampScore(score), evidence, observable: false };
};
