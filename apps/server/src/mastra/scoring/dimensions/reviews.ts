import { clampScore, type DimensionScorer } from "../types.js";

/**
 * Ratings & reviews. We have rich observable data here: the average rating,
 * total volume, the current-version average (a recency/trend proxy), and the
 * text of recent reviews for theme extraction.
 */
export const scoreReviews: DimensionScorer = ({ listing }) => {
  const evidence: string[] = [];
  let score = 0;

  const avg = listing.averageRating;
  const count = listing.ratingCount;

  // Average rating (up to 5 pts) — the dominant lever, scaled from 3.0→5.0.
  const ratingScore = avg <= 0 ? 0 : Math.max(0, Math.min(1, (avg - 3) / 2)) * 5;
  score += ratingScore;
  evidence.push(
    avg > 0
      ? `Average rating is ${avg.toFixed(1)}★ across ${count.toLocaleString()} ratings.`
      : "No ratings yet — a cold-start listing with no social proof.",
  );

  // Volume (up to 2 pts) — credibility grows with count, log-scaled.
  if (count > 0) {
    const volumeScore = Math.min(1, Math.log10(count + 1) / 5) * 2;
    score += volumeScore;
    if (count < 50) evidence.push(`Only ${count} ratings — too few to build trust; prompt happy users to rate.`);
  }

  // Recency / trend (up to 1.5 pts): compare current-version avg to lifetime.
  const cur = listing.currentVersionAverageRating;
  if (cur != null && avg > 0) {
    const delta = cur - avg;
    if (delta >= 0.1) {
      score += 1.5;
      evidence.push(`Current version (${cur.toFixed(1)}★) is trending above the lifetime average (${avg.toFixed(1)}★) — momentum is positive.`);
    } else if (delta <= -0.2) {
      evidence.push(`Current version (${cur.toFixed(1)}★) is below the lifetime average (${avg.toFixed(1)}★) — a recent regression is dragging sentiment.`);
    } else {
      score += 1;
      evidence.push("Current-version rating is holding steady versus the lifetime average.");
    }
  }

  // Theme signal from recent reviews (up to 1.5 pts): presence of analysable text.
  const themes = extractComplaintThemes(listing.reviews);
  if (listing.reviews.length > 0) {
    score += 1.5;
    if (themes.length) {
      evidence.push(`Recurring complaint themes in recent reviews: ${themes.join(", ")}.`);
    } else {
      evidence.push(`${listing.reviews.length} recent reviews analysed; no single dominant complaint theme.`);
    }
  } else {
    evidence.push("No recent review text available to mine for themes.");
  }

  evidence.push("Developer responses to negative reviews are not exposed in the public RSS feed — verify response coverage manually.");

  return { id: "reviews", score: clampScore(score), evidence, observable: false };
};

const COMPLAINT_KEYWORDS: Record<string, RegExp> = {
  crashes: /\b(crash|crashes|crashing|freeze|frozen|bug|glitch)\b/i,
  "subscription/pricing": /\b(subscription|expensive|paywall|price|charge|refund|scam)\b/i,
  "ads": /\b(ads?|advert|advertising)\b/i,
  "login/account": /\b(log ?in|sign ?in|account|password|verify)\b/i,
  performance: /\b(slow|lag|laggy|loading|battery)\b/i,
};

function extractComplaintThemes(reviews: { rating: number; body: string; title: string }[]): string[] {
  const negatives = reviews.filter((r) => r.rating <= 3);
  const counts = new Map<string, number>();
  for (const r of negatives) {
    const text = `${r.title} ${r.body}`;
    for (const [theme, re] of Object.entries(COMPLAINT_KEYWORDS)) {
      if (re.test(text)) counts.set(theme, (counts.get(theme) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([theme]) => theme);
}
