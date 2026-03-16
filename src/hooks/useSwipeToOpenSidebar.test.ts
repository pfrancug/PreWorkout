import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useSwipeToOpenSidebar } from './useSwipeToOpenSidebar';

const touch = (x: number, y: number) =>
  ({ clientX: x, clientY: y }) as unknown as Touch;

const fireTouchStart = (x: number, y: number) => {
  const event = new TouchEvent('touchstart', {
    touches: [touch(x, y)] as unknown as Touch[],
  });
  document.dispatchEvent(event);
};

const fireTouchEnd = (x: number, y: number) => {
  const event = new TouchEvent('touchend', {
    changedTouches: [touch(x, y)] as unknown as Touch[],
  });
  document.dispatchEvent(event);
};

describe('useSwipeToOpenSidebar', () => {
  it('calls onOpen when swiping right from the left edge', () => {
    const onOpen = vi.fn();
    renderHook(() => useSwipeToOpenSidebar(onOpen, true));

    fireTouchStart(10, 100); // within EDGE_WIDTH (24px)
    fireTouchEnd(80, 100); // deltaX=70 > SWIPE_THRESHOLD (50)

    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('does not call onOpen when swipe starts outside the edge zone', () => {
    const onOpen = vi.fn();
    renderHook(() => useSwipeToOpenSidebar(onOpen, true));

    fireTouchStart(50, 100); // outside EDGE_WIDTH (24px)
    fireTouchEnd(120, 100);

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('does not call onOpen when swipe distance is below threshold', () => {
    const onOpen = vi.fn();
    renderHook(() => useSwipeToOpenSidebar(onOpen, true));

    fireTouchStart(10, 100);
    fireTouchEnd(40, 100); // deltaX=30 < SWIPE_THRESHOLD (50)

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('does not call onOpen when disabled', () => {
    const onOpen = vi.fn();
    renderHook(() => useSwipeToOpenSidebar(onOpen, false));

    fireTouchStart(10, 100);
    fireTouchEnd(80, 100);

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('ignores vertical swipes (deltaY > deltaX)', () => {
    const onOpen = vi.fn();
    renderHook(() => useSwipeToOpenSidebar(onOpen, true));

    fireTouchStart(10, 100);
    fireTouchEnd(40, 250); // deltaX=30, deltaY=150 — vertical dominates

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('removes event listeners on unmount', () => {
    const onOpen = vi.fn();
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useSwipeToOpenSidebar(onOpen, true));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('touchend', expect.any(Function));

    removeSpy.mockRestore();
  });
});
