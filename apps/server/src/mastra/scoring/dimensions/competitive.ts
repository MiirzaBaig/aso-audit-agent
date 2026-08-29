import { clampScore, type DimensionScorer } from "../types.js";

/**
 * Competitive position. Scored against the discovered competitor set (a
 * transparent heuristic — see find-competitors). We compare objective levers:
 * rating strength, screenshot-slot coverage, preview video parity and public
 * title/keyword coverage versus the discovered competitors.
 */
export const scoreCompetitive: DimensionScorer = ({ listing, competitors }) => {
  const evidence: string[] = [];

  if (competitors.length === 0) {
    evidence.push("No competitors could be identified for comparison — scored neutrally.");
    return { id: "competitive", score: 5, evidence, observable: false };
  }

  let score = 0;

  // Rating gap (up to 3 pts).
  const compRatings = competitors.map((c) => c.averageRating).filter((r) => r > 0);
  const medianRating = median(compRatings);
  if (listing.averageRating > 0 && compRatings.length) {
    const delta = listing.averageRating - medianRating;
    score += 1.5 + Math.max(-1.5, Math.min(1.5, delta * 1.5));
    if (delta >= 0.1) {
      evidence.push(`Rating (${listing.averageRating.toFixed(1)}★) beats the competitor median (${medianRating.toFixed(1)}★) — a real trust advantage.`);
    } else if (delta <= -0.1) {
      evidence.push(`Rating (${listing.averageRating.toFixed(1)}★) trails the competitor median (${medianRating.toFixed(1)}★) — closing this gap is high-leverage.`);
    } else {
      evidence.push(`Rating is on par with the competitor median (${medianRating.toFixed(1)}★).`);
    }
  }

  // Screenshot coverage gap (up to 2 pts).
  const compShots = competitors.map((c) => c.screenshotCount);
  const medianShots = median(compShots);
  const shotDelta = listing.screenshotUrls.length - medianShots;
  score += shotDelta >= 0 ? 2 : Math.max(0, 2 + shotDelta * 0.5);
  evidence.push(
    `Uses ${listing.screenshotUrls.length} screenshots vs. a competitor median of ${medianShots}.`,
  );

  // Video parity (up to 2 pts).
  const compsWithVideo = competitors.filter((c) => c.hasVideo).length;
  if (listing.hasAppPreviewVideo) {
    score += 2;
    evidence.push("This app has preview-video parity or better because a video is present.");
  } else if (compsWithVideo > 0) {
    evidence.push(`${compsWithVideo} of ${competitors.length} competitors have a preview video and this app doesn't.`);
  } else {
    score += 1;
    evidence.push("No preview-video disadvantage detected; none of the discovered competitors exposed a video signal.");
  }

  // Public keyword coverage proxy (up to 3 pts): compare meaningful terms in
  // the listing's indexed text with words competitors expose in their titles.
  const ownTerms = new Set(
    tokenize(`${listing.title} ${listing.subtitle.value ?? ""} ${listing.keywordField.value ?? ""}`),
  );
  const competitorTerms = new Set(competitors.flatMap((c) => tokenize(c.title)));
  const overlap = [...ownTerms].filter((term) => competitorTerms.has(term));
  const coverage = competitorTerms.size ? overlap.length / competitorTerms.size : 0;
  score += Math.min(1, coverage) * 3;
  evidence.push(
    `Public keyword overlap with competitor titles is ${overlap.length}/${competitorTerms.size || 1} meaningful terms${overlap.length ? ` (${overlap.slice(0, 5).join(", ")})` : ""}.`,
  );
  evidence.push("Competitor visual style and true keyword-field coverage require manual review because Apple does not expose them.");

  return { id: "competitive", score: clampScore(score), evidence, observable: false };
};

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 3 && !STOP.has(w));
}

const STOP = new Set([
  "with",
  "your",
  "from",
  "that",
  "this",
  "app",
  "apps",
  "free",
  "best",
  "game",
  "games",
]);
