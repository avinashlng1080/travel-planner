import { createContext, useContext, type ReactNode } from 'react';

import { useDeviceType, type DeviceInfo, type DeviceCategory, type Orientation } from '../hooks/useDeviceType';

/**
 * Context for device information across the app
 */
const DeviceContext = createContext<DeviceInfo | null>(null);

interface DeviceProviderProps {
  children: ReactNode;
}

/**
 * Provider component that makes device information available to all children
 *
 * @example
 * ```tsx
 * // In your App.tsx
 * function App() {
 *   return (
 *     <DeviceProvider>
 *       <MyApp />
 *     </DeviceProvider>
 *   );
 * }
 * ```
 */
export function DeviceProvider({ children }: DeviceProviderProps) {
  const deviceInfo = useDeviceType();

  return (
    <DeviceContext.Provider value={deviceInfo}>
      {children}
    </DeviceContext.Provider>
  );
}

/**
 * Hook to access device information from context
 * Must be used within a DeviceProvider
 *
 * @throws Error if used outside of DeviceProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { category, isMobile, isTablet } = useDevice();
 *
 *   return (
 *     <div className={isMobile ? 'p-2' : 'p-6'}>
 *       Current device: {category}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDevice(): DeviceInfo {
  const context = useContext(DeviceContext);

  if (context === null) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }

  return context;
}

/**
 * Hook to get just the device category
 */
export function useDeviceCategoryFromContext(): DeviceCategory {
  const { category } = useDevice();
  return category;
}

/**
 * Hook to check if device is mobile from context
 */
export function useIsMobileFromContext(): boolean {
  const { isMobile } = useDevice();
  return isMobile;
}

/**
 * Hook to check if device is tablet from context
 */
export function useIsTabletFromContext(): boolean {
  const { isTablet } = useDevice();
  return isTablet;
}

/**
 * Hook to check if device is desktop from context
 */
export function useIsDesktopFromContext(): boolean {
  const { isDesktop } = useDevice();
  return isDesktop;
}

/**
 * Hook to get current orientation from context
 */
export function useOrientationFromContext(): Orientation {
  const { orientation } = useDevice();
  return orientation;
}

// Re-export types for convenience
export type { DeviceInfo, DeviceCategory, Orientation };
