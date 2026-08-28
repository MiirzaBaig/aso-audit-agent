import { env } from "./env.js";

export interface ParsedAppStoreUrl {
  appId: string;
  country: string;
}

/**
 * Extracts the numeric app id and storefront country from an Apple App Store
 * URL. Tolerant of the many shapes these take:
 *
 *   https://apps.apple.com/us/app/spotify/id324684580
 *   https://apps.apple.com/app/id324684580
 *   https://itunes.apple.com/gb/app/foo/id123?mt=8
 *   apps.apple.com/us/app/foo/id324684580?l=en
 *   324684580                          (bare id — falls back to default country)
 *
 * Returns null when no app id can be found, so the caller can prompt the user
 * rather than throwing.
 */
export function parseAppStoreUrl(input: string): ParsedAppStoreUrl | null {
  const raw = input.trim();

  // Bare numeric id.
  if (/^\d{5,}$/.test(raw)) {
    return { appId: raw, country: env.defaultCountry };
  }

  const idMatch = raw.match(/id(\d{5,})/i);
  if (!idMatch?.[1]) return null;
  const appId = idMatch[1];

  // Country is the 2-letter segment right after the host, when present.
  let country = env.defaultCountry;
  const countryMatch = raw.match(/(?:apps|itunes)\.apple\.com\/([a-z]{2})\//i);
  if (countryMatch?.[1]) country = countryMatch[1].toLowerCase();

  return { appId, country };
}

/** Canonical store URL for a given app id + country (used for display + scraping). */
export function buildStoreUrl(appId: string, country: string): string {
  return `https://apps.apple.com/${country}/app/id${appId}`;
}
