import { useState, useEffect } from 'react';

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Hook to get safe area insets for mobile devices (notch, home indicator, etc.)
 * Returns inset values in pixels
 */
export function useSafeArea(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const getSafeAreaInsets = (): SafeAreaInsets => {
      if (typeof window === 'undefined') {
        return { top: 0, right: 0, bottom: 0, left: 0 };
      }

      // Get safe area insets from CSS environment variables
      const computedStyle = getComputedStyle(document.documentElement);

      const getInsetValue = (varName: string): number => {
        const value = computedStyle.getPropertyValue(varName).trim();
        return value ? parseInt(value, 10) : 0;
      };

      return {
        top: getInsetValue('env(safe-area-inset-top, 0px)') || 0,
        right: getInsetValue('env(safe-area-inset-right, 0px)') || 0,
        bottom: getInsetValue('env(safe-area-inset-bottom, 0px)') || 0,
        left: getInsetValue('env(safe-area-inset-left, 0px)') || 0,
      };
    };

    // Update insets on mount
    setInsets(getSafeAreaInsets());

    // Update on orientation change (safe areas can change)
    const handleOrientationChange = () => {
      // Small delay to ensure safe area values are updated
      setTimeout(() => {
        setInsets(getSafeAreaInsets());
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return insets;
}
