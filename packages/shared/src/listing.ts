import { z } from "zod";
import { sourcedSchema } from "./provenance";

/**
 * The surface metadata we show the user for the "Is this the app you meant?"
 * confirmation step. Small on purpose — just enough to recognise the app.
 */
export const appIdentitySchema = z.object({
  appId: z.string(),
  country: z.string().length(2),
  name: z.string(),
  developer: z.string(),
  iconUrl: z.string().url(),
  primaryCategory: z.string(),
  /** e.g. "https://apps.apple.com/us/app/.../id324684580" */
  storeUrl: z.string().url(),
});
export type AppIdentity = z.infer<typeof appIdentitySchema>;

/** A single customer review pulled from the iTunes RSS feed. */
export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string(),
  body: z.string(),
  author: z.string(),
  version: z.string().optional(),
  updated: z.string().optional(),
});
export type Review = z.infer<typeof reviewSchema>;

/**
 * The full listing snapshot the audit runs against. Fields that Apple does not
 * expose are modelled as `Sourced` so their provenance travels with them.
 */
export const appListingSchema = appIdentitySchema.extend({
  /** Marketing title on the product page (may equal name, may be "Name — Tagline"). */
  title: z.string(),
  /** 30-char field under the title. Not in the iTunes API — scraped. Null if unavailable. */
  subtitle: sourcedSchema(z.string().nullable()),
  /** Full long description. */
  description: z.string(),
  /** iOS 100-char keyword field. Private — always inferred. */
  keywordField: sourcedSchema(z.string().nullable()),
  /** "What's New" release notes for the current version. */
  releaseNotes: z.string().nullable(),
  /** Promotional text (30-line field above the description). Scraped; often absent. */
  promotionalText: sourcedSchema(z.string().nullable()),
  version: z.string(),
  screenshotUrls: z.array(z.string().url()),
  /** On-image text recovered via OCR of the first screenshots (Apple OCR-indexes it). Null if OCR was skipped/failed. */
  screenshotText: sourcedSchema(z.array(z.string()).nullable()),
  /** True if the listing has at least one app preview video. */
  hasAppPreviewVideo: z.boolean(),
  averageRating: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),
  /** Rating count for the *current* version only, when available. */
  currentVersionRatingCount: z.number().int().nonnegative().nullable(),
  currentVersionAverageRating: z.number().min(0).max(5).nullable(),
  genres: z.array(z.string()),
  price: z.number().nonnegative(),
  reviews: z.array(reviewSchema),
});
export type AppListing = z.infer<typeof appListingSchema>;

/** A competitor summarised for side-by-side comparison. */
export const competitorSchema = z.object({
  appId: z.string(),
  name: z.string(),
  title: z.string(),
  averageRating: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),
  screenshotCount: z.number().int().nonnegative(),
  hasVideo: z.boolean(),
  iconUrl: z.string().url(),
});
export type Competitor = z.infer<typeof competitorSchema>;
