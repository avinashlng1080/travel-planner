import { useAtom, useSetAtom } from 'jotai';
import { Map, Calendar, Sparkles, MoreHorizontal } from 'lucide-react';

import { panelsAtom, openPanelAtom, type PanelId } from '../../atoms/floatingPanelAtoms';

interface NavItem {
  id: PanelId | 'chat';
  icon: React.ElementType;
  label: string;
}

interface MobileNavBarProps {
  onChatClick?: () => void;
}

export function MobileNavBar({ onChatClick }: MobileNavBarProps) {
  const [panels] = useAtom(panelsAtom);
  const openPanel = useSetAtom(openPanelAtom);

  // PostHog-style navigation: 4 primary items
  const navItems: NavItem[] = [
    { id: 'tripPlanner', icon: Map, label: 'Map' },
    { id: 'days', icon: Calendar, label: 'Days' },
    { id: 'chat', icon: Sparkles, label: 'AI' },
    { id: 'mobileMore', icon: MoreHorizontal, label: 'More' },
  ];

  const handleNavClick = (item: NavItem) => {
    if (item.id === 'chat') {
      // Open chat through callback (handled by parent)
      onChatClick?.();
    } else {
      openPanel(item.id);
    }
  };

  const isActive = (item: NavItem): boolean => {
    if (item.id === 'chat') {
      return panels.mobileChat?.isOpen && !panels.mobileChat?.isMinimized;
    }
    const panelState = panels[item.id];
    return panelState?.isOpen && !panelState?.isMinimized;
  };

  return (
    <nav
      className="fixed md:hidden bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <button
              key={item.id}
              onClick={() => { handleNavClick(item); }}
              className={`
                flex flex-col items-center justify-center
                flex-1 h-full
                transition-colors duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset-500 focus-visible:ring-inset
                ${active
                  ? 'text-sunset-600'
                  : 'text-slate-500 active:text-slate-700'
                }
              `}
              aria-label={`${item.label}${active ? ' (active)' : ''}`}
              aria-pressed={active}
            >
              <Icon
                className={`w-6 h-6 ${item.id === 'chat' ? 'mb-0.5' : ''}`}
                strokeWidth={active ? 2.5 : 2}
                aria-hidden="true"
              />
              <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
