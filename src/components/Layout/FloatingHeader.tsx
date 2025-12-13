import { MapPin, Calendar, Settings, User, ChevronDown } from 'lucide-react';
import { GlassButton, GlassBadge } from '../ui/GlassPanel';

interface FloatingHeaderProps {
  currentDay: number;
  totalDays: number;
  activePlan: 'A' | 'B';
  onPlanChange: (plan: 'A' | 'B') => void;
  tripName?: string;
  dateRange?: string;
}

export function FloatingHeader({
  currentDay,
  totalDays,
  activePlan,
  onPlanChange,
  tripName = 'Malaysia Dec 21 - Jan 6',
  dateRange,
}: FloatingHeaderProps) {
  const isOnTrip = currentDay > 0 && currentDay <= totalDays;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
      <div className="h-full flex items-center justify-between px-4">
        {/* Left: Logo and Trip Name */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900 hidden sm:block">TripPlanner</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-slate-600">
            <span className="text-sm">{tripName}</span>
          </div>
        </div>

        {/* Center: Day Counter and Plan Toggle */}
        <div className="flex items-center gap-4">
          {/* Day Counter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-600" />
            {isOnTrip ? (
              <GlassBadge color="pink">
                Day {currentDay} of {totalDays}
              </GlassBadge>
            ) : currentDay <= 0 ? (
              <span className="text-sm text-slate-600">
                {Math.abs(currentDay)} days until trip
              </span>
            ) : (
              <span className="text-sm text-slate-600">Trip completed</span>
            )}
          </div>

          {/* Plan A/B Toggle */}
          <div className="flex items-center gap-1 bg-white/60 rounded-lg p-1">
            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                activePlan === 'A'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => onPlanChange('A')}
            >
              Plan A
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                activePlan === 'B'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => onPlanChange('B')}
            >
              Plan B
            </button>
          </div>
        </div>

        {/* Right: User and Settings */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg transition-colors">
            <User className="w-5 h-5" />
            <ChevronDown className="w-4 h-4 hidden sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
