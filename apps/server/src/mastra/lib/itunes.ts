import type { Competitor, Review } from "@aso/shared";
import { fetchJson, fetchText } from "./http.js";

/**
 * Thin client over Apple's public, official endpoints. We prefer these over
 * scraping because they are structured, stable, and don't break when Apple
 * reskins the web listing — which matters because we run against apps we've
 * never seen.
 *
 *   - iTunes Lookup API  → structured metadata (the bulk of the audit)
 *   - iTunes Search API  → competitor discovery
 *   - Customer Reviews RSS → recent reviews + themes
 */

const LOOKUP = "https://itunes.apple.com/lookup";
const SEARCH = "https://itunes.apple.com/search";

/** The subset of the iTunes Lookup response we consume. */
export interface ITunesApp {
  trackId: number;
  trackName: string;
  trackViewUrl: string;
  bundleId: string;
  artistName: string;
  artworkUrl512?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  primaryGenreName: string;
  genres: string[];
  description: string;
  releaseNotes?: string;
  version: string;
  screenshotUrls: string[];
  ipadScreenshotUrls?: string[];
  averageUserRating?: number;
  userRatingCount?: number;
  averageUserRatingForCurrentVersion?: number;
  userRatingCountForCurrentVersion?: number;
  price?: number;
  formattedPrice?: string;
  /** Present when the listing has an app preview video. */
  advisories?: string[];
}

interface LookupResponse {
  resultCount: number;
  results: ITunesApp[];
}

export async function lookupApp(appId: string, country: string): Promise<ITunesApp | null> {
  const url = `${LOOKUP}?id=${encodeURIComponent(appId)}&country=${encodeURIComponent(country)}&entity=software`;
  const data = await fetchJson<LookupResponse>(url);
  return data.results.find((r) => String(r.trackId) === String(appId)) ?? data.results[0] ?? null;
}

/**
 * App preview videos aren't a first-class field in the Lookup API. We detect
 * them from the artwork/preview payload present on the web listing's embedded
 * JSON. As a cheap, reliable proxy we check the listing HTML for a video asset
 * marker; callers treat the result as best-effort.
 */
export async function detectAppPreviewVideo(storeUrl: string): Promise<boolean> {
  try {
    const html = await fetchText(storeUrl, { timeoutMs: 8000, retries: 1 });
    // Apple serves preview videos as .m3u8/.mp4 under is5-ssl or mzstatic video hosts.
    return /video\d*\.mzstatic\.com|\.m3u8|is\d-ssl\.mzstatic\.com\/image\/thumb\/[^"']*Video/i.test(
      html,
    );
  } catch {
    return false;
  }
}

export async function searchApps(
  term: string,
  country: string,
  limit = 10,
): Promise<ITunesApp[]> {
  const url = `${SEARCH}?term=${encodeURIComponent(term)}&country=${encodeURIComponent(
    country,
  )}&entity=software&limit=${limit}`;
  const data = await fetchJson<LookupResponse>(url);
  return data.results ?? [];
}

export function toCompetitor(app: ITunesApp): Competitor {
  return {
    appId: String(app.trackId),
    name: app.trackName,
    title: app.trackName,
    averageRating: round1(app.averageUserRating ?? 0),
    ratingCount: app.userRatingCount ?? 0,
    screenshotCount: app.screenshotUrls?.length ?? 0,
    hasVideo: false, // filled by caller only when cheaply detectable
    iconUrl: pickArtwork(app),
  };
}

export function pickArtwork(app: ITunesApp): string {
  return (
    app.artworkUrl512 ??
    app.artworkUrl100 ??
    app.artworkUrl60 ??
    "https://apps.apple.com/favicon.ico"
  );
}

interface RssEntry {
  "im:rating"?: { label: string };
  "im:version"?: { label: string };
  title?: { label: string };
  content?: { label: string };
  author?: { name?: { label: string } };
  updated?: { label: string };
}

interface RssFeed {
  feed?: { entry?: RssEntry[] | RssEntry };
}

/**
 * Recent customer reviews via the public RSS feed. The first entry is the app
 * itself (Apple quirk), so we drop it. Returns [] on any failure — reviews are
 * one dimension, not a hard dependency.
 */
export async function fetchRecentReviews(
  appId: string,
  country: string,
  pages = 2,
): Promise<Review[]> {
  const reviews: Review[] = [];
  for (let page = 1; page <= pages; page++) {
    const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/json`;
    try {
      const data = await fetchJson<RssFeed>(url, { retries: 1, timeoutMs: 8000 });
      const entries = data.feed?.entry;
      if (!entries) continue;
      const list = Array.isArray(entries) ? entries : [entries];
      for (const e of list) {
        const rating = Number(e["im:rating"]?.label);
        if (!Number.isFinite(rating) || !e.content?.label) continue; // skips the app header entry
        reviews.push({
          rating: Math.min(5, Math.max(1, rating)),
          title: e.title?.label ?? "",
          body: e.content.label,
          author: e.author?.name?.label ?? "Anonymous",
          version: e["im:version"]?.label,
          updated: e.updated?.label,
        });
      }
    } catch {
      break;
    }
  }
  return reviews;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
