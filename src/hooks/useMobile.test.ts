import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useIsMobile } from './useMobile';

describe('useIsMobile', () => {
  let listeners: Array<() => void>;
  let originalInnerWidth: number;

  beforeEach(() => {
    listeners = [];
    originalInnerWidth = window.innerWidth;

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        addEventListener: (_: string, cb: () => void) => {
          listeners.push(cb);
        },
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  const setWidth = (w: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: w,
    });
  };

  it('returns true when window width is below 1024', () => {
    setWidth(768);
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('returns false when window width is 1024 or above', () => {
    setWidth(1024);
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it('updates when matchMedia fires a change event', () => {
    setWidth(1200);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate resize to mobile
    setWidth(500);
    act(() => {
      listeners.forEach((cb) => cb());
    });

    expect(result.current).toBe(true);
  });

  it('returns false at the boundary (1024)', () => {
    setWidth(1023);
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });
});
