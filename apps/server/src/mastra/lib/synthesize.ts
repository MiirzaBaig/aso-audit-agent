import type {
  AnalystOutput,
  AppListing,
  Competitor,
  ScoreCard,
} from "@aso/shared";
import { analystOutputSchema } from "@aso/shared";
import { asoAnalystAgent } from "../agents/aso-analyst.js";
import { hasLlm } from "./env.js";
import { buildTemplateAnalysis } from "./template-analysis.js";

/**
 * Turns the computed score card + facts into the qualitative report.
 *
 * Two paths, same output shape:
 *   - With a NIM key: the analyst agent produces structured output constrained
 *     to `analystOutputSchema`. Scores are handed in as context, never asked
 *     for — the model can't invent numbers.
 *   - Without a key (or on model failure): a deterministic template turns the
 *     lowest-scoring, highest-weighted dimensions into concrete recommendations
 *     so the app is fully usable with zero configuration.
 */
export async function synthesizeAnalysis(
  listing: AppListing,
  scoreCard: ScoreCard,
  competitors: Competitor[],
): Promise<{ output: AnalystOutput; source: "llm" | "template" }> {
  if (!hasLlm()) {
    return { output: buildTemplateAnalysis(listing, scoreCard, competitors), source: "template" };
  }

  try {
    const prompt = buildPrompt(listing, scoreCard, competitors);
    const result = await asoAnalystAgent.generate(prompt, {
      structuredOutput: { schema: analystOutputSchema },
      // The plan is large (9–15 detailed recs with before/after). Give the
      // model ample room — some NIM models use a reasoning channel that eats
      // into the budget before the final JSON is emitted — and keep it low-temp
      // for consistent, grounded output.
      modelSettings: { maxOutputTokens: 4096, temperature: 0.4 },
    });

    const output = (result as { object?: AnalystOutput }).object;
    if (output) {
      const parsed = analystOutputSchema.safeParse(output);
      if (parsed.success) return { output: parsed.data, source: "llm" };
    }
    // Fall through to template if the model returned nothing usable.
    return { output: buildTemplateAnalysis(listing, scoreCard, competitors), source: "template" };
  } catch {
    return { output: buildTemplateAnalysis(listing, scoreCard, competitors), source: "template" };
  }
}

function buildPrompt(
  listing: AppListing,
  scoreCard: ScoreCard,
  competitors: Competitor[],
): string {
  const facts = {
    identity: {
      name: listing.name,
      developer: listing.developer,
      category: listing.primaryCategory,
      country: listing.country,
    },
    text: {
      title: listing.title,
      subtitle: listing.subtitle,
      keywordField: listing.keywordField,
      promotionalText: listing.promotionalText,
      descriptionOpening: listing.description.slice(0, 400),
      releaseNotes: listing.releaseNotes,
    },
    assets: {
      screenshotCount: listing.screenshotUrls.length,
      hasAppPreviewVideo: listing.hasAppPreviewVideo,
    },
    ratings: {
      average: listing.averageRating,
      count: listing.ratingCount,
      currentVersionAverage: listing.currentVersionAverageRating,
    },
    recentReviews: listing.reviews.slice(0, 12).map((r) => ({
      rating: r.rating,
      title: r.title,
      body: r.body.slice(0, 200),
    })),
    competitors,
  };

  return [
    "Audit this Apple App Store listing. Use the pre-computed SCORE CARD as the",
    "source of truth for scores — do not restate the numbers, explain and act on them.",
    "",
    "=== SCORE CARD (computed, authoritative) ===",
    `Overall: ${scoreCard.overall}/100 (grade ${scoreCard.grade})`,
    ...scoreCard.dimensions.map(
      (d) =>
        `- ${d.label} [weight ${d.weight.toFixed(1)}%]: ${d.score}/10${d.observable ? "" : " (partially observable)"} — ${d.evidence.join(" ")}`,
    ),
    "",
    "=== LISTING FACTS (provenance-tagged) ===",
    JSON.stringify(facts, null, 2),
    "",
    "Now produce the headline, 9–15 tiered recommendations (with before/after for",
    "every text change and cited evidence), and the competitor narrative.",
  ].join("\n");
}
