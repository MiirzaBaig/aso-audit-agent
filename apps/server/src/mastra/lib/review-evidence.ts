import type { AppListing, ReviewTheme } from "@aso/shared";

/**
 * Mines themes from the app's REAL recent reviews and attaches the source
 * reviews to each theme. This is the audit's proof-of-authenticity: the UI can
 * open any theme and show the verbatim reviews it came from, so scores tied to
 * "recurring complaints" are demonstrably grounded, not invented.
 */

const COMPLAINT_PATTERNS: Record<string, RegExp> = {
  crashes: /\b(crash|crashes|crashing|freeze|frozen|bug|glitch|broken)\b/i,
  "subscription & pricing": /\b(subscription|expensive|paywall|price|pricing|charge|charged|refund|scam|overpriced)\b/i,
  ads: /\b(ads?|advert|advertising|commercials?)\b/i,
  "login & accounts": /\b(log ?in|sign ?in|account|password|verify|locked out)\b/i,
  performance: /\b(slow|lag|laggy|loading|battery|drain)\b/i,
};

const PRAISE_PATTERNS: Record<string, RegExp> = {
  "easy to use": /\b(easy|intuitive|simple|user[- ]friendly|clean)\b/i,
  "great content": /\b(love|amazing|great|awesome|fantastic|excellent|best)\b/i,
  effective: /\b(helpful|works|effective|useful|life[- ]saver|game changer)\b/i,
};

export function buildReviewEvidence(listing: AppListing): ReviewTheme[] {
  const reviews = listing.reviews;
  if (!reviews.length) return [];

  const negatives = reviews.filter((r) => r.rating <= 3);
  const positives = reviews.filter((r) => r.rating >= 4);

  const themes: ReviewTheme[] = [];

  const collect = (
    pool: typeof reviews,
    patterns: Record<string, RegExp>,
    sentiment: "complaint" | "praise",
  ) => {
    for (const [theme, re] of Object.entries(patterns)) {
      const matches = pool.filter((r) => re.test(`${r.title} ${r.body}`));
      if (matches.length < 2) continue;
      themes.push({
        theme,
        sentiment,
        count: matches.length,
        samples: matches.slice(0, 4).map((r) => ({
          rating: r.rating,
          title: tidy(r.title, 100),
          body: tidy(r.body, 300),
          author: tidy(r.author, 40),
        })),
      });
    }
  };

  collect(negatives, COMPLAINT_PATTERNS, "complaint");
  collect(positives, PRAISE_PATTERNS, "praise");

  function tidy(s: string, max: number): string {
    const clean = s.replace(/\s+/g, " ").trim();
    return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
  }

  // (collapse control chars + runaway whitespace that RSS review bodies carry)
  // Most-cited first; complaints before praise at equal counts (more actionable).
  return themes.sort(
    (a, b) =>
      b.count - a.count ||
      (a.sentiment === "complaint" ? -1 : 1) - (b.sentiment === "complaint" ? -1 : 1),
  );
}
