/**
 * The Mastra server origin, resolved server-side only. In local dev both apps
 * run together (`npm run dev`) and this defaults to localhost:4111 (Mastra's
 * dev port). In production set MASTRA_SERVER_URL to the Railway/Render URL.
 */
export const MASTRA_SERVER_URL =
  process.env.MASTRA_SERVER_URL ?? "http://localhost:4111";
