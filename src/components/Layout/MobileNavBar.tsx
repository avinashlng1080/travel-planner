import { useAtom, useSetAtom } from 'jotai';
import { Map, CheckSquare, Filter, Calendar, Lightbulb, AlertTriangle } from 'lucide-react';

import { panelsAtom, openPanelAtom, type PanelId } from '../../atoms/floatingPanelAtoms';

interface NavItem {
  id: PanelId;
  icon: React.ElementType;
  label: string;
}

export function MobileNavBar() {
  const [panels] = useAtom(panelsAtom);
  const openPanel = useSetAtom(openPanelAtom);

  const navItems: NavItem[] = [
    { id: 'tripPlanner', icon: Map, label: 'Plan' },
    { id: 'days', icon: Calendar, label: 'Days' },
    { id: 'checklist', icon: CheckSquare, label: 'Tasks' },
    { id: 'collaboration', icon: Lightbulb, label: 'Tips' },
    { id: 'filters', icon: Filter, label: 'Filters' },
    { id: 'weather', icon: AlertTriangle, label: 'Alerts' },
  ];

  const handleNavClick = (panelId: PanelId) => {
    openPanel(panelId);
  };

  return (
    <nav
      className="fixed md:hidden bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/50 safe-area-inset-x safe-area-inset-bottom"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const panelState = panels[item.id];
          const isActive = panelState.isOpen && !panelState.isMinimized;

          return (
            <button
              key={item.id}
              onClick={() => { handleNavClick(item.id); }}
              className={`
                flex flex-col items-center justify-center
                min-w-[48px] min-h-[48px] px-1.5 py-1.5
                rounded-lg transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-sunset-500 focus:ring-offset-2 focus:ring-offset-white
                ${
                  isActive
                    ? 'text-sunset-600 bg-sunset-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:scale-95'
                }
              `}
              aria-label={`${item.label}${isActive ? ' (active)' : ''}`}
              aria-pressed={isActive}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
              <span className="text-[9px] font-medium mt-0.5 leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
