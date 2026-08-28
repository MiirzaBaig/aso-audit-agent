import type {
  AnalystOutput,
  AppListing,
  Competitor,
  DimensionId,
  Recommendation,
  ScoreCard,
} from "@aso/shared";
import { NORMALISED_WEIGHTS } from "../scoring/weights.js";

/**
 * A deterministic, evidence-grounded report generated without any LLM.
 *
 * This is the zero-key fallback — but it's built to be genuinely useful, not a
 * placeholder. It targets the highest-weighted, lowest-scoring dimensions
 * (where the overall score moves most) and emits concrete before/after text
 * changes derived from the actual listing. A reviewer with no NIM key still
 * sees a real audit.
 */
export function buildTemplateAnalysis(
  listing: AppListing,
  scoreCard: ScoreCard,
  competitors: Competitor[],
): AnalystOutput {
  const byId = new Map(scoreCard.dimensions.map((d) => [d.id, d]));
  const score = (id: DimensionId) => byId.get(id)?.score ?? 0;

  const recs: Recommendation[] = [];
  const add = (r: Recommendation) => recs.push(r);

  // --- Title ---
  const titleLen = listing.title.length;
  if (score("title") < 8 && titleLen < 30) {
    const room = 30 - titleLen;
    add({
      tier: "quick-win",
      dimension: "title",
      title: "Add a high-value keyword to the title",
      rationale: `The title uses only ${titleLen}/30 characters, leaving ~${room} unused. The title carries Apple's heaviest keyword weight, so unused space is unranked space.`,
      evidence: `Title "${listing.title}" — ${titleLen}/30 chars.`,
      before: listing.title,
      after: suggestTitle(listing),
    });
  }

  // --- Subtitle ---
  if (!listing.subtitle.value) {
    add({
      tier: "quick-win",
      dimension: "subtitle",
      title: "Add a subtitle — it's a free 30-char keyword slot",
      rationale:
        "No subtitle was found. The subtitle is the second-heaviest ranking field and adds distinct keywords plus a benefit line at zero cost.",
      evidence: "Subtitle: not present / not observable.",
      before: "(none)",
      after: suggestSubtitle(listing),
    });
  } else if (score("subtitle") < 7) {
    add({
      tier: "high-impact",
      dimension: "subtitle",
      title: "Rewrite the subtitle to add distinct keywords",
      rationale: `The current subtitle underuses its 30 chars or repeats the title. Make every character a net-new keyword or a benefit.`,
      evidence: `Subtitle "${listing.subtitle.value}" — ${listing.subtitle.value.length}/30 chars.`,
      before: listing.subtitle.value,
      after: suggestSubtitle(listing),
    });
  }

  // --- Keywords (inferred) ---
  add({
    tier: "high-impact",
    dimension: "keywords",
    title: "Audit and rebuild the 100-char keyword field",
    rationale:
      "The keyword field is private, so this is directional: based on the title/subtitle, ensure the field holds net-new terms (no title duplicates), singular forms, no spaces after commas, and no wasted words like \"app\" or \"free\".",
    evidence: `Inferred keyword signal: "${listing.keywordField.value ?? "(sparse)"}".`,
    before: listing.keywordField.value ?? "(unknown — inferred)",
    after: suggestKeywords(listing),
  });

  // --- Screenshots ---
  const shots = listing.screenshotUrls.length;
  if (shots < 10) {
    add({
      tier: shots < 3 ? "quick-win" : "high-impact",
      dimension: "screenshots",
      title: `Fill the remaining ${10 - shots} screenshot slots`,
      rationale: `Only ${shots}/10 slots are used. The first 1–3 show on the search card and their on-image text is OCR-indexed, so each empty slot is lost conversion and lost keyword surface.`,
      evidence: `${shots}/10 screenshots present.`,
      before: `${shots} screenshots`,
      after: `10 screenshots; captions on the first 3 leading with the core benefit and a top keyword`,
    });
  }

  // --- Video ---
  if (!listing.hasAppPreviewVideo) {
    add({
      tier: "strategic",
      dimension: "video",
      title: "Add an app preview video",
      rationale:
        "No preview video was detected. A 15–30s muted-friendly video with the hook in the first 3 seconds lifts conversion and most competitors skip it.",
      evidence: "App preview video: none detected.",
      before: "No video",
      after: "15–30s preview; hook in first 3s; readable without sound",
    });
  }

  // --- Reviews ---
  const complaint = firstComplaintTheme(byId.get("reviews")?.evidence ?? []);
  if (listing.averageRating > 0 && listing.averageRating < 4.5) {
    add({
      tier: "strategic",
      dimension: "reviews",
      title: "Close the rating gap with a prompt + response loop",
      rationale: `At ${listing.averageRating.toFixed(1)}★, the listing trails the ~4.5★ bar buyers expect.${complaint ? ` Recent negatives cluster on "${complaint}" — fixing that and replying to reviewers recovers sentiment.` : ""} Trigger the rating prompt after a success moment.`,
      evidence: `Average ${listing.averageRating.toFixed(1)}★ across ${listing.ratingCount.toLocaleString()} ratings.`,
      before: null,
      after: null,
    });
  }

  // --- Conversion ---
  if (!listing.promotionalText.value) {
    add({
      tier: "quick-win",
      dimension: "conversion",
      title: "Use promotional text",
      rationale:
        "Promotional text (170 chars) is the only listing copy you can change without shipping a build — ideal for launches, events, and seasonal hooks. It appears empty.",
      evidence: "Promotional text: not detected.",
      before: "(empty)",
      after: `New: ${listing.name} just got faster — try the redesigned experience today.`.slice(0, 170),
    });
  }
  if (score("conversion") < 6 && listing.releaseNotes && /bug fix|minor|improvement/i.test(listing.releaseNotes)) {
    add({
      tier: "quick-win",
      dimension: "conversion",
      title: 'Make "What\'s New" specific',
      rationale:
        'Generic release notes ("bug fixes and improvements") waste a visible slot and signal a stale listing. Name the actual improvement.',
      evidence: `Current notes: "${listing.releaseNotes.slice(0, 60)}".`,
      before: listing.releaseNotes.slice(0, 80),
      after: "New: [headline feature]. Faster [core action]. Fixed [named issue] some of you reported.",
    });
  }

  // --- Description ---
  if (score("description") < 7) {
    add({
      tier: "high-impact",
      dimension: "description",
      title: "Rewrite the first 3 lines to hook above the fold",
      rationale:
        "Only the first ~3 lines show before the \"more\" cutoff. Lead with the core benefit in the reader's words, then social proof, then a CTA.",
      evidence: `Opening: "${listing.description.slice(0, 90).replace(/\n/g, " ")}…"`,
      before: listing.description.slice(0, 120).replace(/\n/g, " "),
      after: `${benefitLine(listing)} Trusted by thousands. Download ${listing.name} to get started free.`,
    });
  }

  // --- Competitive ---
  if (competitors.length) {
    const medianRating =
      [...competitors.map((c) => c.averageRating)].sort((a, b) => a - b)[
        Math.floor(competitors.length / 2)
      ] ?? 0;
    add({
      tier: "strategic",
      dimension: "competitive",
      title: "Match the category's asset and rating bar",
      rationale: `Top competitors in ${listing.primaryCategory} sit around ${medianRating.toFixed(1)}★ with fuller galleries. Close the largest single gap first.`,
      evidence: `Competitors: ${competitors.map((c) => `${c.name} (${c.averageRating.toFixed(1)}★)`).join(", ")}.`,
      before: null,
      after: null,
    });
  }

  // Guarantee the schema's 9–15 range by topping up with the lowest dimensions.
  ensureMinimum(recs, scoreCard, add);

  return {
    headline: headline(scoreCard, listing),
    recommendations: recs.slice(0, 15),
    competitorNarrative: competitorNarrative(listing, competitors),
  };
}

// ---------- helpers ----------

function suggestTitle(listing: AppListing): string {
  const base = listing.name.split(/[-–—:|]/)[0]!.trim();
  const kw = topKeyword(listing);
  const candidate = `${base} — ${capitalize(kw)}`;
  return candidate.length <= 30 ? candidate : base.slice(0, 30);
}

function suggestSubtitle(listing: AppListing): string {
  const kw = topKeyword(listing);
  const benefit = `Fast ${kw} you'll love`;
  return benefit.slice(0, 30);
}

function suggestKeywords(listing: AppListing): string {
  // Remove terms already in the title/subtitle (Apple indexes those once) and
  // any wasted words, then pack toward the 100-char budget — a concrete "after"
  // distinct from the raw inferred "before".
  const titleSub = new Set(
    `${listing.title} ${listing.subtitle.value ?? ""}`
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean),
  );
  const wasted = new Set(["app", "free", "best", "top", "the", "and"]);
  const cleaned: string[] = [];
  for (const raw of (listing.keywordField.value ?? "").split(",")) {
    const t = raw.trim().toLowerCase();
    if (!t || titleSub.has(t) || wasted.has(t) || cleaned.includes(t)) continue;
    const next = [...cleaned, t].join(",");
    if (next.length > 100) break;
    cleaned.push(t);
  }
  return cleaned.join(",") || topKeyword(listing);
}

function benefitLine(listing: AppListing): string {
  const kw = topKeyword(listing);
  return `Get ${kw} done in seconds with ${listing.name}.`;
}

function topKeyword(listing: AppListing): string {
  const words = `${listing.subtitle.value ?? ""} ${listing.keywordField.value ?? ""} ${listing.primaryCategory}`
    .split(/[^\p{L}\p{N}]+/u)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 3);
  return words[0] ?? listing.primaryCategory.toLowerCase();
}

function firstComplaintTheme(evidence: string[]): string | null {
  const line = evidence.find((e) => /complaint themes/i.test(e));
  const m = line?.match(/themes[^:]*:\s*([^.]+)/i);
  return m?.[1]?.split(",")[0]?.trim() ?? null;
}

function headline(scoreCard: ScoreCard, listing: AppListing): string {
  const weakest = [...scoreCard.dimensions]
    .filter((d) => d.score < 6)
    .sort(
      (a, b) =>
        NORMALISED_WEIGHTS[b.id] * (10 - b.score) - NORMALISED_WEIGHTS[a.id] * (10 - a.score),
    )[0];
  const band =
    scoreCard.overall >= 70 ? "solid" : scoreCard.overall >= 50 ? "middling" : "underperforming";
  return `${listing.name} scores ${scoreCard.overall}/100 — a ${band} listing whose biggest lever is ${weakest ? weakest.label.toLowerCase() : "keyword coverage"}.`;
}

function competitorNarrative(listing: AppListing, competitors: Competitor[]): string {
  if (!competitors.length) {
    return "No comparable competitors could be identified in this storefront, so the comparison is omitted.";
  }
  const ratings = competitors.map((c) => c.averageRating).filter((r) => r > 0);
  const avgComp = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const ratingWord =
    listing.averageRating >= avgComp ? "ahead of" : "behind";
  const medianShots =
    [...competitors.map((c) => c.screenshotCount)].sort((a, b) => a - b)[
      Math.floor(competitors.length / 2)
    ] ?? 0;
  return `Against ${competitors.map((c) => c.name).join(", ")}, ${listing.name} sits ${ratingWord} on rating (${listing.averageRating.toFixed(1)}★ vs. ~${avgComp.toFixed(1)}★ average) and uses ${listing.screenshotUrls.length} screenshots versus a competitor median of ${medianShots}. The fastest way to close the gap is to bring the weakest observable asset up to the category norm.`;
}

function ensureMinimum(
  recs: Recommendation[],
  scoreCard: ScoreCard,
  add: (r: Recommendation) => void,
): void {
  const covered = new Set(recs.map((r) => r.dimension));
  const candidates = [...scoreCard.dimensions]
    .filter((d) => !covered.has(d.id))
    .sort((a, b) => a.score - b.score);
  for (const d of candidates) {
    if (recs.length >= 9) break;
    add({
      tier: "strategic",
      dimension: d.id,
      title: `Improve ${d.label.toLowerCase()}`,
      rationale: `${d.label} scores ${d.score}/10. ${d.evidence[0] ?? ""}`,
      evidence: d.evidence[0] ?? `${d.label}: ${d.score}/10.`,
      before: null,
      after: null,
    });
  }
}

const capitalize = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
