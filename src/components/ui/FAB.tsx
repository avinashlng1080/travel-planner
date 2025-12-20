import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Map, CheckSquare, Filter, Users, Cloud } from 'lucide-react';
import { useAtom, useSetAtom } from 'jotai';
import { openPanelAtom, type PanelId } from '../../atoms/floatingPanelAtoms';
import type { LucideIcon } from 'lucide-react';

interface MenuItem {
  id: PanelId;
  icon: LucideIcon;
  label: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'tripPlanner', icon: Map, label: 'Planner' },
  { id: 'checklist', icon: CheckSquare, label: 'Checklist' },
  { id: 'filters', icon: Filter, label: 'Filters' },
  { id: 'collaboration', icon: Users, label: 'Collaborate' },
  { id: 'weather', icon: Cloud, label: 'Weather' },
];

/**
 * Floating Action Button for mobile navigation
 * Features:
 * - Expandable menu grid with 3 columns
 * - Staggered animations
 * - Keyboard navigation (Arrow keys, Escape)
 * - Safe area positioning
 * - Hidden on desktop (md:hidden)
 */
export function FAB() {
  const [isExpanded, setIsExpanded] = useState(false);
  const openPanel = useSetAtom(openPanelAtom);
  const menuRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for FAB menu
  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
        return;
      }

      const items = menuRef.current?.querySelectorAll('button[role="menuitem"]');
      if (!items || items.length === 0) return;

      const currentIndex = Array.from(items).indexOf(document.activeElement as HTMLButtonElement);

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        (items[nextIndex] as HTMLButtonElement).focus();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        (items[prevIndex] as HTMLButtonElement).focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        (items[0] as HTMLButtonElement).focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        (items[items.length - 1] as HTMLButtonElement).focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const handleMenuItemClick = (panelId: PanelId) => {
    openPanel(panelId);
    setIsExpanded(false);
  };

  return (
    <>
      {/* Expanded Menu */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-60 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => setIsExpanded(false)}
              aria-hidden="true"
            />

            {/* Menu Grid */}
            <motion.div
              ref={menuRef}
              id="fab-menu"
              role="menu"
              aria-label="Panel navigation menu"
              className="relative bg-white/95 backdrop-blur-xl border-t border-slate-200/50 rounded-t-3xl p-6 grid grid-cols-3 gap-4"
              style={{
                paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 24px)`,
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 300,
              }}
            >
              {MENU_ITEMS.map((item, index) => (
                <motion.button
                  key={item.id}
                  role="menuitem"
                  onClick={() => handleMenuItemClick(item.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-slate-200/50 hover:bg-slate-50 active:scale-95 transition-all min-h-[88px] min-w-[88px] focus:outline-none focus:ring-2 focus:ring-sunset-500 focus:ring-offset-2"
                  aria-label={`Open ${item.label} panel`}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-xl flex items-center justify-center shadow-lg">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 text-center leading-tight">
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        className="fixed md:hidden w-14 h-14 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-full shadow-2xl flex items-center justify-center text-white z-60"
        style={{
          bottom: `calc(env(safe-area-inset-bottom, 0px) + 152px)`,
          right: `calc(env(safe-area-inset-right, 0px) + 16px)`,
          boxShadow: '0 8px 24px rgba(249, 115, 22, 0.4)',
        }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? 'Close menu' : 'Open menu'}
        aria-expanded={isExpanded}
        aria-controls="fab-menu"
        aria-haspopup="true"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isExpanded ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Menu className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
