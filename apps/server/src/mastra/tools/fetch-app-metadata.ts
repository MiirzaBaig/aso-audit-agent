import { createTool } from "@mastra/core/tools";
import { appListingSchema } from "@aso/shared";
import { z } from "zod";
import { getAppListing } from "../services/listing-service.js";

/**
 * Tool wrapper around `getAppListing`. The logic lives in the service so the
 * workflow can call it without going through the tool's execution context.
 */
export const fetchAppMetadataTool = createTool({
  id: "fetch-app-metadata",
  description:
    "Fetch the full App Store listing (name, developer, icon, category, description, screenshots, ratings, reviews, and inferred keyword field) for a given App Store URL or numeric app id.",
  inputSchema: z.object({
    url: z.string().describe("An Apple App Store URL or a bare numeric app id."),
  }),
  outputSchema: appListingSchema,
  execute: async (input) => getAppListing(input.url),
});
