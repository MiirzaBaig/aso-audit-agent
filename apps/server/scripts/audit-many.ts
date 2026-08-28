/**
 * Robustness harness.
 *
 * The brief says they'll run this against apps we haven't seen, so this script
 * exercises the full audit pipeline over a deliberately DIVERSE set — a
 * streaming app, a game, a finance app, a utility, a language app, and a
 * non-US storefront — and asserts none of them crash and every score card is
 * well-formed. Run: pnpm audit:many
 */
import { getAppListing, getCompetitors } from "../src/mastra/services/listing-service.js";
import { computeScoreCard } from "../src/mastra/scoring/index.js";

interface Case {
  label: string;
  url: string;
}

const CASES: Case[] = [
  { label: "Music (Spotify)", url: "https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580" },
  { label: "Game (Roblox)", url: "https://apps.apple.com/us/app/roblox/id431946152" },
  { label: "Finance (Revolut)", url: "https://apps.apple.com/us/app/revolut/id932493382" },
  { label: "Utility (Google Maps)", url: "https://apps.apple.com/us/app/google-maps/id585027354" },
  { label: "Language (Duolingo)", url: "https://apps.apple.com/us/app/duolingo-language-lessons/id570060128" },
  { label: "Non-US storefront (Spotify GB)", url: "https://apps.apple.com/gb/app/spotify-music-and-podcasts/id324684580" },
];

interface Row {
  label: string;
  ok: boolean;
  overall?: number;
  grade?: string;
  dims?: number;
  competitors?: number;
  detail?: string;
}

async function auditOne(c: Case): Promise<Row> {
  try {
    const listing = await getAppListing(c.url);
    const competitors = await getCompetitors({
      appId: listing.appId,
      country: listing.country,
      primaryCategory: listing.primaryCategory,
      name: listing.name,
    });
    const card = computeScoreCard(listing, competitors);

    // Invariants that must hold for ANY app.
    const valid =
      card.overall >= 0 &&
      card.overall <= 100 &&
      card.dimensions.length === 10 &&
      card.dimensions.every((d) => d.score >= 0 && d.score <= 10);

    return {
      label: c.label,
      ok: valid,
      overall: card.overall,
      grade: card.grade,
      dims: card.dimensions.length,
      competitors: competitors.length,
      detail: valid ? undefined : "invariant violation",
    };
  } catch (err) {
    return { label: c.label, ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

async function main() {
  console.log(`\nRunning robustness harness over ${CASES.length} diverse apps…\n`);
  const rows: Row[] = [];
  for (const c of CASES) {
    process.stdout.write(`  • ${c.label.padEnd(32)} `);
    const row = await auditOne(c);
    rows.push(row);
    console.log(
      row.ok
        ? `✓ ${row.overall}/100 (${row.grade}), ${row.competitors} competitors`
        : `✗ ${row.detail}`,
    );
  }

  const passed = rows.filter((r) => r.ok).length;
  console.log(`\n${passed}/${rows.length} passed.\n`);
  process.exit(passed === rows.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
