import { useCallback, useEffect, useRef } from 'react';

const EDGE_WIDTH = 24; // px from left edge to start swipe
const SWIPE_THRESHOLD = 50; // minimum px to trigger open

export const useSwipeToOpenSidebar = (onOpen: () => void, enabled: boolean) => {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isTracking = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) {
        return;
      }
      const touch = e.touches[0];
      // Only track swipes starting from the left edge
      if (touch.clientX <= EDGE_WIDTH) {
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
        isTracking.current = true;
      }
    },
    [enabled],
  );

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (
      !isTracking.current ||
      touchStartX.current === null ||
      touchStartY.current === null
    ) {
      return;
    }

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);

    // If horizontal swipe dominates, prevent browser back-navigation gesture
    if (deltaX > 10 && deltaX > deltaY) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) {
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = Math.abs(touch.clientY - touchStartY.current);

      // Horizontal swipe must dominate vertical movement
      if (deltaX > SWIPE_THRESHOLD && deltaX > deltaY) {
        onOpen();
      }

      touchStartX.current = null;
      touchStartY.current = null;
      isTracking.current = false;
    },
    [onOpen],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    document.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    // touchmove must be non-passive to allow preventDefault()
    document.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);
};
