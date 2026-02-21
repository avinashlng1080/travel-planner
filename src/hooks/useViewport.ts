import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Viewport state interface
 */
export interface ViewportState {
  /** Viewport width in pixels */
  width: number;
  /** Viewport height in pixels */
  height: number;
  /** Device pixel ratio */
  dpr: number;
  /** Viewport aspect ratio (width / height) */
  aspectRatio: number;
  /** Whether viewport is in landscape orientation */
  isLandscape: boolean;
  /** Whether viewport is in portrait orientation */
  isPortrait: boolean;
  /** Available screen width */
  screenWidth: number;
  /** Available screen height */
  screenHeight: number;
  /** Whether the viewport is considered small (mobile) */
  isSmall: boolean;
  /** Whether the viewport is considered medium (tablet) */
  isMedium: boolean;
  /** Whether the viewport is considered large (desktop) */
  isLarge: boolean;
  /** Whether the viewport is considered extra large (wide desktop) */
  isXLarge: boolean;
  /** Current zoom level (if detectable) */
  zoom: number;
}

/**
 * Viewport size categories
 */
type ViewportSize = 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Viewport options
 */
interface ViewportOptions {
  /** Breakpoint for small viewport (default: 768) */
  smallBreakpoint?: number;
  /** Breakpoint for medium viewport (default: 1024) */
  mediumBreakpoint?: number;
  /** Breakpoint for large viewport (default: 1280) */
  largeBreakpoint?: number;
  /** Whether to track zoom level (default: false) */
  trackZoom?: boolean;
  /** Debounce delay in ms (default: 100) */
  debounceDelay?: number;
}

/**
 * Hook for comprehensive viewport monitoring
 *
 * Provides real-time viewport dimensions, orientation, and size category.
 * Useful for responsive layouts that need more than CSS media queries.
 *
 * @example
 * const { width, height, isLandscape, isSmall } = useViewport();
 *
 * @example
 * const viewport = useViewport({
 *   smallBreakpoint: 640,
 *   debounceDelay: 50
 * });
 */
export function useViewport(options: ViewportOptions = {}): ViewportState {
  const {
    smallBreakpoint = 768,
    mediumBreakpoint = 1024,
    largeBreakpoint = 1280,
    trackZoom = false,
    debounceDelay = 100,
  } = options;

  const getSizeCategory = useCallback((width: number): ViewportSize => {
    if (width < smallBreakpoint) return 'small';
    if (width < mediumBreakpoint) return 'medium';
    if (width < largeBreakpoint) return 'large';
    return 'xlarge';
  }, [smallBreakpoint, mediumBreakpoint, largeBreakpoint]);

  const getZoomLevel = useCallback((): number => {
    if (!trackZoom) return 1;

    // Attempt to detect zoom level
    if (typeof window === 'undefined') return 1;

    // Method 1: Use visualViewport API if available
    if (window.visualViewport) {
      return window.visualViewport.scale;
    }

    // Method 2: Calculate from device pixel ratio and screen dimensions
    const dpr = window.devicePixelRatio || 1;
    const screenWidth = window.screen.width;
    const viewportWidth = window.innerWidth;

    if (screenWidth && viewportWidth) {
      return Math.round((screenWidth / viewportWidth) * dpr * 100) / 100;
    }

    return 1;
  }, [trackZoom]);

  const [state, setState] = useState<ViewportState>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const height = typeof window !== 'undefined' ? window.innerHeight : 768;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const sizeCategory = getSizeCategory(width);

    return {
      width,
      height,
      dpr,
      aspectRatio: width / height,
      isLandscape: width > height,
      isPortrait: width <= height,
      screenWidth: typeof window !== 'undefined' ? window.screen.width : width,
      screenHeight: typeof window !== 'undefined' ? window.screen.height : height,
      isSmall: sizeCategory === 'small',
      isMedium: sizeCategory === 'medium',
      isLarge: sizeCategory === 'large',
      isXLarge: sizeCategory === 'xlarge',
      zoom: getZoomLevel(),
    };
  });

  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout>;
    let visualViewportHandler: (() => void) | null = null;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      const sizeCategory = getSizeCategory(width);

      setState({
        width,
        height,
        dpr,
        aspectRatio: width / height,
        isLandscape: width > height,
        isPortrait: width <= height,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        isSmall: sizeCategory === 'small',
        isMedium: sizeCategory === 'medium',
        isLarge: sizeCategory === 'large',
        isXLarge: sizeCategory === 'xlarge',
        zoom: getZoomLevel(),
      });
    };

    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, debounceDelay);
    };

    // Standard resize event
    window.addEventListener('resize', debouncedResize);

    // Orientation change event
    window.addEventListener('orientationchange', handleResize);

    // Visual viewport API for better zoom detection
    if (trackZoom && window.visualViewport) {
      visualViewportHandler = () => {
        setState(prev => ({
          ...prev,
          zoom: window.visualViewport?.scale || 1,
        }));
      };
      window.visualViewport.addEventListener('resize', visualViewportHandler);
    }

    // Initial call
    handleResize();

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleResize);
      if (visualViewportHandler && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', visualViewportHandler);
      }
      clearTimeout(resizeTimer);
    };
  }, [getSizeCategory, getZoomLevel, debounceDelay, trackZoom]);

  return state;
}

/**
 * Hook to get the current aspect ratio category
 *
 * @example
 * const aspectCategory = useAspectRatio(); // 'square', 'portrait', 'landscape', 'widescreen', 'ultrawide'
 */
export function useAspectRatio(): 'square' | 'portrait' | 'landscape' | 'widescreen' | 'ultrawide' {
  const { aspectRatio } = useViewport();

  return useMemo(() => {
    if (aspectRatio >= 2.3) return 'ultrawide';
    if (aspectRatio >= 1.7) return 'widescreen';
    if (aspectRatio >= 1.2) return 'landscape';
    if (aspectRatio >= 0.9) return 'square';
    return 'portrait';
  }, [aspectRatio]);
}

/**
 * Hook to detect if the viewport is in a specific size range
 *
 * @example
 * const isTabletRange = useViewportRange(768, 1024);
 */
export function useViewportRange(minWidth: number, maxWidth: number): boolean {
  const { width } = useViewport();
  return useMemo(() => width >= minWidth && width < maxWidth, [width, minWidth, maxWidth]);
}

/**
 * Hook to get responsive values based on viewport size
 * Similar to useResponsiveValue but based on viewport instead of device type
 *
 * @example
 * const padding = useViewportValue({
 *   small: 16,
 *   medium: 24,
 *   large: 32,
 *   xlarge: 48,
 *   default: 16,
 * });
 */
export function useViewportValue<T>(values: {
  small?: T;
  medium?: T;
  large?: T;
  xlarge?: T;
  default: T;
}): T {
  const { isSmall, isMedium, isLarge, isXLarge } = useViewport();

  return useMemo(() => {
    if (isSmall) return values.small ?? values.default;
    if (isMedium) return values.medium ?? values.small ?? values.default;
    if (isLarge) return values.large ?? values.medium ?? values.small ?? values.default;
    if (isXLarge) return values.xlarge ?? values.large ?? values.medium ?? values.small ?? values.default;
    return values.default;
  }, [isSmall, isMedium, isLarge, isXLarge, values]);
}

export default useViewport;
