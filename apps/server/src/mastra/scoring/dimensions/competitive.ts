import { clampScore, type DimensionScorer } from "../types.js";

/**
 * Competitive position. Scored against the discovered competitor set (a
 * transparent heuristic — see find-competitors). We compare the two most
 * objective, observable levers: rating strength and screenshot-slot coverage
 * versus the competitors' median.
 */
export const scoreCompetitive: DimensionScorer = ({ listing, competitors }) => {
  const evidence: string[] = [];

  if (competitors.length === 0) {
    evidence.push("No competitors could be identified for comparison — scored neutrally.");
    return { id: "competitive", score: 5, evidence, observable: false };
  }

  let score = 0;

  // Rating gap (up to 5 pts).
  const compRatings = competitors.map((c) => c.averageRating).filter((r) => r > 0);
  const medianRating = median(compRatings);
  if (listing.averageRating > 0 && compRatings.length) {
    const delta = listing.averageRating - medianRating;
    score += 2.5 + Math.max(-2.5, Math.min(2.5, delta * 2.5));
    if (delta >= 0.1) {
      evidence.push(`Rating (${listing.averageRating.toFixed(1)}★) beats the competitor median (${medianRating.toFixed(1)}★) — a real trust advantage.`);
    } else if (delta <= -0.1) {
      evidence.push(`Rating (${listing.averageRating.toFixed(1)}★) trails the competitor median (${medianRating.toFixed(1)}★) — closing this gap is high-leverage.`);
    } else {
      evidence.push(`Rating is on par with the competitor median (${medianRating.toFixed(1)}★).`);
    }
  }

  // Screenshot coverage gap (up to 3 pts).
  const compShots = competitors.map((c) => c.screenshotCount);
  const medianShots = median(compShots);
  const shotDelta = listing.screenshotUrls.length - medianShots;
  score += shotDelta >= 0 ? 3 : Math.max(0, 3 + shotDelta);
  evidence.push(
    `Uses ${listing.screenshotUrls.length} screenshots vs. a competitor median of ${medianShots}.`,
  );

  // Video parity (up to 2 pts).
  const compsWithVideo = competitors.filter((c) => c.hasVideo).length;
  if (listing.hasAppPreviewVideo) {
    score += 2;
  } else if (compsWithVideo > 0) {
    evidence.push(`${compsWithVideo} of ${competitors.length} competitors have a preview video and this app doesn't.`);
  } else {
    score += 1;
  }

  return { id: "competitive", score: clampScore(score), evidence, observable: true };
};

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}
