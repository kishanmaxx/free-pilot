export interface RetryOptions {
  timeoutMs?: number;
  maxRetries?: number;
  signal?: AbortSignal;
}

export class NetworkUtils {
  /**
   * Performs fetch with timeout and exponential backoff retry for HTTP 429 and 5xx errors
   */
  public static async fetchWithRetryAndTimeout(
    url: string,
    options: RequestInit,
    retryOpts: RetryOptions = {}
  ): Promise<Response> {
    const timeoutMs = retryOpts.timeoutMs ?? 30000;
    const maxRetries = retryOpts.maxRetries ?? 2;
    const externalSignal = retryOpts.signal;

    let attempt = 0;

    while (true) {
      if (externalSignal?.aborted) {
        throw new Error('Request aborted by user');
      }

      // Create a combined abort controller for the per-attempt timeout
      const timeoutController = new AbortController();
      const timer = setTimeout(() => {
        timeoutController.abort(new Error(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      // Link external signal if provided
      const abortListener = () => timeoutController.abort(externalSignal?.reason);
      if (externalSignal) {
        externalSignal.addEventListener('abort', abortListener, { once: true });
      }

      try {
        const response = await fetch(url, {
          ...options,
          signal: timeoutController.signal
        });

        clearTimeout(timer);
        if (externalSignal) {
          externalSignal.removeEventListener('abort', abortListener);
        }

        // Check if retryable status (429 Rate Limit, 503 Service Unavailable, 504 Gateway Timeout)
        if ((response.status === 429 || response.status === 503 || response.status === 504) && attempt < maxRetries) {
          attempt++;
          const retryAfterHeader = response.headers.get('retry-after');
          let delayMs = attempt * 1500 + Math.floor(Math.random() * 500);

          if (retryAfterHeader) {
            const parsedSeconds = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsedSeconds) && parsedSeconds > 0 && parsedSeconds < 15) {
              delayMs = parsedSeconds * 1000;
            }
          }

          console.warn(`[FreePilot Network] Hit HTTP ${response.status}. Retrying attempt ${attempt}/${maxRetries} in ${delayMs}ms...`);
          await new Promise(res => setTimeout(res, delayMs));
          continue;
        }

        return response;
      } catch (err: any) {
        clearTimeout(timer);
        if (externalSignal) {
          externalSignal.removeEventListener('abort', abortListener);
        }

        if (externalSignal?.aborted) {
          throw err;
        }

        // Retry on network drops or timeouts if attempts remain
        if (attempt < maxRetries && (this.isNetworkError(err) || err.message?.includes('timed out'))) {
          attempt++;
          const delayMs = attempt * 1200;
          console.warn(`[FreePilot Network] Network error: ${err.message}. Retrying attempt ${attempt}/${maxRetries}...`);
          await new Promise(res => setTimeout(res, delayMs));
          continue;
        }

        throw err;
      }
    }
  }

  /**
   * Checks if an error is a network connection / DNS failure
   */
  public static isNetworkError(err: any): boolean {
    if (!err) return false;
    const msg = String(err?.message || err).toLowerCase();
    return (
      msg.includes('enotfound') ||
      msg.includes('econnrefused') ||
      msg.includes('ehostunreach') ||
      msg.includes('fetch failed') ||
      msg.includes('network error') ||
      msg.includes('failed to fetch')
    );
  }

  /**
   * Fast probe to verify if local Ollama server is responding
   */
  public static async isLocalOllamaRunning(endpoint = 'http://localhost:11434'): Promise<boolean> {
    try {
      const url = `${endpoint.replace(/\/+$/, '')}/api/tags`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  }
}
