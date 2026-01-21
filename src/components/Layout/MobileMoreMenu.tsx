import { motion, AnimatePresence } from 'framer-motion';
import { useAtom, useSetAtom } from 'jotai';
import {
  X,
  CheckSquare,
  Filter,
  Lightbulb,
  CloudSun,
  Settings,
} from 'lucide-react';
import { useRef, useEffect } from 'react';

import { panelsAtom, openPanelAtom, closePanelAtom, type PanelId } from '../../atoms/floatingPanelAtoms';

interface MenuItem {
  id: PanelId;
  icon: React.ElementType;
  label: string;
  description: string;
}

export function MobileMoreMenu() {
  const [panels] = useAtom(panelsAtom);
  const openPanel = useSetAtom(openPanelAtom);
  const closePanel = useSetAtom(closePanelAtom);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const isOpen = panels.mobileMore?.isOpen && !panels.mobileMore?.isMinimized;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const menuItems: MenuItem[] = [
    { id: 'checklist', icon: CheckSquare, label: 'Tasks', description: 'Manage your travel checklist' },
    { id: 'filters', icon: Filter, label: 'Filters', description: 'Filter map markers' },
    { id: 'collaboration', icon: Lightbulb, label: 'Tips', description: 'Travel tips and suggestions' },
    { id: 'weather', icon: CloudSun, label: 'Weather', description: 'Weather forecast and alerts' },
    { id: 'settings', icon: Settings, label: 'Settings', description: 'App preferences' },
  ];

  const handleItemClick = (itemId: PanelId) => {
    closePanel('mobileMore');
    // Small delay to allow menu to close before opening panel
    timeoutRef.current = setTimeout(() => {
      openPanel(itemId);
    }, 100);
  };

  const handleClose = () => {
    closePanel('mobileMore');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-more-menu-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/40"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden="true"
          />

          {/* Menu Sheet */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl overflow-hidden"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-100">
              <h2 id="mobile-more-menu-title" className="text-lg font-semibold text-slate-900">More Options</h2>
              <button
                onClick={handleClose}
                className="p-2 -mr-2 text-slate-500 hover:text-slate-700 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="py-2 px-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const panelState = panels[item.id];
                const isActive = panelState?.isOpen && !panelState?.isMinimized;

                return (
                  <button
                    key={item.id}
                    onClick={() => { handleItemClick(item.id); }}
                    className={`
                      w-full flex items-center gap-4 px-3 py-3.5 rounded-xl
                      transition-colors duration-150
                      ${isActive
                        ? 'bg-sunset-50 text-sunset-700'
                        : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                      }
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center
                      ${isActive ? 'bg-sunset-100' : 'bg-slate-100'}
                    `}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-sunset-600' : 'text-slate-600'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-medium ${isActive ? 'text-sunset-900' : 'text-slate-900'}`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom padding for nav bar */}
            <div className="h-16" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
