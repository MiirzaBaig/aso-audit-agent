import { env, hasFirecrawl } from "./env.js";
import { fetchText } from "./http.js";

/**
 * The subtitle and promotional text are NOT in the iTunes API. We recover them
 * from the rendered listing. Two strategies, in order of reliability:
 *
 *   1. Firecrawl (if a key is set) — robust, handles Apple's client rendering.
 *   2. A best-effort parse of the listing's embedded JSON-LD / meta tags.
 *
 * Everything here is optional. If both fail we return null and the audit marks
 * the subtitle as "not observable", never fabricating one.
 */

export interface ScrapedListingExtras {
  subtitle: string | null;
  promotionalText: string | null;
}

export async function scrapeListingExtras(
  storeUrl: string,
): Promise<ScrapedListingExtras> {
  if (hasFirecrawl()) {
    const viaFirecrawl = await tryFirecrawl(storeUrl);
    if (viaFirecrawl) return viaFirecrawl;
  }
  return tryDirectParse(storeUrl);
}

async function tryFirecrawl(storeUrl: string): Promise<ScrapedListingExtras | null> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.firecrawl.apiKey}`,
      },
      body: JSON.stringify({ url: storeUrl, formats: ["markdown"] }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { markdown?: string } };
    const md = json.data?.markdown;
    if (!md) return null;
    return { subtitle: extractSubtitleFromText(md), promotionalText: null };
  } catch {
    return null;
  }
}

async function tryDirectParse(storeUrl: string): Promise<ScrapedListingExtras> {
  try {
    const html = await fetchText(storeUrl, { timeoutMs: 8000, retries: 1 });

    // Apple embeds a shoebox JSON blob; the subtitle lives under
    // "subtitle" in the product metadata. Grab it defensively.
    const subMatch = html.match(/"subtitle"\s*:\s*"([^"]+)"/);
    const subtitle = subMatch?.[1] ? decodeEntities(subMatch[1]) : null;

    return { subtitle, promotionalText: null };
  } catch {
    return { subtitle: null, promotionalText: null };
  }
}

function extractSubtitleFromText(markdown: string): string | null {
  // The subtitle typically renders on the line right after the app name,
  // before ratings. This is a heuristic; null is an acceptable answer.
  const lines = markdown
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const nameIdx = lines.findIndex((l) => /^#\s/.test(l));
  if (nameIdx >= 0 && lines[nameIdx + 1] && lines[nameIdx + 1]!.length <= 40) {
    return lines[nameIdx + 1]!;
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/\\u0026/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}
