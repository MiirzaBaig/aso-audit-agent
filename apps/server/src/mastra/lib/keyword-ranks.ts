import type { AppListing, KeywordRank } from "@aso/shared";
import { searchApps } from "./itunes.js";

/**
 * Measures where the app actually ranks in App Store search for a handful of
 * its most meaningful terms. This converts the *inferred* keyword field into
 * *measured* discoverability — real positions, fetched live.
 *
 * Bounded on purpose: a few terms, one search each, so it adds little latency
 * and degrades to [] on any failure.
 */
const STOP = new Set([
  "app", "apps", "the", "and", "for", "with", "your", "you", "free", "best",
  "new", "get", "now", "more", "most", "downloaded",
]);

export async function measureKeywordRanks(
  listing: AppListing,
  max = 4,
): Promise<KeywordRank[]> {
  const terms = pickTerms(listing, max);
  const results = await Promise.all(
    terms.map((term) => rankFor(listing.appId, term, listing.country)),
  );
  return results.filter((r): r is KeywordRank => r !== null);
}

/** Prefer multi-word phrases from subtitle/keywords, then salient single terms. */
function pickTerms(listing: AppListing, max: number): string[] {
  const candidates: string[] = [];

  const sub = listing.subtitle.value;
  if (sub) {
    // A 2-word phrase from the subtitle is a realistic search query.
    const words = sub.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2 && !STOP.has(w.toLowerCase()));
    if (words.length >= 2) candidates.push(`${words[0]} ${words[1]}`.toLowerCase());
  }

  const kw = (listing.keywordField.value ?? "")
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 3 && !STOP.has(k));
  candidates.push(...kw);

  // Category as a broad baseline.
  candidates.push(listing.primaryCategory.toLowerCase());

  return [...new Set(candidates)].slice(0, max);
}

async function rankFor(
  appId: string,
  keyword: string,
  country: string,
): Promise<KeywordRank | null> {
  try {
    const scanned = 50;
    const results = await searchApps(keyword, country, scanned);
    const idx = results.findIndex((r) => String(r.trackId) === appId);
    return {
      keyword,
      rank: idx >= 0 ? idx + 1 : null,
      scanned: results.length,
    };
  } catch {
    return null;
  }
}
