import type { OpenAICompatibleConfig } from "@mastra/core/llm";
import { env } from "./env.js";

/**
 * The ASO analyst runs on NVIDIA NIM's OpenAI-compatible endpoint.
 *
 * NIM is a deliberate choice: free-tier and OpenAI-compatible, keeping the
 * project zero-cost to run and evaluate. The tradeoff is a smaller model than a
 * frontier API — so the architecture leans on a *deterministic* scoring engine
 * and hands the model only the scoped job of turning computed facts into prose.
 *
 * We return Mastra's native `OpenAICompatibleConfig` rather than constructing an
 * AI-SDK model instance ourselves — Mastra's model router understands this shape
 * directly, which avoids AI-SDK version drift and keeps the wiring declarative.
 *
 * Returns `null` when no key is configured, so callers can fall back to a
 * template-based report instead of crashing.
 */
export function getAnalystModel(): OpenAICompatibleConfig | null {
  if (!env.nim.apiKey) return null;

  return {
    id: `nvidia-nim/${env.nim.model}` as `${string}/${string}`,
    url: env.nim.baseUrl,
    apiKey: env.nim.apiKey,
  };
}
