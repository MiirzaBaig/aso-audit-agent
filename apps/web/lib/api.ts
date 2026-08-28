import type { AppIdentity, AuditReport, Competitor } from "@aso/shared";

/**
 * Client-side calls go to this app's own /api routes, which proxy to the Mastra
 * server (see app/api/audit/*). That indirection keeps the backend origin a
 * server-only secret and sidesteps browser CORS entirely — the UI only ever
 * talks to its own origin.
 */

export interface StartResponse {
  runId: string;
  status: "awaiting-confirmation";
  identity: AppIdentity;
  question: string;
}

export interface AuditResult {
  status: "complete";
  report: AuditReport;
  competitors: Competitor[];
  analysisSource: "llm" | "template";
}

export interface ApiError {
  error: string;
}

export async function startAudit(url: string): Promise<StartResponse> {
  const res = await fetch("/api/audit/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as ApiError).error ?? "Failed to start the audit.");
  return data as StartResponse;
}

export async function resumeAudit(runId: string, confirmed: boolean): Promise<AuditResult> {
  const res = await fetch("/api/audit/resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runId, confirmed }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as ApiError).error ?? "The audit failed.");
  return data as AuditResult;
}
