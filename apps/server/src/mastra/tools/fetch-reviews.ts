import { createTool } from "@mastra/core/tools";
import { reviewSchema } from "@aso/shared";
import { z } from "zod";
import { fetchRecentReviews } from "../lib/itunes.js";

/**
 * Standalone access to recent reviews. `fetch-app-metadata` already embeds
 * these for the audit, but exposing the capability as its own tool keeps the
 * toolset composable — the agent can pull fresh reviews on demand without
 * re-fetching the whole listing.
 */
export const fetchReviewsTool = createTool({
  id: "fetch-reviews",
  description: "Fetch recent customer reviews for an app from the App Store RSS feed.",
  inputSchema: z.object({
    appId: z.string(),
    country: z.string(),
    pages: z.number().int().min(1).max(5).default(2),
  }),
  outputSchema: z.object({ reviews: z.array(reviewSchema) }),
  execute: async (input) => ({
    reviews: await fetchRecentReviews(input.appId, input.country, input.pages),
  }),
});
