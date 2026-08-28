# ASO Audit Agent

Paste an Apple App Store URL into a chat app, confirm it's the right app, and
get back a grounded, prioritized **App Store Optimization audit** — a graded
scorecard plus an action plan with real before/after rewrites.

Built with **[Mastra](https://mastra.ai)** (agent, tools, a suspend/resume
workflow, and a skill) and a **Next.js** chat UI.

```
User pastes URL ─► fetch surface metadata ─► "Is this the app?" ─► run audit ─► rendered report
                                              (workflow suspends here)
```

---

## Quick start

```bash
pnpm install
pnpm dev
```

- Web UI → http://localhost:3000
- Mastra server + Studio → http://localhost:4111

**No API keys are required.** With zero configuration the app runs end to end:
scores are computed deterministically and the action plan is generated from a
built-in template. Adding keys (below) upgrades the prose, not the scores.

> Uses `pnpm` (workspaces). `npm install && npm run dev` also works if you
> prefer — the scripts are package-manager agnostic — but pnpm is recommended.

### Optional keys — copy `.env.example` and fill in what you have

| Key | Unlocks | Without it |
| --- | --- | --- |
| `NIM_API_KEY` | LLM-written action plan via NVIDIA NIM (free tier) | Deterministic template plan |
| `FIRECRAWL_API_KEY` | Reliable subtitle extraction | Best-effort HTML parse, else marked "not observable" |

Put `NIM_API_KEY` / `FIRECRAWL_API_KEY` in `apps/server/.env`.

---

## How it works

The design has one governing idea: **compute the audit, don't prompt-and-pray.**
Three layers, each with a single job.

### 1 · Fetch — typed, provenance-tagged data
Apple's official **iTunes Lookup API** provides the bulk of the listing
(name, developer, icon, category, description, screenshots, ratings, version).
The **RSS reviews feed** provides recent reviews for theme analysis. The
**Search API** finds category competitors.

Some fields Apple simply **does not expose** — most importantly the iOS 100-char
keyword field, and the subtitle isn't in the API. Every value carries a
`provenance` tag — `observed` (from the API), `scraped`, or `inferred` — so
nothing downstream ever mistakes a guess for ground truth.
(See `packages/shared/src/provenance.ts`.)

### 2 · Score — a deterministic engine, zero LLM
`apps/server/src/mastra/scoring/` scores all ten dimensions in plain TypeScript.
Each scorer returns `{ score, evidence, observable }` grounded in real numbers
(character utilisation, screenshot slot counts, rating trends, complaint themes).
The weighted total is reproducible and unit-tested. **The model never sets a
score.**

### 3 · Analyze — the LLM turns facts into a plan
The Mastra agent (on NIM) receives the computed scorecard + facts + the ASO
skill and produces *only* the qualitative report: the headline, tiered
recommendations with before/after rewrites, and the competitor narrative. It
can't invent numbers because the numbers already exist. When no NIM key is set,
a deterministic template produces the same output shape from the lowest-scoring,
highest-weighted dimensions.

### Beyond the brief — trust & proof features
- **Review evidence** — themes (crashes, pricing…) are mined from the *real*
  fetched reviews, and the UI lets you open any theme to read the source reviews
  verbatim. Proves the "recurring complaints" scoring isn't fabricated.
- **Measured search visibility** — for a few of the app's key terms we query
  App Store search live and report where it actually ranks (e.g. `spotify #1`,
  `music #3`, `"songs playlists"` not found). Turns the *inferred* keyword field
  into *measured* discoverability.
- **Screenshot OCR** (opt-in) — with `ENABLE_OCR=true`, tesseract.js reads the
  on-image caption text Apple OCR-indexes, making the Screenshots dimension
  fully observable. Off by default because it's slow; hard-bounded when on.
- **Export** — "Save PDF" (print-optimized) and "Copy summary" on any report.
- **Confidence badges** — every partially-observable dimension explains *why* on hover.

### Mastra primitives (all four, deliberately)
- **Tools** — `fetch-app-metadata`, `fetch-reviews`, `find-competitors` (thin
  wrappers over plain service functions, so the workflow can reuse the logic).
- **Workflow** — `aso-audit`: `resolve-listing → confirm-app (SUSPEND) → run-audit`.
  The confirmation is a real human-in-the-loop **suspend/resume**, persisted to
  libSQL so it survives between the `/start` and `/resume` HTTP calls — not a
  boolean flag threaded through the app.
- **Agent** — `aso-analyst`, the analyst that carries the tools and skill.
- **Skill** — `aso-audit`, the scoring framework + Apple field limits as
  reusable, self-contained expertise.

---

## Project structure

```
apps/
  server/                     # Mastra server (deploy to Railway/Render)
    src/mastra/
      index.ts                # Mastra instance + custom HTTP routes
      agents/aso-analyst.ts
      skills/aso-framework.ts  # the ASO methodology as a Mastra skill
      workflows/aso-audit.ts   # suspend/resume workflow
      tools/                   # fetch-app-metadata, fetch-reviews, find-competitors
      services/                # plain business logic (shared by tools + workflow)
      scoring/                 # ← the deterministic engine (10 dimensions)
      lib/                     # iTunes client, scraping, model, synthesis, report
      server/routes.ts         # POST /custom/audit/start and /resume
    scripts/
      audit-many.ts            # robustness harness over 6 diverse apps
      smoke.ts                 # single-app pipeline check
  web/                        # Next.js chat UI (deploy to Vercel)
    app/                       # page + /api proxy routes
    components/                # ScoreGauge, DimensionBars, Recommendations, …
packages/
  shared/                     # types shared across server + web (the contract)
```

---

## Testing & robustness

```bash
pnpm test          # unit tests for the scoring engine + weight normalisation
pnpm audit:many    # runs the full pipeline against 6 diverse real apps
```

`audit:many` covers a streaming app, a game, a finance app, a utility, a
language app, and a **non-US storefront**, asserting every score card is
well-formed — because the brief runs this against apps I haven't seen.

---

## Decisions I made (the brief left these to me)

1. **The brief's dimension weights sum to 110%, not 100%**
   (20+15+15+10+15+5+15+5+5+5). I kept the brief's *relative* emphasis exactly
   and normalised the total to 100 (each weight × 100/110), so the final number
   is a genuine "out of 100". Documented and tested in `scoring/weights.ts`.

2. **iTunes API over scraping.** Official, structured, and stable on unseen
   apps. Scraping (Firecrawl) is used only for the subtitle, which the API omits.

3. **Observed vs. inferred data model.** The iOS keyword field is private, so I
   reconstruct a *directional* version from the title/subtitle/description and
   label it inferred everywhere. Hallucinated ASO advice is worse than none.

4. **Deterministic scoring engine; the LLM only explains.** This makes the
   audit reproducible and defensible — and it turns NIM's smaller free-tier
   model from a liability into a non-issue, since it never touches the numbers.

5. **Real suspend/resume for the confirmation gate**, persisted to libSQL, so it
   behaves correctly across separate HTTP requests and a Vercel/Railway split.

6. **Graceful degradation to zero keys.** `npm run dev` produces a full, useful
   audit with no configuration, so it's trivial to evaluate.

7. **Deploy topology: UI on Vercel, Mastra server on Railway/Render.** A
   stateful streaming + suspend/resume server wants a persistent host; the UI
   talks to it through a server-side proxy so the backend origin stays private
   and there's no browser CORS.

---

## Deploying

**Server (Railway / Render):** deploy `apps/server`. Build `pnpm --filter
@aso/server build`, start `node .mastra/output/index.mjs`. Set `NIM_API_KEY`,
`FIRECRAWL_API_KEY`, `CORS_ORIGIN` (your Vercel URL), and `LIBSQL_URL` (a hosted
libSQL/Turso URL for durable runs). `railway.json` is included.

**Web (Vercel):** deploy `apps/web`. Set `MASTRA_SERVER_URL` to the server's URL.
`vercel.json` is included.

---

## The audit framework

Ten dimensions, weighted, scored 0–10, summed to 100:

| Dimension | Weight* | What's checked |
| --- | --- | --- |
| Title | 18.2% | Keyword presence, character utilisation, brand/keyword balance, stuffing |
| Subtitle | 13.6% | Distinct secondary keywords, benefit language, utilisation |
| Keyword field | 13.6% | *(inferred)* duplication, wasted words, utilisation |
| Description | 9.1% | Above-fold hook, benefit framing, social proof, CTA |
| Screenshots | 13.6% | Slot utilisation (visual quality deferred to analyst) |
| App preview video | 4.5% | Present or not |
| Ratings & reviews | 13.6% | Average, volume, version trend, complaint themes |
| Icon | 4.5% | Hi-res present *(distinctiveness deferred to analyst)* |
| Conversion signals | 4.5% | Promotional text, "What's New" quality |
| Competitive position | 4.5% | Rating & asset gap vs. top 3 competitors |

\* Normalised from the brief's 110% total (see decision 1).
