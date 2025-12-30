import { Clock, Info, Star, Home, Umbrella, Car, Baby } from 'lucide-react';
import type { ScheduleItem as ScheduleItemType, Location } from '../../data/tripData';

interface ScheduleItemProps {
  item: ScheduleItemType;
  locationName?: string;
  locationCategory?: string;
  location?: Location;
  isDragging?: boolean;
  onClick?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'home-base': 'bg-sunset-500',
  'toddler-friendly': 'bg-sunset-400',
  attraction: 'bg-green-500',
  shopping: 'bg-ocean-500',
  restaurant: 'bg-amber-500',
  nature: 'bg-green-400',
  temple: 'bg-red-500',
  playground: 'bg-cyan-500',
  medical: 'bg-red-600',
};

export function ScheduleItem({
  item,
  locationName = 'Unknown Location',
  locationCategory = 'attraction',
  location,
  isDragging = false,
  onClick,
}: ScheduleItemProps) {
  const bgColor = CATEGORY_COLORS[locationCategory] || 'bg-slate-400';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

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

  // Render toddler rating stars
  const renderToddlerRating = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={`star-${i}`}
            className={`w-3 h-3 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className={`
        bg-white rounded-xl p-3 border border-slate-200
        transition-all duration-200
        ${isDragging ? 'opacity-50 shadow-xl scale-105' : 'hover:border-slate-300 hover:shadow-sm'}
        ${onClick && !isDragging ? 'cursor-pointer hover:shadow-md hover:border-sunset-300' : ''}
        ${item.isNapTime ? 'bg-blue-50 border-blue-200' : ''}
        ${item.isFlexible ? 'border-dashed' : ''}
      `}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={
        onClick
          ? `View details for ${item.isNapTime ? 'Nap Time' : locationName} from ${item.startTime} to ${item.endTime}`
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        {/* Time badge */}
        <div className="flex flex-col items-center flex-shrink-0 w-14">
          <div className={`w-3 h-3 rounded-full ${bgColor} mb-1`} />
          <span className="text-xs font-semibold text-slate-900">{item.startTime}</span>
          <span className="text-xs md:text-[10px] text-slate-400">to {item.endTime}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Location name */}
          <h4 className="text-sm font-semibold text-slate-900 truncate">
            {item.isNapTime ? '😴 Nap Time' : locationName}
          </h4>

          {/* Duration and category */}
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-xs md:text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              <Clock className="w-2.5 h-2.5" />
              {duration}
            </span>
            {location && !item.isNapTime && (
              <>
                <span className="inline-flex items-center gap-1 text-xs md:text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {location.isIndoor ? (
                    <Home className="w-2.5 h-2.5" />
                  ) : (
                    <Umbrella className="w-2.5 h-2.5" />
                  )}
                  {location.isIndoor ? 'Indoor' : 'Outdoor'}
                </span>
              </>
            )}
            {item.isFlexible && (
              <span className="text-xs md:text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                Flexible
              </span>
            )}
          </div>

          {/* Location details */}
          {location && !item.isNapTime && (
            <div className="mt-2 space-y-1">
              {/* Toddler rating */}
              <div className="flex items-center gap-2">
                <Baby className="w-3 h-3 text-sunset-500" />
                {renderToddlerRating(location.toddlerRating)}
                <span className="text-xs md:text-[10px] text-slate-500">toddler-friendly</span>
              </div>

              {/* Transport info */}
              {location.grabEstimate && location.grabEstimate !== 'N/A' && (
                <div className="flex items-center gap-1.5 text-xs md:text-[10px] text-slate-500">
                  <Car className="w-3 h-3" />
                  <span>
                    {location.drivingTime} • Grab ~{location.grabEstimate}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="mt-2 flex items-start gap-1.5 text-sm md:text-xs text-slate-600 bg-cyan-50 rounded-lg p-2">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-cyan-500" />
              <span className="flex-1">{item.notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
