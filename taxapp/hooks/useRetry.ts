import { useCallback, useState } from 'react';
import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: AxiosError) => void;
}

interface RetryResult<T> {
  data: T | null;
  error: AxiosError | null;
  isRetrying: boolean;
  attemptCount: number;
}

export function useRetry<T>(options: RetryOptions = {}) {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    onRetry,
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const withRetry = useCallback(async (
    request: () => Promise<any>,
    config?: AxiosRequestConfig
  ): Promise<RetryResult<T>> => {
    let lastError: AxiosError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      setAttemptCount(attempt);

      try {
        const response = await request();
        setIsRetrying(false);
        return { data: response.data, error: null, isRetrying: false, attemptCount: attempt };
      } catch (err: any) {
        lastError = err as AxiosError;

        // Don't retry on non-network errors or if we've exhausted retries
        if (attempt === maxRetries || axios.isAxiosError(err) && err.response) {
          // Only retry on network errors (no response) or 5xx errors
          const isRetryable = !err.response || (err.response.status >= 500 && err.response.status < 600);
          if (!isRetryable || attempt === maxRetries) {
            setIsRetrying(false);
            return { data: null, error: lastError, isRetrying: false, attemptCount: attempt };
          }
        }

        onRetry?.(attempt + 1, lastError);
        setIsRetrying(true);

        // Exponential backoff with jitter
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        const jitter = Math.random() * 0.3 * delay;
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }

    setIsRetrying(false);
    return { data: null, error: lastError, isRetrying: false, attemptCount: maxRetries };
  }, [maxRetries, baseDelayMs, maxDelayMs, onRetry]);

  return { withRetry, isRetrying, attemptCount };
}

// Helper for wrapping axios calls
export async function retryAxios<T>(
  axiosPromise: Promise<any>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
  } = options;

  let lastError: AxiosError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axiosPromise;
      return response.data as T;
    } catch (err: any) {
      lastError = err as AxiosError;

      const isRetryable = axios.isAxiosError(err) && (
        !err.response || (err.response.status >= 500 && err.response.status < 600)
      );

      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }

      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      const jitter = Math.random() * 0.3 * delay;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError;
}