import { useState } from 'react';
import { Map, CheckSquare, Filter } from 'lucide-react';
import { useFloatingPanelStore, type PanelId } from '../../stores/floatingPanelStore';

interface NavIconProps {
  icon: React.ElementType;
  label: string;
  panelId: PanelId;
  isActive: boolean;
  onClick: () => void;
}

function NavIcon({ icon: Icon, label, isActive, onClick }: NavIconProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          transition-all duration-200
          ${
            isActive
              ? 'bg-pink-100 text-pink-600 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }
        `}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={label}
      >
        <Icon className="w-5 h-5" />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-slate-900 text-white text-xs font-medium px-2 py-1 rounded whitespace-nowrap">
            {label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
          </div>
        </div>
      )}
    </div>
  );
}

export function NavigationDock() {
  const { panels, openPanel } = useFloatingPanelStore();

  const navItems: Array<{
    id: PanelId;
    icon: React.ElementType;
    label: string;
  }> = [
    { id: 'tripPlanner', icon: Map, label: 'Trip Planner' },
    { id: 'checklist', icon: CheckSquare, label: 'Checklist' },
    { id: 'filters', icon: Filter, label: 'Filters' },
  ];

  return (
    <aside
      className="fixed left-0 z-40 w-14 bg-white/80 backdrop-blur-xl border-r border-slate-200/50"
      style={{ top: '56px', bottom: 0 }}
    >
      <nav className="flex flex-col items-center gap-2 p-2">
        {navItems.map((item) => (
          <NavIcon
            key={item.id}
            icon={item.icon}
            label={item.label}
            panelId={item.id}
            isActive={panels[item.id].isOpen && !panels[item.id].isMinimized}
            onClick={() => openPanel(item.id)}
          />
        ))}
      </nav>
    </aside>
  );
}
