import { env } from "./env.js";

/**
 * Runs OCR over the first couple of screenshots to recover the on-image text
 * Apple's search actually indexes — turning the Screenshots dimension from
 * "slot count only" into a real read of the caption copy.
 *
 * This is deliberately bounded: OCR is slow and memory-hungry, so we cap the
 * number of images and enforce a hard wall-clock budget. On timeout or any
 * failure we return null and the scorer falls back to slot-count-only. OCR is
 * on by default but can be disabled with ENABLE_OCR=false.
 */
export interface OcrResult {
  /** De-duplicated words/phrases read across the sampled screenshots. */
  text: string[];
  /** How many screenshots were successfully read. */
  imagesRead: number;
}

const MAX_IMAGES = 2;
const BUDGET_MS = 12_000;

export async function ocrScreenshots(urls: string[]): Promise<OcrResult | null> {
  if (env.ocrEnabled === false) return null;
  if (!urls.length) return null;

  const targets = urls.slice(0, MAX_IMAGES);

  try {
    return await withTimeout(runOcr(targets), BUDGET_MS);
  } catch {
    return null;
  }
}

async function runOcr(urls: string[]): Promise<OcrResult> {
  // Lazy import so the (heavy) WASM module only loads when OCR actually runs.
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const words = new Set<string>();
    let imagesRead = 0;
    for (const url of urls) {
      try {
        const { data } = await worker.recognize(url);
        const cleaned = data.text
          .split(/\s+/)
          .map((w) => w.replace(/[^\p{L}\p{N}&+%-]/gu, "").trim())
          .filter((w) => w.length >= 3);
        cleaned.forEach((w) => words.add(w));
        imagesRead += 1;
      } catch {
        /* skip a bad image */
      }
    }
    return { text: [...words].slice(0, 40), imagesRead };
  } finally {
    await worker.terminate();
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("ocr-timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}
