import { useState, useEffect } from 'react';

interface ResponsivePanelSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
}

export function useResponsivePanel(
  desktopWidth: number,
  desktopHeight: number
): ResponsivePanelSize {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); };
  }, []);

  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;

  return {
    width: isMobile
      ? windowSize.width - 32
      : isTablet
        ? Math.min(windowSize.width - 64, desktopWidth)
        : desktopWidth,
    height: isMobile
      ? Math.min(windowSize.height * 0.85, desktopHeight)
      : desktopHeight,
    isMobile,
    isTablet,
  };
}
