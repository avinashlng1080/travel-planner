import { useAuthActions } from '@convex-dev/auth/react';
import { useSetAtom } from 'jotai';
import { MapPin, Calendar, Settings, User, ChevronDown, LogOut, ArrowLeft, Zap, Sun, Moon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { openPanelAtom } from '../../atoms/floatingPanelAtoms';
import { useEnergyTheme } from '../../hooks/useEnergyTheme';
import { UserContextPanel } from '../floating/UserContextPanel';
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
  const openPanel = useSetAtom(openPanelAtom);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const energyTheme = useEnergyTheme();

  // Get the energy icon component
  const EnergyIcon = energyTheme.icon === 'zap' ? Zap : energyTheme.icon === 'moon' ? Moon : Sun;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur-xl border-b safe-area-inset-x safe-area-inset-top transition-colors duration-500 ${
      energyTheme.level === 'low'
        ? 'bg-gradient-to-r from-slate-50/90 via-blue-50/80 to-slate-50/90 border-blue-200/50'
        : energyTheme.level === 'high'
        ? 'bg-gradient-to-r from-white/90 via-sunset-50/50 to-white/90 border-sunset-200/50'
        : 'bg-white/80 border-slate-200/50'
    }`}>
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
              <span className="text-sm text-slate-600">{Math.abs(currentDay)} days until trip</span>
            ) : (
              <span className="text-sm text-slate-600">Trip completed</span>
            )}
          </div>

          {/* Plan A/B Toggle */}
          <div className={`flex items-center gap-1 rounded-lg p-1 transition-colors duration-300 ${
            energyTheme.suggestPlanB ? 'bg-blue-50/80 ring-1 ring-blue-200' : 'bg-white/60'
          }`}>
            <button
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 min-h-[44px] ${
                activePlan === 'A'
                  ? 'bg-ocean-600 text-white shadow-lg shadow-ocean-600/30'
                  : energyTheme.suggestPlanB
                  ? 'text-slate-400'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => { onPlanChange('A'); }}
            >
              Plan A
            </button>
            <button
              className={`relative px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 min-h-[44px] ${
                activePlan === 'B'
                  ? energyTheme.suggestPlanB
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-sunset-500 text-white shadow-lg shadow-sunset-500/30'
                  : energyTheme.suggestPlanB
                  ? 'text-blue-600 font-semibold hover:bg-blue-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => { onPlanChange('B'); }}
            >
              Plan B
              {/* Pulse indicator when Plan B is suggested but not active */}
              {energyTheme.suggestPlanB && activePlan !== 'B' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Right: User Context, Settings, and User Menu */}
        <div className="flex items-center gap-2">
          {/* Energy Context Button with indicator */}
          <button
            onClick={() => { setShowContextPanel(!showContextPanel); }}
            className={`relative p-2 rounded-lg transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center gap-1.5 ${
              energyTheme.level === 'low'
                ? 'text-blue-600 hover:bg-blue-100/50 bg-blue-50/50'
                : energyTheme.level === 'high'
                ? 'text-sunset-600 hover:bg-sunset-100/50 bg-sunset-50/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
            aria-label="User context"
          >
            <EnergyIcon className="w-5 h-5" />
            {/* Show label on larger screens */}
            <span className={`hidden lg:block text-xs font-medium ${
              energyTheme.level === 'low' ? 'text-blue-700' :
              energyTheme.level === 'high' ? 'text-sunset-700' : 'text-slate-600'
            }`}>
              {energyTheme.label}
            </span>
            {/* Pulse indicator when suggesting Plan B */}
            {energyTheme.suggestPlanB && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
            )}
          </button>

          <button
            onClick={() => { openPanel('settings'); }}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
            aria-label="Open settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); }}
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
                  onClick={() => { void handleSignOut(); }}
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

      {/* User Context Panel */}
      <UserContextPanel isOpen={showContextPanel} onClose={() => { setShowContextPanel(false); }} />
    </header>
  );
}
