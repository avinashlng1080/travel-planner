import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Breakpoint definitions following Tailwind CSS defaults with additions
 * - xs: 475px (small phones)
 * - sm: 640px (large phones)
 * - md: 768px (tablets)
 * - lg: 1024px (small laptops)
 * - xl: 1280px (desktops)
 * - 2xl: 1536px (large desktops)
 * - 3xl: 1920px (ultra-wide)
 */
export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Device categories for semantic responsive design
 */
export type DeviceCategory = 'mobile' | 'tablet-portrait' | 'tablet-landscape' | 'desktop';

/**
 * Device type for simplified categorization
 */
export type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'wide';

/**
 * Orientation type
 */
export type Orientation = 'portrait' | 'landscape';

/**
 * Complete device information
 */
export interface DeviceInfo {
  /** Current device category based on viewport width */
  category: DeviceCategory;
  /** Device type for simplified categorization */
  deviceType: DeviceType;
  /** Current orientation */
  orientation: Orientation;
  /** Current breakpoint name */
  breakpoint: Breakpoint;
  /** Whether the device supports touch */
  hasTouch: boolean;
  /** Whether it's a mobile device (phones only) */
  isMobile: boolean;
  /** Whether it's a tablet device (portrait or landscape) */
  isTablet: boolean;
  /** Whether it's a desktop device */
  isDesktop: boolean;
  /** Whether it's a laptop device */
  isLaptop: boolean;
  /** Whether it's a wide desktop */
  isWide: boolean;
  /** Boolean flags for each breakpoint (true if viewport >= breakpoint) */
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  is3xl: boolean;
  /** Viewport width in pixels */
  viewportWidth: number;
  /** Viewport height in pixels */
  viewportHeight: number;
  /** Whether device has a notch or safe area insets */
  hasSafeArea: boolean;
  /** Minimum touch target size in pixels (44px mobile, 48px touch devices) */
  minTouchTarget: number;
  /** Reduced motion preference */
  prefersReducedMotion: boolean;
  /** Dark mode preference */
  prefersDarkMode: boolean;
}

/**
 * Get device category from width (original 4-category system)
 */
function getDeviceCategory(width: number): DeviceCategory {
  if (width < BREAKPOINTS.sm) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet-portrait';
  if (width < BREAKPOINTS['2xl']) return 'tablet-landscape';
  return 'desktop';
}

/**
 * Get device type from width (simplified 5-type system)
 */
function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.sm) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet';
  if (width < BREAKPOINTS.xl) return 'laptop';
  if (width < BREAKPOINTS['2xl']) return 'desktop';
  return 'wide';
}

/**
 * Get current breakpoint from width
 */
function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS['3xl']) return '3xl';
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

function getOrientation(width: number, height: number): Orientation {
  return width >= height ? 'landscape' : 'portrait';
}

function detectTouchSupport(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  );
}

function detectSafeArea(): boolean {
  if (typeof window === 'undefined' || typeof CSS === 'undefined') return false;
  return CSS.supports('padding-top: env(safe-area-inset-top)');
}

function getDeviceInfo(width: number, height: number): DeviceInfo {
  const category = getDeviceCategory(width);
  const deviceType = getDeviceType(width);
  const breakpoint = getBreakpoint(width);
  const orientation = getOrientation(width, height);
  const hasTouch = detectTouchSupport();
  const hasSafeArea = detectSafeArea();

  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isLaptop = deviceType === 'laptop';
  const isDesktop = deviceType === 'desktop' || deviceType === 'wide';
  const isWide = deviceType === 'wide';

  // WCAG recommends minimum 44x44px touch targets
  // On touch devices, we use 48px for better usability
  const minTouchTarget = hasTouch ? 48 : 44;

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const prefersDarkMode = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;

  return {
    category,
    deviceType,
    orientation,
    breakpoint,
    hasTouch,
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,
    isWide,
    isXs: width >= BREAKPOINTS.xs,
    isSm: width >= BREAKPOINTS.sm,
    isMd: width >= BREAKPOINTS.md,
    isLg: width >= BREAKPOINTS.lg,
    isXl: width >= BREAKPOINTS.xl,
    is2xl: width >= BREAKPOINTS['2xl'],
    is3xl: width >= BREAKPOINTS['3xl'],
    viewportWidth: width,
    viewportHeight: height,
    hasSafeArea,
    minTouchTarget,
    prefersReducedMotion,
    prefersDarkMode,
  };
}

/**
 * Hook for comprehensive device type and orientation detection
 *
 * Provides detailed information about the current device including:
 * - Device category (mobile, tablet-portrait, tablet-landscape, desktop)
 * - Device type (mobile, tablet, laptop, desktop, wide)
 * - Breakpoint (xs, sm, md, lg, xl, 2xl, 3xl)
 * - Orientation (portrait, landscape)
 * - Touch support
 * - Safe area support (for notched devices)
 * - Recommended touch target sizes
 * - User preferences (reduced motion, dark mode)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { category, isMobile, isTablet, orientation, breakpoint } = useDeviceType();
 *
 *   if (isMobile) {
 *     return <MobileLayout />;
 *   }
 *
 *   if (isTablet) {
 *     return <TabletLayout orientation={orientation} />;
 *   }
 *
 *   return <DesktopLayout />;
 * }
 * ```
 */
export function useDeviceType(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      // SSR fallback - assume desktop
      return getDeviceInfo(1920, 1080);
    }
    return getDeviceInfo(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setDeviceInfo(getDeviceInfo(window.innerWidth, window.innerHeight));
      }, 100);
    };

    // Update on initial mount
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);

    // Listen for orientation changes (mobile Safari)
    window.addEventListener('orientationchange', handleResize);

    // Listen for media query changes
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleMediaChange = () => {
      setDeviceInfo(getDeviceInfo(window.innerWidth, window.innerHeight));
    };

    motionMediaQuery.addEventListener('change', handleMediaChange);
    darkModeMediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      motionMediaQuery.removeEventListener('change', handleMediaChange);
      darkModeMediaQuery.removeEventListener('change', handleMediaChange);
      clearTimeout(resizeTimer);
    };
  }, []);

  return deviceInfo;
}

/**
 * Simplified hook that returns just the device category
 * Useful when you only need the category without full device info
 */
export function useDeviceCategory(): DeviceCategory {
  const { category } = useDeviceType();
  return category;
}

/**
 * Hook to check if the current device is touch-capable
 */
export function useHasTouch(): boolean {
  const { hasTouch } = useDeviceType();
  return hasTouch;
}

/**
 * Hook to check if viewport matches a specific media query
 *
 * @example
 * const isMdAndUp = useMediaQuery('(min-width: 768px)');
 * const isMobile = useMediaQuery('(max-width: 767px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Hook for responsive values based on device type
 * Returns the appropriate value for the current device
 *
 * @example
 * const columns = useResponsiveValue({
 *   mobile: 1,
 *   tablet: 2,
 *   laptop: 3,
 *   desktop: 4,
 *   default: 2,
 * });
 */
export function useResponsiveValue<T>(values: {
  mobile?: T;
  tablet?: T;
  laptop?: T;
  desktop?: T;
  wide?: T;
  default: T;
}): T {
  const { deviceType } = useDeviceType();

  return useMemo(() => {
    switch (deviceType) {
      case 'mobile':
        return values.mobile ?? values.default;
      case 'tablet':
        return values.tablet ?? values.mobile ?? values.default;
      case 'laptop':
        return values.laptop ?? values.tablet ?? values.mobile ?? values.default;
      case 'desktop':
        return values.desktop ?? values.laptop ?? values.tablet ?? values.mobile ?? values.default;
      case 'wide':
        return values.wide ?? values.desktop ?? values.laptop ?? values.tablet ?? values.mobile ?? values.default;
      default:
        return values.default;
    }
  }, [deviceType, values]);
}

/**
 * Hook for responsive spacing calculation
 * Scales spacing values based on device type
 *
 * @example
 * const padding = useResponsiveSpacing({ mobile: 16, tablet: 24, desktop: 32, default: 16 });
 */
export function useResponsiveSpacing(spacing: {
  mobile?: number;
  tablet?: number;
  laptop?: number;
  desktop?: number;
  wide?: number;
  default: number;
}): number {
  return useResponsiveValue(spacing);
}

// Export breakpoints for use in CSS-in-JS or other components
export const DEVICE_BREAKPOINTS = BREAKPOINTS;

// Alias for backward compatibility
export { useDeviceType as useBreakpoint };
