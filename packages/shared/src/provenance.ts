import { z } from "zod";

/**
 * Provenance is the backbone of this whole audit.
 *
 * Apple's public listing exposes some fields directly (name, ratings,
 * screenshots) but hides others entirely — most notably the 100-char iOS
 * keyword field, promotional text, and a developer's true competitor set.
 *
 * A cheap audit hallucinates the hidden fields. We refuse to. Every fact we
 * carry is tagged with where it came from, so the UI, the scoring engine, and
 * the LLM analyst can all distinguish "this is what Apple told us" from "this
 * is our best inference". Inferred facts are never presented as ground truth.
 */
export const Provenance = {
  /** Pulled verbatim from Apple's official iTunes Lookup API. */
  Observed: "observed",
  /** Scraped from the rendered listing page (less stable than the API). */
  Scraped: "scraped",
  /** Not publicly available — reconstructed by heuristic. Clearly labelled. */
  Inferred: "inferred",
} as const;

export type Provenance = (typeof Provenance)[keyof typeof Provenance];

export const provenanceSchema = z.enum([
  Provenance.Observed,
  Provenance.Scraped,
  Provenance.Inferred,
]);

/** A single value carried together with where we learned it. */
export interface Sourced<T> {
  value: T;
  provenance: Provenance;
  /** Human-readable note, e.g. "iOS keyword field is private; inferred from title + subtitle spread". */
  note?: string;
}

export const sourced = <T>(
  value: T,
  provenance: Provenance,
  note?: string,
): Sourced<T> => ({ value, provenance, ...(note ? { note } : {}) });

export const sourcedSchema = <T extends z.ZodTypeAny>(inner: T) =>
  z.object({
    value: inner,
    provenance: provenanceSchema,
    note: z.string().optional(),
  });
