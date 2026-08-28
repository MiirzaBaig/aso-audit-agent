/**
 * A tiny resilient fetch wrapper: timeout + bounded retries with backoff.
 *
 * Apple's public endpoints occasionally rate-limit or hang, and we run against
 * arbitrary apps we've never seen. A single flaky request shouldn't sink an
 * audit, so every outbound call goes through here.
 */

export interface FetchJsonOptions {
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchJson<T>(
  url: string,
  { timeoutMs = 10_000, retries = 2, headers = {} }: FetchJsonOptions = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json", ...headers },
      });
      if (!res.ok) {
        // 4xx (except 429) won't get better on retry — fail fast.
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          throw new HttpError(`Request to ${url} failed`, res.status);
        }
        throw new HttpError(`Request to ${url} failed`, res.status);
      }
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      if (err instanceof HttpError && err.status >= 400 && err.status < 500 && err.status !== 429) {
        throw err;
      }
      if (attempt < retries) await sleep(300 * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Request to ${url} failed after ${retries + 1} attempts`);
}

export async function fetchText(
  url: string,
  { timeoutMs = 10_000, retries = 1, headers = {} }: FetchJsonOptions = {},
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
          ...headers,
        },
      });
      if (!res.ok) throw new HttpError(`Request to ${url} failed`, res.status);
      return await res.text();
    } catch (err) {
      lastError = err;
      if (attempt < retries) await sleep(300 * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Request to ${url} failed`);
}
