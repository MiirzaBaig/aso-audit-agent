/**
 * Quick end-to-end smoke test of the audit pipeline WITHOUT Mastra's server —
 * exercises the real network path (iTunes API, reviews, competitors), the
 * deterministic scorer, and the template synthesis. Run: pnpm tsx scripts/smoke.ts <url>
 */
import { getAppListing, getCompetitors } from "../src/mastra/services/listing-service.js";
import { buildAuditReport } from "../src/mastra/lib/report.js";

const url =
  process.argv[2] ??
  "https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580";

async function main() {
  console.log(`\n▶ Fetching listing for: ${url}\n`);
  const listing = await getAppListing(url);
  console.log(`  ${listing.name} — ${listing.developer} [${listing.primaryCategory}, ${listing.country}]`);
  console.log(`  ${listing.averageRating}★ (${listing.ratingCount.toLocaleString()}), ${listing.screenshotUrls.length} screenshots, video=${listing.hasAppPreviewVideo}`);
  console.log(`  subtitle(${listing.subtitle.provenance})=${JSON.stringify(listing.subtitle.value)}`);
  console.log(`  reviews fetched: ${listing.reviews.length}`);

  const competitors = await getCompetitors({
    appId: listing.appId,
    country: listing.country,
    primaryCategory: listing.primaryCategory,
    name: listing.name,
  });
  console.log(`\n  competitors: ${competitors.map((c) => `${c.name}(${c.averageRating}★)`).join(", ") || "none"}`);

  const { report, analysisSource } = await buildAuditReport(listing, competitors);
  console.log(`\n▶ ASO Score: ${report.scoreCard.overall}/100 (grade ${report.scoreCard.grade}) — analysis via ${analysisSource}`);
  for (const d of report.scoreCard.dimensions) {
    console.log(`   ${d.label.padEnd(20)} ${String(d.score).padStart(4)}/10  w=${d.weight.toFixed(1)}%${d.observable ? "" : "  (partial)"}`);
  }
  console.log(`\n▶ Headline: ${report.headline}`);
  console.log(`▶ ${report.recommendations.length} recommendations (${report.recommendations.filter((r) => r.tier === "quick-win").length} quick / ${report.recommendations.filter((r) => r.tier === "high-impact").length} high-impact / ${report.recommendations.filter((r) => r.tier === "strategic").length} strategic)`);
  const first = report.recommendations[0];
  if (first) {
    console.log(`   e.g. [${first.tier}] ${first.title}`);
    if (first.before) console.log(`        before: ${first.before}`);
    if (first.after) console.log(`        after:  ${first.after}`);
  }
  console.log(`\n✓ Smoke test passed.\n`);
}

main().catch((e) => {
  console.error("✗ Smoke test failed:", e);
  process.exit(1);
});
