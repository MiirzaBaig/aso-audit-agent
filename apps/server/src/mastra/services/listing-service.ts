import type { AppListing, Competitor } from "@aso/shared";
import { Provenance, sourced } from "@aso/shared";
import { parseAppStoreUrl, buildStoreUrl } from "../lib/app-store-url.js";
import {
  lookupApp,
  pickArtwork,
  detectAppPreviewVideo,
  fetchRecentReviews,
  searchApps,
  toCompetitor,
} from "../lib/itunes.js";
import { scrapeListingExtras } from "../lib/scrape.js";
import { inferKeywordField } from "../lib/keyword-inference.js";
import { ocrScreenshots } from "../lib/screenshot-ocr.js";

/**
 * Plain service functions with no Mastra coupling. Both the tools (for the
 * agent/playground) and the workflow steps call these, so the business logic
 * lives in exactly one place and is trivially unit-testable.
 */

const round1 = (n: number) => Math.round(n * 10) / 10;

export async function getAppListing(
  url: string,
  opts: { deepScan?: boolean } = {},
): Promise<AppListing> {
  const parsed = parseAppStoreUrl(url);
  if (!parsed) {
    throw new Error(
      `Couldn't find an App Store app id in "${url}". Expected something like https://apps.apple.com/us/app/name/id123456789`,
    );
  }

  const { appId, country } = parsed;
  const app = await lookupApp(appId, country);
  if (!app) {
    throw new Error(
      `No App Store listing found for id ${appId} in the "${country}" storefront.`,
    );
  }

  const storeUrl = app.trackViewUrl || buildStoreUrl(appId, country);

  const [extras, hasVideo, reviews, ocr] = await Promise.all([
    scrapeListingExtras(storeUrl),
    detectAppPreviewVideo(storeUrl),
    fetchRecentReviews(appId, country),
    ocrScreenshots(app.screenshotUrls ?? [], opts.deepScan),
  ]);

  const screenshotText =
    ocr && ocr.text.length
      ? sourced<string[] | null>(
          ocr.text,
          Provenance.Observed,
          `On-image text read via OCR of the first ${ocr.imagesRead} screenshot(s).`,
        )
      : sourced<string[] | null>(
          null,
          Provenance.Observed,
          "Screenshot OCR was skipped or found no legible text.",
        );

  const subtitle = extras.subtitle
    ? sourced<string | null>(
        extras.subtitle,
        Provenance.Scraped,
        "Scraped from the rendered listing; not exposed by the iTunes API.",
      )
    : sourced<string | null>(
        null,
        Provenance.Scraped,
        "Subtitle not recoverable from public data (set FIRECRAWL_API_KEY for more reliable extraction).",
      );

  const keywordField = sourced<string | null>(
    inferKeywordField(app.trackName, subtitle.value, app.description),
    Provenance.Inferred,
    "The iOS 100-char keyword field is private. This is a heuristic reconstruction from the title, subtitle and description — treat as directional, not literal.",
  );

  return {
    appId,
    country,
    name: app.trackName,
    developer: app.artistName,
    iconUrl: pickArtwork(app),
    primaryCategory: app.primaryGenreName,
    storeUrl,
    title: app.trackName,
    subtitle,
    description: app.description,
    keywordField,
    releaseNotes: app.releaseNotes ?? null,
    promotionalText: sourced<string | null>(
      extras.promotionalText,
      Provenance.Scraped,
      extras.promotionalText ? undefined : "Promotional text not present or not recoverable.",
    ),
    version: app.version,
    screenshotUrls: app.screenshotUrls ?? [],
    screenshotText,
    hasAppPreviewVideo: hasVideo,
    averageRating: round1(app.averageUserRating ?? 0),
    ratingCount: app.userRatingCount ?? 0,
    currentVersionRatingCount: app.userRatingCountForCurrentVersion ?? null,
    currentVersionAverageRating:
      app.averageUserRatingForCurrentVersion != null
        ? round1(app.averageUserRatingForCurrentVersion)
        : null,
    genres: app.genres ?? [app.primaryGenreName],
    price: app.price ?? 0,
    reviews,
  };
}

export interface FindCompetitorsInput {
  appId: string;
  country: string;
  primaryCategory: string;
  name: string;
  limit?: number;
}

export async function getCompetitors({
  appId,
  country,
  primaryCategory,
  name,
  limit = 3,
}: FindCompetitorsInput): Promise<Competitor[]> {
  const terms = dedupe([primaryCategory, ...significantWords(name)]);
  const found = new Map<string, Competitor>();

  for (const term of terms) {
    if (found.size >= limit) break;
    let results;
    try {
      results = await searchApps(term, country, 10);
    } catch {
      continue;
    }
    for (const candidate of results) {
      const id = String(candidate.trackId);
      if (id === appId || found.has(id)) continue;
      if (!candidate.screenshotUrls?.length) continue;
      found.set(id, toCompetitor(candidate));
      if (found.size >= limit) break;
    }
  }

  const competitors = [...found.values()]
    .sort((a, b) => b.ratingCount - a.ratingCount)
    .slice(0, limit);

  return Promise.all(
    competitors.map(async (competitor) => ({
      ...competitor,
      hasVideo: await detectAppPreviewVideo(
        buildStoreUrl(competitor.appId, country),
      ),
    })),
  );
}

function significantWords(name: string): string[] {
  return name
    .split(/[^\p{L}\p{N}]+/u)
    .map((w) => w.trim())
    .filter((w) => w.length > 3)
    .slice(0, 2);
}

function dedupe(xs: string[]): string[] {
  return [...new Set(xs.map((x) => x.trim()).filter(Boolean))];
}
