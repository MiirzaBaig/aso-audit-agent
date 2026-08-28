import { createWorkflow, createStep } from "@mastra/core/workflows";
import {
  appIdentitySchema,
  appListingSchema,
  auditReportSchema,
  competitorSchema,
} from "@aso/shared";
import { z } from "zod";
import { getAppListing, getCompetitors } from "../services/listing-service.js";
import { buildAuditReport } from "../lib/report.js";

/**
 * The end-to-end audit as a Mastra workflow with a genuine human-in-the-loop
 * pause.
 *
 *   1. resolve-listing : parse the URL and fetch the full listing.
 *   2. confirm-app     : SUSPEND with the surface identity, resume on the
 *                        user's yes/no. This is the "Is this the app you
 *                        meant?" gate — modelled as real suspend/resume state,
 *                        not a boolean flag threaded through the app.
 *   3. run-audit       : discover competitors, compute scores, synthesize prose.
 *
 * The web app drives this via createRunAsync → start → (suspended) → resume.
 */

const resolveListing = createStep({
  id: "resolve-listing",
  inputSchema: z.object({ url: z.string() }),
  outputSchema: z.object({
    listing: appListingSchema,
    identity: appIdentitySchema,
  }),
  execute: async ({ inputData }) => {
    const listing = await getAppListing(inputData.url);
    const identity = {
      appId: listing.appId,
      country: listing.country,
      name: listing.name,
      developer: listing.developer,
      iconUrl: listing.iconUrl,
      primaryCategory: listing.primaryCategory,
      storeUrl: listing.storeUrl,
    };
    return { listing, identity };
  },
});

const confirmApp = createStep({
  id: "confirm-app",
  inputSchema: z.object({
    listing: appListingSchema,
    identity: appIdentitySchema,
  }),
  // What the user sees while suspended.
  suspendSchema: z.object({
    identity: appIdentitySchema,
    question: z.string(),
  }),
  // What the user sends back to resume.
  resumeSchema: z.object({ confirmed: z.boolean() }),
  outputSchema: z.object({ listing: appListingSchema }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (!resumeData) {
      return suspend({
        identity: inputData.identity,
        question: `Is this the app you meant? ${inputData.identity.name} by ${inputData.identity.developer}.`,
      });
    }
    if (!resumeData.confirmed) {
      throw new Error("User did not confirm the app. Paste a different App Store URL to try again.");
    }
    return { listing: inputData.listing };
  },
});

const runAudit = createStep({
  id: "run-audit",
  inputSchema: z.object({ listing: appListingSchema }),
  outputSchema: z.object({
    report: auditReportSchema,
    competitors: z.array(competitorSchema),
    analysisSource: z.enum(["llm", "template"]),
  }),
  execute: async ({ inputData }) => {
    const { listing } = inputData;

    const competitors = await getCompetitors({
      appId: listing.appId,
      country: listing.country,
      primaryCategory: listing.primaryCategory,
      name: listing.name,
      limit: 3,
    });

    const { report, analysisSource } = await buildAuditReport(listing, competitors);
    return { report, competitors, analysisSource };
  },
});

export const asoAuditWorkflow = createWorkflow({
  id: "aso-audit",
  inputSchema: z.object({ url: z.string() }),
  outputSchema: z.object({
    report: auditReportSchema,
    competitors: z.array(competitorSchema),
    analysisSource: z.enum(["llm", "template"]),
  }),
})
  .then(resolveListing)
  .then(confirmApp)
  .then(runAudit)
  .commit();
