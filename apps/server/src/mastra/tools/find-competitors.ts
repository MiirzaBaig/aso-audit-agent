import { createTool } from "@mastra/core/tools";
import { competitorSchema } from "@aso/shared";
import { z } from "zod";
import { getCompetitors } from "../services/listing-service.js";

/**
 * Tool wrapper around `getCompetitors`. Competitor discovery is a transparent
 * heuristic (App Store search over category/name terms), labelled as such in
 * the report — Apple doesn't publish a real competitor set.
 */
export const findCompetitorsTool = createTool({
  id: "find-competitors",
  description:
    "Find up to three competitor apps in the same category by searching the App Store, for side-by-side ASO comparison.",
  inputSchema: z.object({
    appId: z.string(),
    country: z.string(),
    primaryCategory: z.string(),
    name: z.string(),
    limit: z.number().int().min(1).max(5).default(3),
  }),
  outputSchema: z.object({ competitors: z.array(competitorSchema) }),
  execute: async (input) => ({ competitors: await getCompetitors(input) }),
});
