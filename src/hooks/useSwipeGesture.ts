import { useRef, useEffect, type RefObject } from 'react';

export interface SwipeGestureOptions {
  onSwipeDown?: () => void;
  onSwipeUp?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // Minimum distance in pixels to register as swipe
  restraint?: number; // Maximum perpendicular deviation in pixels
  allowedTime?: number; // Maximum time in milliseconds for swipe
  elementRef?: RefObject<HTMLElement>; // Optional: limit to specific element
}

interface TouchStart {
  x: number;
  y: number;
  time: number;
}

/**
 * Hook to detect swipe gestures on touch devices
 * Supports swipe up, down, left, and right with configurable thresholds
 *
 * @param options - Configuration for swipe detection and callbacks
 */
export function useSwipeGesture(options: SwipeGestureOptions): void {
  const {
    onSwipeDown,
    onSwipeUp,
    onSwipeLeft,
    onSwipeRight,
    threshold = 150, // Minimum swipe distance
    restraint = 100, // Maximum perpendicular deviation
    allowedTime = 300, // Maximum swipe time
    elementRef,
  } = options;

  const touchStartRef = useRef<TouchStart | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      touchStartRef.current = {
        x: touch.pageX,
        y: touch.pageY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) {return;}

      const touch = e.changedTouches[0];
      const distX = touch.pageX - touchStartRef.current.x;
      const distY = touch.pageY - touchStartRef.current.y;
      const elapsedTime = Date.now() - touchStartRef.current.time;

      // Check if swipe meets time criteria
      if (elapsedTime <= allowedTime) {
        // Vertical swipe (up or down)
        if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) {
          if (distY < 0 && onSwipeUp) {
            // Swipe up (negative Y)
            e.preventDefault();
            onSwipeUp();
          } else if (distY > 0 && onSwipeDown) {
            // Swipe down (positive Y)
            e.preventDefault();
            onSwipeDown();
          }
        }
        // Horizontal swipe (left or right)
        else if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
          if (distX < 0 && onSwipeLeft) {
            // Swipe left (negative X)
            e.preventDefault();
            onSwipeLeft();
          } else if (distX > 0 && onSwipeRight) {
            // Swipe right (positive X)
            e.preventDefault();
            onSwipeRight();
          }
        }
      }

      touchStartRef.current = null;
    };

    const target = elementRef?.current || document;

    target.addEventListener('touchstart', handleTouchStart, { passive: true });
    target.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    onSwipeDown,
    onSwipeUp,
    onSwipeLeft,
    onSwipeRight,
    threshold,
    restraint,
    allowedTime,
    elementRef,
  ]);
}
