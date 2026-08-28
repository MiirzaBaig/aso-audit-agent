import { registerApiRoute } from "@mastra/core/server";

/**
 * Custom HTTP surface the Next.js chat app drives.
 *
 * We expose the audit as two calls that mirror the workflow's suspend/resume
 * shape, so the UI stays a thin client:
 *
 *   POST /custom/audit/start   { url }                  → { runId, status, identity }
 *   POST /custom/audit/resume  { runId, confirmed }     → { report, competitors, ... }
 *
 * (Mastra reserves the /api/* prefix for its built-in routes, so ours live
 *  under /custom.)
 *
 * Keeping this as an explicit, typed contract (rather than leaking Mastra's
 * internal run API to the browser) is what lets the server live on Railway and
 * the UI on Vercel without them being coupled.
 */

export const auditRoutes = [
  registerApiRoute("/custom/audit/start", {
    method: "POST",
    handler: async (c) => {
      const mastra = c.get("mastra");
      const body = (await c.req.json().catch(() => ({}))) as { url?: string };
      if (!body.url || typeof body.url !== "string") {
        return c.json({ error: "Missing 'url' in request body." }, 400);
      }

      const workflow = mastra.getWorkflow("asoAuditWorkflow");
      const run = await workflow.createRun();
      const result = await run.start({ inputData: { url: body.url } });

      if (result.status === "suspended") {
        // The confirm-app step suspended with the surface identity to show.
        const suspended = extractSuspendPayload(result);
        return c.json({
          runId: run.runId,
          status: "awaiting-confirmation" as const,
          identity: suspended?.identity ?? null,
          question: suspended?.question ?? "Is this the app you meant?",
        });
      }

      if (result.status === "failed") {
        return c.json({ error: errorMessage(result) }, 422);
      }

      // Shouldn't happen (the workflow always suspends first), but handle it.
      return c.json({ runId: run.runId, status: result.status });
    },
  }),

  registerApiRoute("/custom/audit/resume", {
    method: "POST",
    handler: async (c) => {
      const mastra = c.get("mastra");
      const body = (await c.req.json().catch(() => ({}))) as {
        runId?: string;
        confirmed?: boolean;
      };
      if (!body.runId) {
        return c.json({ error: "Missing 'runId'." }, 400);
      }

      const workflow = mastra.getWorkflow("asoAuditWorkflow");
      const run = await workflow.createRun({ runId: body.runId });

      const result = await run.resume({
        step: "confirm-app",
        resumeData: { confirmed: body.confirmed ?? false },
      });

      if (result.status === "success") {
        return c.json({ status: "complete" as const, ...result.result });
      }
      if (result.status === "failed") {
        return c.json({ error: errorMessage(result) }, 422);
      }
      return c.json({ status: result.status });
    },
  }),
];

// --- narrow helpers over the loosely-typed run result ---

interface SuspendPayload {
  identity: unknown;
  question: string;
}

function extractSuspendPayload(result: unknown): SuspendPayload | null {
  const r = result as {
    // `suspendPayload` is keyed by the suspended step id.
    suspendPayload?: Record<string, SuspendPayload> | SuspendPayload;
    steps?: Record<string, { suspendPayload?: SuspendPayload }>;
  };

  const keyed = r.suspendPayload as Record<string, SuspendPayload> | undefined;
  if (keyed?.["confirm-app"]?.identity) return keyed["confirm-app"]!;

  // Fallbacks: a flat payload, or the step-result's own suspendPayload.
  const flat = r.suspendPayload as SuspendPayload | undefined;
  if (flat?.identity) return flat;

  return r.steps?.["confirm-app"]?.suspendPayload ?? null;
}

function errorMessage(result: unknown): string {
  const r = result as { error?: unknown };
  if (r.error instanceof Error) return r.error.message;
  if (typeof r.error === "string") return r.error;
  return "The audit failed. Check the URL and try again.";
}
