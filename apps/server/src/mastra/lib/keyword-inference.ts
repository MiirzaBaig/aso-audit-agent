/**
 * The iOS 100-char keyword field is private. Rather than pretend we can read
 * it, we reconstruct a *plausible* version from the public signals Apple does
 * index — the title, subtitle, and the language of the description — and label
 * it clearly as inferred.
 *
 * This is deliberately conservative: it surfaces the salient nouns/phrases an
 * ASO practitioner would recognise, deduplicated and comma-packed the way the
 * real field would be, so the analyst can reason about coverage and gaps
 * without anyone mistaking it for the literal field.
 */

const STOPWORDS = new Set([
  "the", "and", "for", "with", "your", "you", "our", "all", "any", "app", "apps",
  "get", "now", "new", "free", "best", "top", "more", "from", "that", "this",
  "are", "can", "use", "using", "will", "into", "out", "off", "per", "via",
  "a", "an", "to", "of", "in", "on", "is", "it", "or", "by", "as", "at", "be",
  "we", "us", "my", "me", "do", "no", "up",
]);

export function inferKeywordField(
  title: string,
  subtitle: string | null,
  description: string,
): string {
  const fromTitleSub = extractPhrases(`${title} ${subtitle ?? ""}`);
  // Pull the most frequent meaningful terms from the first slice of the
  // description (where positioning language concentrates).
  const fromDesc = topTerms(description.slice(0, 600), 12);

  const seen = new Set<string>();
  const keywords: string[] = [];
  for (const term of [...fromTitleSub, ...fromDesc]) {
    const norm = term.toLowerCase().trim();
    if (!norm || STOPWORDS.has(norm) || seen.has(norm)) continue;
    seen.add(norm);
    keywords.push(norm);
    // Pack toward the real 100-char budget.
    if (keywords.join(",").length >= 100) break;
  }

  // Trim to fit exactly within 100 chars, comma-separated, no trailing comma.
  let field = "";
  for (const kw of keywords) {
    const next = field ? `${field},${kw}` : kw;
    if (next.length > 100) break;
    field = next;
  }
  return field;
}

function extractPhrases(text: string): string[] {
  return text
    .split(/[^\p{L}\p{N}]+/u)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOPWORDS.has(w.toLowerCase()));
}

function topTerms(text: string, n: number): string[] {
  const counts = new Map<string, number>();
  for (const raw of text.split(/[^\p{L}\p{N}]+/u)) {
    const w = raw.toLowerCase().trim();
    if (w.length <= 3 || STOPWORDS.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}
