import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Container query state
 */
export interface ContainerQueryState {
  /** Container width */
  width: number;
  /** Container height */
  height: number;
  /** Container aspect ratio */
  aspectRatio: number;
  /** Size category based on container width */
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether container is considered small */
  isSmall: boolean;
  /** Whether container is considered medium */
  isMedium: boolean;
  /** Whether container is considered large */
  isLarge: boolean;
  /** Whether container is considered extra large */
  isXLarge: boolean;
}

/**
 * Container query breakpoints
 */
interface ContainerBreakpoints {
  /** Extra small breakpoint (default: 240) */
  xs?: number;
  /** Small breakpoint (default: 360) */
  sm?: number;
  /** Medium breakpoint (default: 480) */
  md?: number;
  /** Large breakpoint (default: 640) */
  lg?: number;
  /** Extra large breakpoint (default: 800) */
  xl?: number;
}

/**
 * Options for useContainerQuery
 */
interface ContainerQueryOptions {
  /** Custom breakpoints */
  breakpoints?: ContainerBreakpoints;
  /** Debounce delay in ms (default: 100) */
  debounceDelay?: number;
  /** Whether to observe changes (default: true) */
  observe?: boolean;
}

const DEFAULT_BREAKPOINTS: Required<ContainerBreakpoints> = {
  xs: 240,
  sm: 360,
  md: 480,
  lg: 640,
  xl: 800,
};

/**
 * Hook for container queries using ResizeObserver
 *
 * Allows components to respond to their container's size rather than viewport size.
 * This is useful for reusable components that need to adapt to their parent container.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const { width, size, isSmall } = useContainerQuery(ref);
 *
 * return (
 *   <div ref={ref} className={isSmall ? 'flex-col' : 'flex-row'}>
 *     ...
 *   </div>
 * );
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const container = useContainerQuery(ref, {
 *   breakpoints: { sm: 300, md: 500, lg: 700 },
 *   debounceDelay: 50,
 * });
 */
export function useContainerQuery(
  elementRef: React.RefObject<HTMLElement | null>,
  options: ContainerQueryOptions = {}
): ContainerQueryState {
  const {
    breakpoints = {},
    debounceDelay = 100,
    observe = true,
  } = options;

  const mergedBreakpoints = useMemo(() => ({
    ...DEFAULT_BREAKPOINTS,
    ...breakpoints,
  }), [breakpoints]);

  const getSizeCategory = useCallback((width: number): ContainerQueryState['size'] => {
    if (width >= mergedBreakpoints.xl) return 'xl';
    if (width >= mergedBreakpoints.lg) return 'lg';
    if (width >= mergedBreakpoints.md) return 'md';
    if (width >= mergedBreakpoints.sm) return 'sm';
    return 'xs';
  }, [mergedBreakpoints]);

  const [state, setState] = useState<ContainerQueryState>({
    width: 0,
    height: 0,
    aspectRatio: 1,
    size: 'xs',
    isSmall: true,
    isMedium: false,
    isLarge: false,
    isXLarge: false,
  });

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !observe) return;

    // Check if ResizeObserver is supported
    if (typeof ResizeObserver === 'undefined') {
      // Fallback to initial measurement
      const rect = element.getBoundingClientRect();
      const size = getSizeCategory(rect.width);
      setState({
        width: rect.width,
        height: rect.height,
        aspectRatio: rect.width / rect.height || 1,
        size,
        isSmall: size === 'xs' || size === 'sm',
        isMedium: size === 'md',
        isLarge: size === 'lg',
        isXLarge: size === 'xl',
      });
      return;
    }

    let resizeTimer: ReturnType<typeof setTimeout>;

    const resizeObserver = new ResizeObserver((entries) => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          const size = getSizeCategory(width);

          setState({
            width,
            height,
            aspectRatio: width / height || 1,
            size,
            isSmall: size === 'xs' || size === 'sm',
            isMedium: size === 'md',
            isLarge: size === 'lg',
            isXLarge: size === 'xl',
          });
        }
      }, debounceDelay);
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(resizeTimer);
    };
  }, [elementRef, getSizeCategory, debounceDelay, observe]);

  return state;
}

/**
 * Hook for multiple container queries
 * Useful when you need to observe multiple elements
 *
 * @example
 * const refs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
 * const containers = useContainerQueries(refs);
 */
export function useContainerQueries(
  elementRefs: React.RefObject<HTMLElement | null>[],
  options: ContainerQueryOptions = {}
): ContainerQueryState[] {
  const {
    breakpoints = {},
    debounceDelay = 100,
    observe = true,
  } = options;

  const mergedBreakpoints = useMemo(() => ({
    ...DEFAULT_BREAKPOINTS,
    ...breakpoints,
  }), [breakpoints]);

  const getSizeCategory = useCallback((width: number): ContainerQueryState['size'] => {
    if (width >= mergedBreakpoints.xl) return 'xl';
    if (width >= mergedBreakpoints.lg) return 'lg';
    if (width >= mergedBreakpoints.md) return 'md';
    if (width >= mergedBreakpoints.sm) return 'sm';
    return 'xs';
  }, [mergedBreakpoints]);

  const [states, setStates] = useState<ContainerQueryState[]>(() =>
    elementRefs.map(() => ({
      width: 0,
      height: 0,
      aspectRatio: 1,
      size: 'xs',
      isSmall: true,
      isMedium: false,
      isLarge: false,
      isXLarge: false,
    }))
  );

  useEffect(() => {
    if (!observe || typeof ResizeObserver === 'undefined') return;

    const resizeObservers: ResizeObserver[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];

    elementRefs.forEach((ref, index) => {
      const element = ref.current;
      if (!element) return;

      let resizeTimer: ReturnType<typeof setTimeout>;

      const resizeObserver = new ResizeObserver((entries) => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            const size = getSizeCategory(width);

            setStates(prev => {
              const newStates = [...prev];
              newStates[index] = {
                width,
                height,
                aspectRatio: width / height || 1,
                size,
                isSmall: size === 'xs' || size === 'sm',
                isMedium: size === 'md',
                isLarge: size === 'lg',
                isXLarge: size === 'xl',
              };
              return newStates;
            });
          }
        }, debounceDelay);
      });

      resizeObserver.observe(element);
      resizeObservers.push(resizeObserver);
      timers.push(resizeTimer);
    });

    return () => {
      resizeObservers.forEach(observer => observer.disconnect());
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [elementRefs, getSizeCategory, debounceDelay, observe]);

  return states;
}

/**
 * Hook to get responsive styles based on container size
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const styles = useContainerStyles(ref, {
 *   small: { padding: '8px', fontSize: '14px' },
 *   medium: { padding: '16px', fontSize: '16px' },
 *   large: { padding: '24px', fontSize: '18px' },
 *   default: { padding: '8px', fontSize: '14px' },
 * });
 */
export function useContainerStyles<T extends Record<string, unknown>>(
  elementRef: React.RefObject<HTMLElement | null>,
  styles: {
    small?: T;
    medium?: T;
    large?: T;
    xlarge?: T;
    default: T;
  }
): T {
  const { size } = useContainerQuery(elementRef);

  return useMemo(() => {
    switch (size) {
      case 'xs':
      case 'sm':
        return styles.small ?? styles.default;
      case 'md':
        return styles.medium ?? styles.small ?? styles.default;
      case 'lg':
        return styles.large ?? styles.medium ?? styles.small ?? styles.default;
      case 'xl':
        return styles.xlarge ?? styles.large ?? styles.medium ?? styles.small ?? styles.default;
      default:
        return styles.default;
    }
  }, [size, styles]);
}

export default useContainerQuery;
