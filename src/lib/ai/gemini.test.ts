import { isRateLimitError } from '@lib/ai/gemini';
import { describe, expect, it } from 'vitest';

describe('isRateLimitError', () => {
  it('returns false for non-Error values', () => {
    expect(isRateLimitError('string')).toBe(false);
    expect(isRateLimitError(null)).toBe(false);
    expect(isRateLimitError(undefined)).toBe(false);
    expect(isRateLimitError(42)).toBe(false);
  });

  it('detects 429 status code in message', () => {
    expect(isRateLimitError(new Error('Request failed (429)'))).toBe(true);
    expect(isRateLimitError(new Error('HTTP 429'))).toBe(true);
  });

  it('detects "too many requests" message', () => {
    expect(isRateLimitError(new Error('Too Many Requests'))).toBe(true);
    expect(isRateLimitError(new Error('too many requests'))).toBe(true);
  });

  it('detects resource exhausted message', () => {
    expect(isRateLimitError(new Error('Resource has been exhausted'))).toBe(
      true,
    );
  });

  it('detects rate limit message', () => {
    expect(isRateLimitError(new Error('Rate limit exceeded'))).toBe(true);
    expect(isRateLimitError(new Error('rate limit reached'))).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isRateLimitError(new Error('Network error'))).toBe(false);
    expect(isRateLimitError(new Error('Internal server error'))).toBe(false);
    expect(isRateLimitError(new Error('Timeout'))).toBe(false);
  });
});
