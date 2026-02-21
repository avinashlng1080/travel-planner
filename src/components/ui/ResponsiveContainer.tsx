import { type ReactNode } from 'react';

import { useDeviceType, type DeviceCategory } from '../../hooks/useDeviceType';

interface ResponsiveContainerProps {
  children: ReactNode;
  /** Additional class names */
  className?: string;
  /** Custom padding based on device category */
  padding?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  /** Maximum width constraint */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none';
  /** Whether to center the container */
  centered?: boolean;
  /** Safe area handling for notched devices */
  safeArea?: boolean | 'top' | 'bottom' | 'all';
}

const MAX_WIDTH_CLASSES = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
  none: '',
} as const;

function getPaddingClass(category: DeviceCategory, padding?: ResponsiveContainerProps['padding']): string {
  if (!padding) {
    // Default responsive padding
    switch (category) {
      case 'mobile':
        return 'px-4 py-3';
      case 'tablet-portrait':
      case 'tablet-landscape':
        return 'px-6 py-4';
      case 'desktop':
        return 'px-8 py-6';
    }
  }

  switch (category) {
    case 'mobile':
      return padding.mobile ?? 'px-4';
    case 'tablet-portrait':
    case 'tablet-landscape':
      return padding.tablet ?? 'px-6';
    case 'desktop':
      return padding.desktop ?? 'px-8';
  }
}

function getSafeAreaClass(safeArea: ResponsiveContainerProps['safeArea']): string {
  if (!safeArea) return '';

  if (safeArea === true || safeArea === 'all') {
    return 'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]';
  }

  if (safeArea === 'top') {
    return 'pt-[env(safe-area-inset-top)]';
  }

  if (safeArea === 'bottom') {
    return 'pb-[env(safe-area-inset-bottom)]';
  }

  return '';
}

/**
 * Responsive container component that adapts padding and layout based on device type
 *
 * @example
 * ```tsx
 * // Basic usage with automatic responsive padding
 * <ResponsiveContainer>
 *   <MyContent />
 * </ResponsiveContainer>
 *
 * // Custom padding per device type
 * <ResponsiveContainer
 *   padding={{
 *     mobile: 'px-2 py-2',
 *     tablet: 'px-4 py-3',
 *     desktop: 'px-8 py-6',
 *   }}
 * >
 *   <MyContent />
 * </ResponsiveContainer>
 *
 * // With safe area support for notched devices
 * <ResponsiveContainer safeArea="bottom">
 *   <BottomNavigation />
 * </ResponsiveContainer>
 * ```
 */
export function ResponsiveContainer({
  children,
  className = '',
  padding,
  maxWidth = 'none',
  centered = false,
  safeArea = false,
}: ResponsiveContainerProps) {
  const { category } = useDeviceType();

  const paddingClass = getPaddingClass(category, padding);
  const maxWidthClass = MAX_WIDTH_CLASSES[maxWidth];
  const safeAreaClass = getSafeAreaClass(safeArea);
  const centeredClass = centered ? 'mx-auto' : '';

  return (
    <div
      className={`
        ${paddingClass}
        ${maxWidthClass}
        ${centeredClass}
        ${safeAreaClass}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
}

/**
 * Renders different content based on device category
 */
interface ResponsiveRenderProps {
  /** Content for mobile devices */
  mobile?: ReactNode;
  /** Content for tablet devices (both orientations) */
  tablet?: ReactNode;
  /** Content for tablet in portrait mode */
  tabletPortrait?: ReactNode;
  /** Content for tablet in landscape mode */
  tabletLandscape?: ReactNode;
  /** Content for desktop devices */
  desktop?: ReactNode;
  /** Fallback content if no specific content is provided */
  fallback?: ReactNode;
}

/**
 * Component that renders different content based on device type
 *
 * @example
 * ```tsx
 * <ResponsiveRender
 *   mobile={<MobileLayout />}
 *   tablet={<TabletLayout />}
 *   desktop={<DesktopLayout />}
 * />
 * ```
 */
export function ResponsiveRender({
  mobile,
  tablet,
  tabletPortrait,
  tabletLandscape,
  desktop,
  fallback = null,
}: ResponsiveRenderProps) {
  const { category } = useDeviceType();

  switch (category) {
    case 'mobile':
      return <>{mobile ?? fallback}</>;
    case 'tablet-portrait':
      return <>{tabletPortrait ?? tablet ?? fallback}</>;
    case 'tablet-landscape':
      return <>{tabletLandscape ?? tablet ?? fallback}</>;
    case 'desktop':
      return <>{desktop ?? fallback}</>;
    default:
      return <>{fallback}</>;
  }
}

/**
 * Hook-based alternative for responsive rendering
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const content = useResponsiveValue({
 *     mobile: 'Small',
 *     tablet: 'Medium',
 *     desktop: 'Large',
 *   });
 *
 *   return <span>{content}</span>;
 * }
 * ```
 */
export function useResponsiveValue<T>(values: {
  mobile?: T;
  tablet?: T;
  tabletPortrait?: T;
  tabletLandscape?: T;
  desktop?: T;
  fallback?: T;
}): T | undefined {
  const { category } = useDeviceType();

  switch (category) {
    case 'mobile':
      return values.mobile ?? values.fallback;
    case 'tablet-portrait':
      return values.tabletPortrait ?? values.tablet ?? values.fallback;
    case 'tablet-landscape':
      return values.tabletLandscape ?? values.tablet ?? values.fallback;
    case 'desktop':
      return values.desktop ?? values.fallback;
    default:
      return values.fallback;
  }
}
