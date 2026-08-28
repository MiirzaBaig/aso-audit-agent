import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";
import { asoAnalystAgent } from "./agents/aso-analyst.js";
import { asoAuditWorkflow } from "./workflows/aso-audit.js";
import { fetchAppMetadataTool, fetchReviewsTool, findCompetitorsTool } from "./tools/index.js";
import { auditRoutes } from "./server/routes.js";

/**
 * The Mastra application root. Registers the analyst agent, the suspend/resume
 * audit workflow, the data tools, and the custom HTTP routes the Next.js chat
 * app calls. CORS is open so the Vercel-hosted UI can reach this server when
 * they're deployed separately (see README deploy topology).
 */
export const mastra = new Mastra({
  agents: { asoAnalystAgent },
  workflows: { asoAuditWorkflow },
  tools: { fetchAppMetadataTool, fetchReviewsTool, findCompetitorsTool },
  // Durable storage so a suspended run (awaiting the user's confirmation)
  // survives between the /start and /resume HTTP calls. Defaults to a local
  // file; point LIBSQL_URL at a hosted libSQL/Turso instance in production.
  storage: new LibSQLStore({ id: "aso-audit", url: process.env.LIBSQL_URL ?? "file:./aso-audit.db" }),
  logger: new PinoLogger({ name: "aso-audit-agent", level: "info" }),
  server: {
    apiRoutes: auditRoutes,
    cors: {
      origin: process.env.CORS_ORIGIN?.split(",") ?? ["*"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type"],
    },
  },
});
