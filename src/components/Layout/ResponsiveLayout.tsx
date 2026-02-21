import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

import { useDeviceType } from '../../hooks/useDeviceType';
import { useTouch } from '../../hooks/useTouch';

/**
 * ResponsiveLayout Props
 */
interface ResponsiveLayoutProps {
  /** Header content */
  header?: React.ReactNode;
  /** Left sidebar content */
  leftSidebar?: React.ReactNode;
  /** Right sidebar content */
  rightSidebar?: React.ReactNode;
  /** Bottom navigation (mobile only) */
  bottomNav?: React.ReactNode;
  /** Main content */
  children: React.ReactNode;
  /** Whether to show mobile menu toggle */
  showMobileMenuToggle?: boolean;
  /** Whether left sidebar is initially open on mobile */
  defaultMobileSidebarOpen?: boolean;
  /** Callback when mobile sidebar state changes */
  onMobileSidebarChange?: (isOpen: boolean) => void;
  /** Additional class names */
  className?: string;
  /** Whether to use safe area insets */
  useSafeArea?: boolean;
}

/**
 * ResponsiveLayout Component
 *
 * A comprehensive responsive layout that adapts to different screen sizes:
 * - Mobile: Single column with optional bottom nav, collapsible sidebars
 * - Tablet: Sidebars as drawers or overlays
 * - Desktop: Fixed sidebars with main content area
 *
 * @example
 * <ResponsiveLayout
 *   header={<Header />}
 *   leftSidebar={<Sidebar />}
 *   bottomNav={<MobileNav />}
 * >
 *   <MainContent />
 * </ResponsiveLayout>
 */
export function ResponsiveLayout({
  header,
  leftSidebar,
  rightSidebar,
  bottomNav,
  children,
  showMobileMenuToggle = true,
  defaultMobileSidebarOpen = false,
  onMobileSidebarChange,
  className = '',
  useSafeArea = true,
}: ResponsiveLayoutProps) {
  const { isMobile, isTablet, isLaptop, isDesktop } = useDeviceType();
  const { isTouch } = useTouch();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(defaultMobileSidebarOpen);
  const [mobileRightSidebarOpen, setMobileRightSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Notify parent of sidebar state changes
  useEffect(() => {
    onMobileSidebarChange?.(mobileSidebarOpen);
  }, [mobileSidebarOpen, onMobileSidebarChange]);

  // Close sidebars when switching to larger screens
  useEffect(() => {
    if (!isMobile && !isTablet) {
      setMobileSidebarOpen(false);
      setMobileRightSidebarOpen(false);
    }
  }, [isMobile, isTablet]);

  // Handle escape key to close sidebars
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSidebarOpen(false);
        setMobileRightSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(prev => !prev);
    setMobileRightSidebarOpen(false);
  }, []);

  const toggleMobileRightSidebar = useCallback(() => {
    setMobileRightSidebarOpen(prev => !prev);
    setMobileSidebarOpen(false);
  }, []);

  // Determine sidebar visibility based on screen size
  const showLeftSidebar = isLaptop || isDesktop || (isTablet && !isMobile);
  const showRightSidebar = isDesktop;
  const showBottomNav = isMobile && bottomNav;

  const safeAreaClass = useSafeArea ? 'safe-area-inset-x safe-area-inset-y' : '';

  return (
    <div className={`relative min-h-screen bg-slate-50 ${className}`}>
      {/* Header */}
      {header && (
        <header className={`fixed top-0 left-0 right-0 z-50 ${safeAreaClass}`}>
          <div className="safe-area-inset-top">
            {header}
          </div>
        </header>
      )}

      {/* Mobile Menu Toggle */}
      {showMobileMenuToggle && leftSidebar && isMobile && (
        <button
          onClick={toggleMobileSidebar}
          className="fixed top-4 left-4 z-[60] p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200 touch-target-comfortable flex items-center justify-center"
          aria-label={mobileSidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileSidebarOpen ? (
            <X className="w-5 h-5 text-slate-700" />
          ) : (
            <Menu className="w-5 h-5 text-slate-700" />
          )}
        </button>
      )}

      {/* Left Sidebar - Desktop/Tablet */}
      {showLeftSidebar && leftSidebar && (
        <aside
          className={`fixed left-0 top-14 bottom-0 z-40 w-64 lg:w-72 bg-white border-r border-slate-200 overflow-y-auto scrollbar-hide transition-transform duration-300 ${safeAreaClass}`}
          style={{
            paddingBottom: showBottomNav ? 'calc(var(--navbar-height) + env(safe-area-inset-bottom, 0))' : undefined,
          }}
        >
          {leftSidebar}
        </aside>
      )}

      {/* Left Sidebar - Mobile Drawer */}
      <AnimatePresence>
        {isMobile && mobileSidebarOpen && leftSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed left-0 top-0 bottom-0 z-50 w-4/5 max-w-xs bg-white shadow-2xl overflow-y-auto ${safeAreaClass}`}
              style={{
                paddingTop: 'env(safe-area-inset-top, 0)',
                paddingBottom: 'env(safe-area-inset-bottom, 0)',
              }}
            >
              {/* Close button for mobile */}
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 touch-target"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>

              <div className="pt-14 px-4">
                {leftSidebar}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Right Sidebar - Desktop Only */}
      {showRightSidebar && rightSidebar && (
        <aside
          className={`fixed right-0 top-14 bottom-0 z-40 w-80 bg-white border-l border-slate-200 overflow-y-auto scrollbar-hide ${safeAreaClass}`}
        >
          {rightSidebar}
        </aside>
      )}

      {/* Right Sidebar - Mobile/Tablet Drawer */}
      <AnimatePresence>
        {(isMobile || isTablet) && mobileRightSidebarOpen && rightSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileRightSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed right-0 top-0 bottom-0 z-50 w-4/5 max-w-md bg-white shadow-2xl overflow-y-auto ${safeAreaClass}`}
            >
              <button
                onClick={() => setMobileRightSidebarOpen(false)}
                className="absolute top-4 left-4 p-2 rounded-full hover:bg-slate-100 touch-target"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
              <div className="pt-14 px-4">
                {rightSidebar}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main
        ref={mainRef}
        className={`
          relative min-h-screen transition-all duration-300
          ${header ? 'pt-14' : ''}
          ${showLeftSidebar ? 'lg:ml-64 xl:ml-72' : ''}
          ${showRightSidebar ? 'xl:mr-80' : ''}
          ${showBottomNav ? 'pb-16' : ''}
          ${safeAreaClass}
        `}
        style={{
          paddingBottom: showBottomNav ? 'calc(var(--navbar-height) + env(safe-area-inset-bottom, 0))' : undefined,
        }}
      >
        <div className="h-full">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Mobile */}
      <AnimatePresence>
        {showBottomNav && (
          <motion.nav
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-mobile safe-area-inset-bottom"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0)',
            }}
          >
            {bottomNav}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Touch overlay for better mobile experience */}
      {isTouch && (
        <style>{`
          /* Improve touch scrolling on mobile */
          .touch-scroll {
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          }

          /* Remove tap highlight */
          * {
            -webkit-tap-highlight-color: transparent;
          }

          /* Improve button touch targets */
          button, a {
            min-height: 44px;
            min-width: 44px;
          }
        `}</style>
      )}
    </div>
  );
}

/**
 * ResponsiveGrid Component
 *
 * A grid that adapts columns based on container size
 *
 * @example
 * <ResponsiveGrid minColumnWidth={280} gap={16}>
 *   {items.map(item => <Card key={item.id} {...item} />)}
 * </ResponsiveGrid>
 */
interface ResponsiveGridProps {
  children: React.ReactNode;
  minColumnWidth?: number;
  maxColumns?: number;
  gap?: number;
  className?: string;
}

export function ResponsiveGrid({
  children,
  minColumnWidth = 280,
  maxColumns = 4,
  gap = 16,
  className = '',
}: ResponsiveGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calculateColumns = () => {
      const containerWidth = container.clientWidth;
      const possibleColumns = Math.floor(containerWidth / minColumnWidth);
      setColumns(Math.max(1, Math.min(possibleColumns, maxColumns)));
    };

    calculateColumns();

    const resizeObserver = new ResizeObserver(() => {
      calculateColumns();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [minColumnWidth, maxColumns]);

  return (
    <div
      ref={containerRef}
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: `${gap}px`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * ResponsivePanel Component
 *
 * A panel that adapts its width and position based on screen size
 *
 * @example
 * <ResponsivePanel
 *   mobilePosition="bottom"
 *   desktopPosition="right"
 *   mobileHeight="50vh"
 *   desktopWidth={400}
 * >
 *   <PanelContent />
 * </ResponsivePanel>
 */
interface ResponsivePanelProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  mobilePosition?: 'bottom' | 'full';
  desktopPosition?: 'left' | 'right';
  mobileHeight?: string;
  desktopWidth?: number;
  title?: string;
  className?: string;
}

export function ResponsivePanel({
  children,
  isOpen,
  onClose,
  mobilePosition = 'bottom',
  desktopPosition = 'right',
  mobileHeight = '60vh',
  desktopWidth = 400,
  title,
  className = '',
}: ResponsivePanelProps) {
  const { isMobile, isTablet } = useDeviceType();

  const isMobileView = isMobile || isTablet;

  if (!isOpen) return null;

  // Mobile bottom sheet style
  if (isMobileView && mobilePosition === 'bottom') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl overflow-hidden safe-area-inset-bottom ${className}`}
          style={{ height: mobileHeight }}
        >
          {/* Drag handle */}
          <div className="flex items-center justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-slate-300 rounded-full" />
          </div>

          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 touch-target"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto h-full touch-scroll p-4">
            {children}
          </div>
        </motion.div>
      </>
    );
  }

  // Mobile full screen
  if (isMobileView && mobilePosition === 'full') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`fixed inset-0 z-50 bg-white safe-area-inset ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 safe-area-inset-top">
            <h3 className="font-semibold text-slate-800">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 touch-target"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto h-full touch-scroll p-4">
          {children}
        </div>
      </motion.div>
    );
  }

  // Desktop side panel
  const positionClass = desktopPosition === 'left' ? 'left-0 border-r' : 'right-0 border-l';

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: desktopPosition === 'left' ? '-100%' : '100%' }}
        animate={{ x: 0 }}
        exit={{ x: desktopPosition === 'left' ? '-100%' : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed top-14 bottom-0 z-50 bg-white shadow-xl overflow-hidden ${positionClass} ${className}`}
        style={{ width: desktopWidth }}
      >
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 touch-target"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto h-full touch-scroll p-4">
          {children}
        </div>
      </motion.div>
    </>
  );
}

export default ResponsiveLayout;
