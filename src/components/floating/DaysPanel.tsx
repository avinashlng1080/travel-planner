import { useAtom, useSetAtom } from 'jotai';
import { Calendar } from 'lucide-react';

import { panelsAtom, closePanelAtom, toggleMinimizeAtom, updatePositionAtom, bringToFrontAtom } from '../../atoms/floatingPanelAtoms';
import { selectedDayIdAtom } from '../../atoms/uiAtoms';
import { DAILY_PLANS } from '../../data/tripData';
import { useResponsivePanel } from '../../hooks/useResponsivePanel';
import { FloatingPanel } from '../ui/FloatingPanel';
import { GlassBadge } from '../ui/GlassPanel';

interface DayItemProps {
  date: string;
  dayOfWeek: string;
  title: string;
  isToday?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

function DayItem({ date, dayOfWeek, title, isToday, isSelected, onClick }: DayItemProps) {
  return (
    <button
      className={`
        w-full text-left px-4 py-3 rounded-lg
        transition-all duration-200
        ${isSelected ? 'bg-gradient-to-r from-sunset-500 to-ocean-600 text-white shadow-lg' : 'hover:bg-slate-100'}
        ${isToday && !isSelected ? 'border-2 border-sunset-500/50 bg-sunset-50/50' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={`text-xs font-semibold ${isSelected ? 'text-sunset-100' : 'text-slate-600'}`}>
          {dayOfWeek}
        </span>
        {isToday && (
          <GlassBadge color="sunset" className="text-[10px] px-2 py-0.5">
            TODAY
          </GlassBadge>
        )}
      </div>
      <div className={`text-sm font-semibold mb-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
        {title}
      </div>
      <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
        {new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
      </div>
    </button>
  );
}

export function DaysPanel() {
  const [panels] = useAtom(panelsAtom);
  const closePanel = useSetAtom(closePanelAtom);
  const toggleMinimize = useSetAtom(toggleMinimizeAtom);
  const updatePosition = useSetAtom(updatePositionAtom);
  const bringToFront = useSetAtom(bringToFrontAtom);
  const [selectedDayId, selectDay] = useAtom(selectedDayIdAtom);
  const { width, height } = useResponsivePanel(320, 450);

  const panelState = panels.days;

  // Calculate today's day ID based on current date
  const getTodayId = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const day of DAILY_PLANS) {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);

      if (dayDate.getTime() === today.getTime()) {
        return day.id;
      }
    }
    return null;
  };

  const todayId = getTodayId();

  const handleDayClick = (dayId: string) => {
    selectDay(dayId);
  };

  return (
    <FloatingPanel
      id="days"
      title="Daily Plans"
      icon={Calendar}
      isOpen={panelState.isOpen}
      isMinimized={panelState.isMinimized}
      position={panelState.position}
      size={{ width, height }}
      zIndex={panelState.zIndex}
      onClose={() => { closePanel('days'); }}
      onMinimize={() => { toggleMinimize('days'); }}
      onPositionChange={(pos) => { updatePosition({ panelId: 'days', position: pos }); }}
      onFocus={() => { bringToFront('days'); }}
    >
      <div className="p-4 space-y-2 max-h-[450px] overflow-y-auto">
        <div className="mb-3">
          <p className="text-xs text-slate-600">
            Dec 21, 2025 - Jan 6, 2026 • {DAILY_PLANS.length} days
          </p>
        </div>

        {DAILY_PLANS.map((day) => (
          <DayItem
            key={day.id}
            date={day.date}
            dayOfWeek={day.dayOfWeek}
            title={day.title}
            isToday={day.id === todayId}
            isSelected={day.id === selectedDayId}
            onClick={() => { handleDayClick(day.id); }}
          />
        ))}
      </div>
    </FloatingPanel>
  );
}
