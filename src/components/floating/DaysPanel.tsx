import { Calendar } from 'lucide-react';
import { FloatingPanel } from '../ui/FloatingPanel';
import { useFloatingPanelStore } from '../../stores/floatingPanelStore';
import { useUIStore } from '../../stores/uiStore';
import { DAILY_PLANS } from '../../data/tripData';
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
        ${isSelected ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' : 'hover:bg-slate-100'}
        ${isToday && !isSelected ? 'border-2 border-pink-500/50 bg-pink-50/50' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={`text-xs font-semibold ${isSelected ? 'text-pink-100' : 'text-slate-600'}`}>
          {dayOfWeek}
        </span>
        {isToday && (
          <GlassBadge color="pink" className="text-[10px] px-2 py-0.5">
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
  const { panels, closePanel, toggleMinimize, updatePosition, bringToFront } = useFloatingPanelStore();
  const { selectedDayId, selectDay } = useUIStore();

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
      size={{ width: 320, height: 450 }}
      zIndex={panelState.zIndex}
      onClose={() => closePanel('days')}
      onMinimize={() => toggleMinimize('days')}
      onPositionChange={(pos) => updatePosition('days', pos)}
      onFocus={() => bringToFront('days')}
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
            onClick={() => handleDayClick(day.id)}
          />
        ))}
      </div>
    </FloatingPanel>
  );
}
