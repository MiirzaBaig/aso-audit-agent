<div align="center">

<img src="apps/web/app/icon.svg" width="72" height="72" alt="aso audit logo" />

# aso audit

**paste an app store url, get a real app store optimization audit in seconds.**

scores computed from apple's actual data, not guessed by a model. graded scorecard, ranked action plan with real before/after rewrites, review evidence you can click into, and live search rankings.

built with [mastra](https://mastra.ai) (agent, tools, a suspend/resume workflow, and a skill) and a next.js chat ui.

**[try it live -> aso-audit-nine.vercel.app](https://aso-audit-nine.vercel.app)**

</div>

> heads up: the backend runs on a free tier that goes to sleep when it's idle, so the very first audit after a quiet spell takes ~30-50s while it wakes up. every run after that is quick. (the ui tells you this too if it happens.)

---

## the gist

you drop in an app store link. the agent pulls the surface info (name, developer, icon, category, country) and asks "is this the app you meant?". you say yes, it runs the full audit and shows you a scorecard plus a prioritized plan of what to fix.

```
paste url  ->  fetch metadata  ->  "is this the app?"  ->  run audit  ->  rendered report
                                    (workflow suspends here)
```

## quick start

```bash
pnpm install
pnpm dev
```

- web ui: http://localhost:3000
- mastra server + studio: http://localhost:4111

**no api keys needed to try it.** with zero config the app runs end to end: scores are computed in code, and the action plan comes from a built in template. add keys (below) and the plan gets written by an llm instead. either way the scores are the same, because a model never touches them.

> uses pnpm workspaces. `npm install && npm run dev` works too if you'd rather.

### optional keys

copy `.env.example` and fill in whatever you have:

| key | what it unlocks | without it |
| --- | --- | --- |
| `NIM_API_KEY` | llm writes the action plan (nvidia nim, free tier) | deterministic template plan |
| `FIRECRAWL_API_KEY` | reliable subtitle extraction | best effort html parse, else marked "not observable" |
| `ENABLE_OCR=true` | reads on-image screenshot text (or use the ui toggle) | screenshots scored by slot count only |

drop these in `apps/server/.env`.

## how it works

one idea runs through the whole thing: **compute the audit, don't prompt and pray.** three layers, each with one job.

**1. fetch (typed, provenance-tagged data)**
apple's official itunes lookup api gives most of the listing (name, developer, icon, category, description, screenshots, ratings, version). the rss reviews feed gives recent reviews. the search api finds competitors. some things apple just doesn't expose (the ios keyword field is private, the subtitle isn't in the api) so every value is tagged with where it came from: `observed`, `scraped`, or `inferred`. nothing downstream ever mistakes a guess for ground truth.

**2. score (a deterministic engine, zero llm)**
`apps/server/src/mastra/scoring/` scores all ten dimensions in plain typescript. each scorer returns `{ score, evidence, observable }` grounded in real numbers (character counts, screenshot slots, rating trends, complaint themes). the weighted total is reproducible and unit tested. the model never sets a score.

**3. analyze (llm turns facts into a plan)**
the mastra agent (on nim) gets the computed scorecard plus the facts plus the aso skill, and writes only the words: the headline, the tiered recommendations with before/after rewrites, the competitor narrative. it can't invent numbers because the numbers already exist. no nim key? a template produces the same shape.

### stuff beyond the brief

- **review evidence** - the "recurring complaints" themes are mined from the real reviews, and you can click any theme to read the actual reviews it came from. proves nothing's fabricated.
- **live search rankings** - for a few of the app's key terms, we search the app store and report where it actually ranks (like `spotify #1`, `music #3`, `"songs playlists"` not found). turns the inferred keyword field into measured discoverability.
- **screenshot ocr** (a toggle in the ui) - reads the on-image caption text apple indexes, so the screenshots dimension becomes fully scored instead of "partial". off by default because it's slower.
- **pdf export + copy summary** on any report.
- **copy-the-rewrite** - grab any suggested title/subtitle/promo text with one click.
- **confidence badges** - every partially-observable dimension tells you why on hover.

### the four mastra primitives, on purpose

- **tools** - `fetch-app-metadata`, `fetch-reviews`, `find-competitors` (thin wrappers over plain service functions, so the workflow reuses the logic).
- **workflow** - `aso-audit`: resolve listing, then suspend for the "is this the app?" confirmation, then run the audit. the pause is a real suspend/resume persisted to libsql, not a boolean flag threaded through the app.
- **agent** - `aso-analyst`, carries the tools and the skill.
- **skill** - `aso-audit`, the scoring framework and apple's field limits as reusable expertise.

## project layout

```
apps/
  server/                     # mastra server (deploys to railway)
    src/mastra/
      index.ts                # mastra instance + custom http routes
      agents/aso-analyst.ts
      skills/aso-framework.ts  # the aso methodology as a skill
      workflows/aso-audit.ts   # suspend/resume workflow
      tools/                   # fetch-app-metadata, fetch-reviews, find-competitors
      services/                # plain business logic (shared by tools + workflow)
      scoring/                 # the deterministic engine (10 dimensions)
      lib/                     # itunes client, scraping, model, synthesis, ocr, ranks
      server/routes.ts         # POST /custom/audit/start and /resume
    scripts/
      audit-many.ts            # robustness harness over 6 diverse apps
      smoke.ts                 # single-app pipeline check
  web/                        # next.js chat ui (deploys to vercel)
    app/                       # page + /api proxy routes + og image + favicon
    components/                # scoregauge, dimensionbars, recommendations, ...
packages/
  shared/                     # types shared across server + web (the contract)
```

## testing

```bash
pnpm test          # unit tests for the scoring engine + weight normalisation
pnpm audit:many    # runs the full pipeline against 6 diverse real apps
```

`audit:many` covers a streaming app, a game, a finance app, a utility, a language app, and a non-us storefront, and checks every scorecard comes out well-formed. because the whole point is it works on apps you haven't seen.

## decisions i made (the brief left these open)

1. **the brief's dimension weights add up to 110%, not 100%** (20+15+15+10+15+5+15+5+5+5). i kept the relative emphasis exactly and normalised the total to 100, so the final number is a genuine "out of 100". documented and tested in `scoring/weights.ts`.

2. **itunes api over scraping.** official, structured, doesn't break when apple reskins the page. scraping (firecrawl) is only used for the subtitle, which the api leaves out.

3. **observed vs inferred, always labelled.** the ios keyword field is private, so i reconstruct a directional version from the title/subtitle/description and mark it inferred everywhere. bad aso advice is worse than none.

4. **scores are deterministic, the llm only explains.** makes the audit reproducible and defensible, and means nim's smaller free model can't do any damage since it never touches the numbers.

5. **real suspend/resume for the confirm step**, persisted to libsql, so it behaves correctly across separate http requests and a vercel/railway split.

6. **works with zero keys.** `npm run dev` gives you a full, useful audit with no setup, so it's trivial to evaluate.

7. **ui on vercel, server on railway.** a stateful streaming + suspend/resume server wants a persistent host. the ui talks to it through a server-side proxy so the backend origin stays private and there's no browser cors.

## deploying

**server (railway):** deploy `apps/server`. build `pnpm --filter @aso/server build`, start `node .mastra/output/index.mjs`. set `NIM_API_KEY`, `FIRECRAWL_API_KEY`, `CORS_ORIGIN` (your vercel url), and `LIBSQL_URL` (a hosted libsql/turso url so suspended runs survive restarts). `railway.json` is included.

**web (vercel):** deploy `apps/web`, set root directory to `apps/web`. set `MASTRA_SERVER_URL` to the railway url. `vercel.json` is included.

## the audit framework

ten dimensions, weighted, scored 0 to 10, summed to 100:

| dimension | weight* | what it checks |
| --- | --- | --- |
| title | 18.2% | keyword present, character use, brand vs keyword, not stuffed |
| subtitle | 13.6% | distinct secondary keywords, benefit language, full use |
| keyword field | 13.6% | *(inferred)* no duplicates, no wasted words, full 100 chars |
| description | 9.1% | above-fold hook, benefit framing, social proof, cta |
| screenshots | 13.6% | slot use, and on-image text when ocr is on |
| app preview video | 4.5% | present or not |
| ratings & reviews | 13.6% | average, volume, version trend, complaint themes |
| icon | 4.5% | hi-res present, distinctiveness flagged for review |
| conversion signals | 4.5% | promotional text, "what's new" quality |
| competitive position | 4.5% | rating and asset gap vs top 3 competitors |

\* normalised from the brief's 110% total (see decision 1).
