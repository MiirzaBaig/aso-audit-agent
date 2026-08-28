/**
 * Centralised, validated environment access.
 *
 * Every optional key degrades gracefully: the app runs end-to-end with zero
 * keys (using mock/heuristic fallbacks), which is what makes `npm run dev`
 * work out of the box for a reviewer. Keys unlock progressively better data.
 */

const optional = (key: string): string | undefined => {
  const v = process.env[key];
  return v && v.trim().length > 0 ? v.trim() : undefined;
};

export const env = {
  /** NVIDIA NIM (OpenAI-compatible). Without it, the analyst falls back to a deterministic template. */
  nim: {
    apiKey: optional("NIM_API_KEY"),
    baseUrl: optional("NIM_BASE_URL") ?? "https://integrate.api.nvidia.com/v1",
    model: optional("NIM_MODEL") ?? "meta/llama-3.3-70b-instruct",
  },
  /** Firecrawl — only used to scrape the subtitle, which the iTunes API omits. Fully optional. */
  firecrawl: {
    apiKey: optional("FIRECRAWL_API_KEY"),
  },
  /** Default storefront when a URL omits the country segment. */
  defaultCountry: (optional("DEFAULT_COUNTRY") ?? "us").toLowerCase(),
} as const;

export const hasLlm = (): boolean => Boolean(env.nim.apiKey);
export const hasFirecrawl = (): boolean => Boolean(env.firecrawl.apiKey);
