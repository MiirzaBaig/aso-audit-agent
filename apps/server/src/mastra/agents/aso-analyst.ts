import { Agent } from "@mastra/core/agent";
import { getAnalystModel } from "../lib/model.js";
import { asoFrameworkSkill } from "../skills/aso-framework.js";
import { fetchAppMetadataTool, fetchReviewsTool, findCompetitorsTool } from "../tools/index.js";

/**
 * The ASO analyst agent.
 *
 * Deliberately narrow: it carries the data-fetch tools and the ASO framework
 * skill, but the heavy lifting (scoring) happens deterministically outside it.
 * Its model runs on NVIDIA NIM (see lib/model). When no NIM key is configured,
 * `getAnalystModel()` returns null and the workflow uses a deterministic
 * template instead — so the app still runs end-to-end with zero keys.
 *
 * We expose the agent for both the workflow (structured synthesis) and the
 * Mastra Studio playground (interactive exploration of the tools).
 */
const model = getAnalystModel();

export const asoAnalystAgent = new Agent({
  id: "aso-analyst",
  name: "ASO Analyst",
  instructions:
    "You audit Apple App Store listings for App Store Optimization. Use the aso-audit skill for methodology. Always ground findings in the data you are given and never fabricate metrics.",
  // Fall back to a router string when no NIM key is present; the workflow won't
  // actually invoke the model in that case, but the Agent still needs a value.
  model: model ?? "openai/gpt-4o-mini",
  skills: [asoFrameworkSkill],
  tools: {
    fetchAppMetadata: fetchAppMetadataTool,
    fetchReviews: fetchReviewsTool,
    findCompetitors: findCompetitorsTool,
  },
});
