import { useState, useEffect, useCallback } from 'react';

/**
 * Device categories based on viewport width
 * - mobile: < 640px (phones)
 * - tablet-portrait: 640-1024px (tablets in portrait)
 * - tablet-landscape: 1024-1366px (tablets in landscape)
 * - desktop: > 1366px (desktops and large screens)
 */
export type DeviceCategory = 'mobile' | 'tablet-portrait' | 'tablet-landscape' | 'desktop';

export type Orientation = 'portrait' | 'landscape';

export interface DeviceInfo {
  /** Current device category based on viewport width */
  category: DeviceCategory;
  /** Current orientation */
  orientation: Orientation;
  /** Whether the device supports touch */
  hasTouch: boolean;
  /** Whether it's a mobile device (phones only) */
  isMobile: boolean;
  /** Whether it's a tablet device (portrait or landscape) */
  isTablet: boolean;
  /** Whether it's a desktop device */
  isDesktop: boolean;
  /** Viewport width in pixels */
  viewportWidth: number;
  /** Viewport height in pixels */
  viewportHeight: number;
  /** Whether device has a notch or safe area insets */
  hasSafeArea: boolean;
  /** Minimum touch target size in pixels (44px mobile, 48px touch devices) */
  minTouchTarget: number;
}

// Breakpoints aligned with Tailwind CSS
const BREAKPOINTS = {
  mobile: 640,      // < 640px
  tabletPortrait: 1024,  // 640-1024px
  tabletLandscape: 1366, // 1024-1366px
  // > 1366px is desktop
} as const;

function getDeviceCategory(width: number): DeviceCategory {
  if (width < BREAKPOINTS.mobile) {
    return 'mobile';
  }
  if (width < BREAKPOINTS.tabletPortrait) {
    return 'tablet-portrait';
  }
  if (width < BREAKPOINTS.tabletLandscape) {
    return 'tablet-landscape';
  }
  return 'desktop';
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

  // Check if CSS env() is supported with safe-area-inset values
  return CSS.supports('padding-top: env(safe-area-inset-top)');
}

function getDeviceInfo(width: number, height: number): DeviceInfo {
  const category = getDeviceCategory(width);
  const orientation = getOrientation(width, height);
  const hasTouch = detectTouchSupport();
  const hasSafeArea = detectSafeArea();

  const isMobile = category === 'mobile';
  const isTablet = category === 'tablet-portrait' || category === 'tablet-landscape';
  const isDesktop = category === 'desktop';

  // WCAG recommends minimum 44x44px touch targets
  // On touch devices, we use 48px for better usability
  const minTouchTarget = hasTouch ? 48 : 44;

  return {
    category,
    orientation,
    hasTouch,
    isMobile,
    isTablet,
    isDesktop,
    viewportWidth: width,
    viewportHeight: height,
    hasSafeArea,
    minTouchTarget,
  };
}

/**
 * Hook for comprehensive device type and orientation detection
 *
 * Provides detailed information about the current device including:
 * - Device category (mobile, tablet-portrait, tablet-landscape, desktop)
 * - Orientation (portrait, landscape)
 * - Touch support
 * - Safe area support (for notched devices)
 * - Recommended touch target sizes
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { category, isMobile, isTablet, orientation } = useDeviceType();
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

  const updateDeviceInfo = useCallback(() => {
    setDeviceInfo(getDeviceInfo(window.innerWidth, window.innerHeight));
  }, []);

  useEffect(() => {
    // Update on initial mount
    updateDeviceInfo();

    // Listen for resize events
    window.addEventListener('resize', updateDeviceInfo);

    // Listen for orientation changes (mobile Safari)
    window.addEventListener('orientationchange', updateDeviceInfo);

    // Use matchMedia for more efficient breakpoint detection
    const mediaQueries = [
      window.matchMedia(`(max-width: ${BREAKPOINTS.mobile - 1}px)`),
      window.matchMedia(`(max-width: ${BREAKPOINTS.tabletPortrait - 1}px)`),
      window.matchMedia(`(max-width: ${BREAKPOINTS.tabletLandscape - 1}px)`),
    ];

    mediaQueries.forEach(mq => {
      mq.addEventListener('change', updateDeviceInfo);
    });

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', updateDeviceInfo);
      });
    };
  }, [updateDeviceInfo]);

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

// Export breakpoints for use in CSS-in-JS or other components
export const DEVICE_BREAKPOINTS = BREAKPOINTS;
