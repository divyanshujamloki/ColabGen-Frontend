const RETRYABLE_STATUS = new Set([502, 503, 504]);
const DEFAULT_DELAYS_MS = [2000, 5000, 10000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  delaysMs: number[] = DEFAULT_DELAYS_MS,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= delaysMs.length; attempt++) {
    try {
      const res = await fetch(input, init);
      if (!RETRYABLE_STATUS.has(res.status) || attempt === delaysMs.length) {
        return res;
      }
      await sleep(delaysMs[attempt] ?? 5000);
    } catch (err) {
      lastError = err;
      if (attempt === delaysMs.length) {
        throw err;
      }
      await sleep(delaysMs[attempt] ?? 5000);
    }
  }

  throw lastError ?? new Error("fetchWithRetry failed");
}
