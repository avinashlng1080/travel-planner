import { Clock, Info } from 'lucide-react';
import type { ScheduleItem as ScheduleItemType } from '../../data/tripData';

interface ScheduleItemProps {
  item: ScheduleItemType;
  locationName?: string;
  locationCategory?: string;
  isDragging?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  'home-base': 'Home',
  'toddler-friendly': 'Baby',
  'attraction': 'Star',
  'shopping': 'Shop',
  'restaurant': 'Food',
  'nature': 'Tree',
  'temple': 'Building',
  'playground': 'Play',
  'medical': 'Hospital',
};

const CATEGORY_COLORS: Record<string, string> = {
  'home-base': 'text-pink-500',
  'toddler-friendly': 'text-pink-400',
  'attraction': 'text-green-500',
  'shopping': 'text-purple-500',
  'restaurant': 'text-amber-500',
  'nature': 'text-green-400',
  'temple': 'text-red-500',
  'playground': 'text-cyan-500',
  'medical': 'text-red-600',
};

export function ScheduleItem({
  item,
  locationName = 'Unknown Location',
  locationCategory = 'attraction',
  isDragging = false,
}: ScheduleItemProps) {
  const icon = CATEGORY_ICONS[locationCategory] || 'Pin';
  const colorClass = CATEGORY_COLORS[locationCategory] || 'text-slate-400';

  const calculateDuration = (start: string, end: string): string => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const diffMinutes = endMinutes - startMinutes;

    if (diffMinutes < 60) {
      return `${diffMinutes}min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
  };

  const duration = calculateDuration(item.startTime, item.endTime);

  return (
    <div
      className={`
        bg-white rounded-lg p-4 border border-slate-200
        transition-all duration-200
        ${isDragging ? 'opacity-50 shadow-xl scale-105' : 'hover:border-slate-600'}
        ${item.isNapTime ? 'bg-white border-blue-900' : ''}
        ${item.isFlexible ? 'border-dashed' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`text-xl ${colorClass} flex-shrink-0`}>{icon}</div>

        <div className="flex-1 min-w-0">
          <h4 className="text-slate-900 font-medium truncate">
            {item.isNapTime ? 'Nap Time' : locationName}
          </h4>

          <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{item.startTime} - {item.endTime}</span>
            </div>
            <div className="text-slate-500">{duration}</div>
          </div>

          {item.notes && (
            <div className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-cyan-500" />
              <span className="flex-1">{item.notes}</span>
            </div>
          )}

          {item.isFlexible && (
            <div className="mt-2">
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400 border border-amber-800">
                Flexible timing
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
