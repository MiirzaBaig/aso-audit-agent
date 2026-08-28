import type {
  AppListing,
  AuditReport,
  Competitor,
  ScoreCard,
} from "@aso/shared";
import { computeScoreCard } from "../scoring/index.js";
import { synthesizeAnalysis } from "./synthesize.js";

/**
 * Assembles the final audit: compute scores deterministically, synthesize the
 * prose (LLM or template), then merge. The provenance-derived caveats become
 * the report's `limitations` so the UI can be honest about what we couldn't see.
 */
export async function buildAuditReport(
  listing: AppListing,
  competitors: Competitor[],
): Promise<{ report: AuditReport; analysisSource: "llm" | "template"; scoreCard: ScoreCard }> {
  const scoreCard = computeScoreCard(listing, competitors);
  const { output, source } = await synthesizeAnalysis(listing, scoreCard, competitors);

  const report: AuditReport = {
    scoreCard,
    headline: output.headline,
    recommendations: output.recommendations,
    competitorComparison: {
      competitors,
      narrative: output.competitorNarrative,
    },
    limitations: collectLimitations(listing, scoreCard),
  };

  return { report, analysisSource: source, scoreCard };
}

function collectLimitations(listing: AppListing, scoreCard: ScoreCard): string[] {
  const out: string[] = [];
  if (!listing.subtitle.value) {
    out.push("Subtitle could not be observed from public data; scored conservatively.");
  }
  out.push(
    "The iOS 100-character keyword field is private; keyword findings are inferred from the title, subtitle and description.",
  );
  if (scoreCard.dimensions.some((d) => d.id === "screenshots" && !d.observable)) {
    out.push("Screenshot visual quality and on-image text were not analysed pixel-level — only slot coverage is measured.");
  }
  out.push("In-App Events and custom product pages are not exposed in public metadata.");
  return out;
}
