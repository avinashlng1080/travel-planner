import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Touch gesture types
 */
export type TouchGesture =
  | 'tap'
  | 'doubleTap'
  | 'longPress'
  | 'swipeLeft'
  | 'swipeRight'
  | 'swipeUp'
  | 'swipeDown'
  | 'pinch'
  | 'pan'
  | 'none';

/**
 * Touch gesture configuration
 */
export interface TouchGestureConfig {
  /** Minimum distance for a swipe (default: 50px) */
  swipeThreshold?: number;
  /** Maximum time for a tap (default: 250ms) */
  tapThreshold?: number;
  /** Time for long press (default: 500ms) */
  longPressThreshold?: number;
  /** Maximum distance for a tap (default: 10px) */
  tapDistanceThreshold?: number;
  /** Enable pinch gesture detection */
  enablePinch?: boolean;
  /** Enable pan gesture detection */
  enablePan?: boolean;
}

/**
 * Touch gesture state
 */
export interface TouchGestureState {
  /** Current gesture type */
  gesture: TouchGesture;
  /** Start position of the gesture */
  startX: number;
  startY: number;
  /** Current position */
  currentX: number;
  currentY: number;
  /** Delta from start */
  deltaX: number;
  deltaY: number;
  /** Velocity */
  velocityX: number;
  velocityY: number;
  /** Distance traveled */
  distance: number;
  /** Scale for pinch (1 = no pinch) */
  scale: number;
  /** Whether gesture is active */
  isActive: boolean;
  /** Number of touches */
  touchCount: number;
}

/**
 * Touch capabilities info
 */
export interface TouchInfo {
  /** Whether device supports touch */
  isTouch: boolean;
  /** Whether device supports multi-touch */
  isMultiTouch: boolean;
  /** Maximum touch points supported */
  maxTouchPoints: number;
}

/**
 * Default gesture configuration
 */
const DEFAULT_CONFIG: Required<TouchGestureConfig> = {
  swipeThreshold: 50,
  tapThreshold: 250,
  longPressThreshold: 500,
  tapDistanceThreshold: 10,
  enablePinch: true,
  enablePan: true,
};

/**
 * Hook to detect touch capabilities
 *
 * @example
 * const { isTouch, isMultiTouch, maxTouchPoints } = useTouch();
 */
export function useTouch(): TouchInfo {
  const [touchInfo, setTouchInfo] = useState<TouchInfo>({
    isTouch: false,
    isMultiTouch: false,
    maxTouchPoints: 0,
  });

  useEffect(() => {
    const checkTouch = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const maxTouchPoints = navigator.maxTouchPoints || 0;
      const isMultiTouch = maxTouchPoints > 1;

      setTouchInfo({
        isTouch,
        isMultiTouch,
        maxTouchPoints,
      });
    };

    checkTouch();
  }, []);

  return touchInfo;
}

/**
 * Hook for touch gesture detection
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const { gesture, deltaX, isActive } = useTouchGesture(ref, {
 *   swipeThreshold: 50,
 *   enablePinch: true,
 * });
 *
 * useEffect(() => {
 *   if (gesture === 'swipeLeft') {
 *     // Handle swipe left
 *   }
 * }, [gesture]);
 */
export function useTouchGesture(
  elementRef: React.RefObject<HTMLElement | null>,
  config: TouchGestureConfig = {}
): TouchGestureState {
  const cfg = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  const [state, setState] = useState<TouchGestureState>({
    gesture: 'none',
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    velocityX: 0,
    velocityY: 0,
    distance: 0,
    scale: 1,
    isActive: false,
    touchCount: 0,
  });

  const gestureRef = useRef({
    startTime: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0,
    initialDistance: 0,
    longPressTimer: null as ReturnType<typeof setTimeout> | null,
  });

  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getCenter = useCallback((touch1: Touch, touch2: Touch) => ({
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  }), []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touches = e.touches;
    const now = Date.now();

    gestureRef.current.startTime = now;
    gestureRef.current.lastTime = now;

    if (touches.length === 1) {
      const touch = touches[0];
      gestureRef.current.lastX = touch.clientX;
      gestureRef.current.lastY = touch.clientY;

      setState(prev => ({
        ...prev,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        deltaX: 0,
        deltaY: 0,
        velocityX: 0,
        velocityY: 0,
        distance: 0,
        scale: 1,
        isActive: true,
        touchCount: 1,
        gesture: 'none',
      }));

      // Set up long press detection
      gestureRef.current.longPressTimer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          gesture: 'longPress',
        }));
      }, cfg.longPressThreshold);
    } else if (touches.length === 2 && cfg.enablePinch) {
      const distance = getDistance(touches[0], touches[1]);
      gestureRef.current.initialDistance = distance;

      const center = getCenter(touches[0], touches[1]);

      setState(prev => ({
        ...prev,
        startX: center.x,
        startY: center.y,
        currentX: center.x,
        currentY: center.y,
        isActive: true,
        touchCount: 2,
        gesture: 'pinch',
      }));
    }
  }, [cfg.enablePinch, cfg.longPressThreshold, getDistance, getCenter]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touches = e.touches;
    const now = Date.now();
    const deltaTime = now - gestureRef.current.lastTime;

    if (touches.length === 1 && cfg.enablePan) {
      const touch = touches[0];
      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Cancel long press if moved too far
      if (distance > cfg.tapDistanceThreshold && gestureRef.current.longPressTimer) {
        clearTimeout(gestureRef.current.longPressTimer);
        gestureRef.current.longPressTimer = null;
      }

      // Calculate velocity
      const velocityX = deltaTime > 0 ? (touch.clientX - gestureRef.current.lastX) / deltaTime : 0;
      const velocityY = deltaTime > 0 ? (touch.clientY - gestureRef.current.lastY) / deltaTime : 0;

      gestureRef.current.lastX = touch.clientX;
      gestureRef.current.lastY = touch.clientY;
      gestureRef.current.lastTime = now;

      setState(prev => ({
        ...prev,
        currentX: touch.clientX,
        currentY: touch.clientY,
        deltaX,
        deltaY,
        velocityX,
        velocityY,
        distance,
        gesture: distance > cfg.tapDistanceThreshold ? 'pan' : prev.gesture,
      }));
    } else if (touches.length === 2 && cfg.enablePinch) {
      const distance = getDistance(touches[0], touches[1]);
      const scale = gestureRef.current.initialDistance > 0
        ? distance / gestureRef.current.initialDistance
        : 1;

      const center = getCenter(touches[0], touches[1]);

      setState(prev => ({
        ...prev,
        currentX: center.x,
        currentY: center.y,
        scale,
      }));
    }
  }, [state.startX, state.startY, cfg.enablePan, cfg.enablePinch, cfg.tapDistanceThreshold, getDistance, getCenter]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const now = Date.now();
    const duration = now - gestureRef.current.startTime;

    // Clear long press timer
    if (gestureRef.current.longPressTimer) {
      clearTimeout(gestureRef.current.longPressTimer);
      gestureRef.current.longPressTimer = null;
    }

    if (e.touches.length === 0) {
      // All touches ended - determine gesture
      let gesture: TouchGesture = 'none';

      if (state.touchCount === 1) {
        if (duration < cfg.tapThreshold && state.distance < cfg.tapDistanceThreshold) {
          gesture = 'tap';
        } else if (state.distance >= cfg.swipeThreshold) {
          // Determine swipe direction
          const absX = Math.abs(state.deltaX);
          const absY = Math.abs(state.deltaY);

          if (absX > absY) {
            gesture = state.deltaX > 0 ? 'swipeRight' : 'swipeLeft';
          } else {
            gesture = state.deltaY > 0 ? 'swipeDown' : 'swipeUp';
          }
        }
      }

      setState(prev => ({
        ...prev,
        gesture,
        isActive: false,
        touchCount: 0,
      }));
    }
  }, [state.deltaX, state.deltaY, state.distance, state.touchCount, cfg.tapThreshold, cfg.tapDistanceThreshold, cfg.swipeThreshold]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check if touch is supported
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouch) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);

      if (gestureRef.current.longPressTimer) {
        clearTimeout(gestureRef.current.longPressTimer);
      }
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return state;
}

/**
 * Hook for swipe detection with callbacks
 *
 * @example
 * useSwipe(ref, {
 *   onSwipeLeft: () => console.log('Swiped left'),
 *   onSwipeRight: () => console.log('Swiped right'),
 *   threshold: 50,
 * });
 */
export function useSwipe(
  elementRef: React.RefObject<HTMLElement | null>,
  callbacks: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    threshold?: number;
  }
): void {
  const { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 } = callbacks;

  const gestureState = useTouchGesture(elementRef, { swipeThreshold: threshold });
  const prevGesture = useRef<TouchGesture>('none');

  useEffect(() => {
    if (gestureState.gesture !== prevGesture.current) {
      prevGesture.current = gestureState.gesture;

      switch (gestureState.gesture) {
        case 'swipeLeft':
          onSwipeLeft?.();
          break;
        case 'swipeRight':
          onSwipeRight?.();
          break;
        case 'swipeUp':
          onSwipeUp?.();
          break;
        case 'swipeDown':
          onSwipeDown?.();
          break;
      }
    }
  }, [gestureState.gesture, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);
}

export default useTouch;
