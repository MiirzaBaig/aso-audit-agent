import { clampScore, type DimensionScorer } from "../types.js";

/**
 * Icon. Distinctiveness and small-size legibility are visual judgments the
 * analyst makes from the rendered icon. Deterministically we can only confirm
 * the icon exists at a high resolution (a hygiene check), so this dimension is
 * observable: false and scored with a neutral baseline the analyst refines.
 */
export const scoreIcon: DimensionScorer = ({ listing }) => {
  const evidence: string[] = [];
  const size = parseArtworkSize(listing.iconUrl);
  const hasHiRes =
    (size?.width != null && size.width >= 512) ||
    /512x512|1024/.test(listing.iconUrl) ||
    listing.iconUrl.includes("artwork");

  let score = 4;
  if (listing.iconUrl) score += 1;
  if (hasHiRes) score += 1.5;

  evidence.push(
    hasHiRes
      ? `A high-resolution icon is present${size ? ` (${size.width}x${size.height})` : ""}.`
      : "Icon present but not confirmed at high resolution.",
  );
  evidence.push("Distinctiveness in search results, small-size clarity, category fit and unreadable text avoidance require visual review.");

  return { id: "icon", score: clampScore(score), evidence, observable: false };
};

function parseArtworkSize(url: string): { width: number; height: number } | null {
  const match = url.match(/(\d+)x(\d+)(?:bb)?\.(?:png|jpg|jpeg|webp)/i);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}
