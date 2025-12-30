import { useState } from 'react';
import { ChevronUp, Sun, CloudRain, MapPin, Clock, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassBadge } from '../ui/GlassPanel';

interface ScheduleItemData {
  id: string;
  locationId: string;
  locationName: string;
  startTime: string;
  endTime: string;
  notes?: string;
  isNapTime?: boolean;
}

interface BottomItineraryBarProps {
  date: string;
  dayOfWeek: string;
  title: string;
  planA: ScheduleItemData[];
  planB: ScheduleItemData[];
  activePlan: 'A' | 'B';
  weatherConsideration: 'outdoor-heavy' | 'indoor-heavy' | 'mixed';
  onLocationClick?: (locationId: string) => void;
}

function ScheduleStop({
  item,
  isActive,
  onClick,
}: {
  item: ScheduleItemData;
  isActive: boolean;
  onClick?: () => void;
}) {
  if (item.isNapTime) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-ocean-500/20 border border-ocean-500/30 rounded-lg">
        <Moon className="w-4 h-4 text-ocean-400" />
        <span className="text-sm text-ocean-300">{item.startTime}</span>
        <span className="text-sm text-ocean-200">Nap Time</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
        ${isActive ? 'bg-sunset-500/20 border border-sunset-500/30' : 'bg-white hover:bg-slate-100'}
      `}
    >
      <div className="flex items-center gap-1 text-slate-600">
        <Clock className="w-3 h-3" />
        <span className="text-xs">{item.startTime}</span>
      </div>
      <MapPin className="w-4 h-4 text-sunset-400" />
      <span className="text-sm text-slate-900 font-medium truncate max-w-[150px]">
        {item.locationName}
      </span>
    </button>
  );
}

function PlanRow({
  label,
  active,
  stops,
  color,
  onLocationClick,
}: {
  label: string;
  active: boolean;
  stops: ScheduleItemData[];
  color: 'green' | 'blue';
  onLocationClick?: (locationId: string) => void;
}) {
  const colorClasses = {
    green: 'bg-green-500 text-white',
    blue: 'bg-blue-500 text-white',
  };

  return (
    <div className={`flex items-center gap-3 ${!active ? 'opacity-50' : ''}`}>
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${colorClasses[color]}`}>
        {label}
      </span>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {stops.length === 0 ? (
          <span className="text-sm text-slate-500 italic">No activities planned</span>
        ) : (
          stops.map((stop, index) => (
            <div key={stop.id} className="flex items-center gap-2">
              <ScheduleStop
                item={stop}
                isActive={active}
                onClick={() => onLocationClick?.(stop.locationId)}
              />
              {index < stops.length - 1 && <span className="text-slate-600">→</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function BottomItineraryBar({
  date,
  dayOfWeek,
  title,
  planA,
  planB,
  activePlan,
  weatherConsideration,
  onLocationClick,
}: BottomItineraryBarProps) {
  const [expanded, setExpanded] = useState(false);

  const WeatherIcon = weatherConsideration === 'outdoor-heavy' ? Sun : CloudRain;
  const weatherColor =
    weatherConsideration === 'outdoor-heavy' ? 'text-amber-400' : 'text-blue-400';

  return (
    <motion.div
      className={`
        fixed bottom-0 left-0 md:left-14 lg:left-72 right-0 z-30
        bg-white backdrop-blur-xl
        border-t border-slate-200
        rounded-t-2xl
        transition-all duration-300
      `}
      animate={{ height: expanded ? 200 : 80 }}
    >
      {/* Expand Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -top-4 left-1/2 -translate-x-1/2 w-11 h-11 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 z-10"
        aria-label={expanded ? 'Collapse itinerary' : 'Expand itinerary'}
      >
        <ChevronUp
          className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-900">
              {dayOfWeek} - {title}
            </h3>
            <GlassBadge color="slate">{date}</GlassBadge>
          </div>
          <div className="flex items-center gap-2">
            <WeatherIcon className={`w-5 h-5 ${weatherColor}`} />
            <span className="text-xs text-slate-600 capitalize">
              {weatherConsideration.replace('-', ' ')}
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="flex-1 space-y-2 overflow-hidden">
          <PlanRow
            label="Plan A"
            active={activePlan === 'A'}
            stops={planA}
            color="green"
            onLocationClick={onLocationClick}
          />
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <PlanRow
                  label="Plan B"
                  active={activePlan === 'B'}
                  stops={planB}
                  color="blue"
                  onLocationClick={onLocationClick}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
