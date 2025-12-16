import { useState, useRef, useEffect } from 'react';
import { MapPin, Calendar, Settings, User, ChevronDown, LogOut, ArrowLeft } from 'lucide-react';
import { useAuthActions } from '@convex-dev/auth/react';
import { GlassBadge } from '../ui/GlassPanel';

interface FloatingHeaderProps {
  currentDay: number;
  totalDays: number;
  activePlan: 'A' | 'B';
  onPlanChange: (plan: 'A' | 'B') => void;
  tripName?: string;
  onBack?: () => void;
}

export function FloatingHeader({
  currentDay,
  totalDays,
  activePlan,
  onPlanChange,
  tripName = 'Malaysia Dec 21 - Jan 6',
  onBack,
}: FloatingHeaderProps) {
  const isOnTrip = currentDay > 0 && currentDay <= totalDays;
  const { signOut } = useAuthActions();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
      <div className="h-full flex items-center justify-between px-4">
        {/* Left: Back Button, Logo and Trip Name */}
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Back to trips"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-lg flex items-center justify-center shadow-glow-sunset">
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
              <GlassBadge color="sunset">
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
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 min-h-[44px] ${
                activePlan === 'A'
                  ? 'bg-ocean-600 text-white shadow-lg shadow-ocean-600/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => onPlanChange('A')}
            >
              Plan A
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 min-h-[44px] ${
                activePlan === 'B'
                  ? 'bg-sunset-500 text-white shadow-lg shadow-sunset-500/30'
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
          <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg transition-colors min-w-[44px] min-h-[44px]">
            <Settings className="w-5 h-5" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
            >
              <div className="w-6 h-6 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-full flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <ChevronDown className="w-4 h-4 hidden sm:block" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-xl shadow-xl overflow-hidden">
                <div className="p-3 border-b border-slate-100">
                  <p className="text-xs text-slate-500">Signed in</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
