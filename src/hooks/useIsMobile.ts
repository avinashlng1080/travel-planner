import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current viewport is mobile (< 768px)
 * Uses Tailwind's default md breakpoint as the threshold
 *
 * @param breakpoint - Optional custom breakpoint in pixels (default: 768)
 * @returns boolean indicating if viewport is mobile
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') {return false;}
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => { window.removeEventListener('resize', handleResize); };
  }, [breakpoint]);

  return isMobile;
}
