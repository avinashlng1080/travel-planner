import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Settings,
  User,
  ChevronDown,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useSetAtom } from 'jotai';

import { openPanelAtom } from '../../atoms/floatingPanelAtoms';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useTouch } from '../../hooks/useTouch';
import { useEnergyTheme } from '../../hooks/useEnergyTheme';
import { UserContextPanel } from '../floating/UserContextPanel';
import { GlassBadge } from '../ui/GlassPanel';

/**
 * ResponsiveFloatingHeader Props
 */
interface ResponsiveFloatingHeaderProps {
  /** Current day number */
  currentDay: number;
  /** Total number of days */
  totalDays: number;
  /** Active plan (A or B) */
  activePlan: 'A' | 'B';
  /** Callback when plan changes */
  onPlanChange: (plan: 'A' | 'B') => void;
  /** Trip name to display */
  tripName?: string;
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Additional actions to show in header */
  actions?: React.ReactNode;
  /** Whether to show mobile menu toggle */
  onMenuToggle?: () => void;
  /** Whether mobile menu is open */
  isMenuOpen?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * ResponsiveFloatingHeader Component
 *
 * A fully responsive header that adapts to different screen sizes:
 * - Mobile: Compact layout with essential info only, hamburger menu
 * - Tablet: Medium layout with key actions
 * - Desktop: Full layout with all controls
 */
export function ResponsiveFloatingHeader({
  currentDay,
  totalDays,
  activePlan,
  onPlanChange,
  tripName = 'TripPlanner',
  onBack,
  actions,
  onMenuToggle,
  isMenuOpen,
  className = '',
}: ResponsiveFloatingHeaderProps) {
  const { isMobile, isTablet, isLaptop, isDesktop, minTouchTarget } = useDeviceType();
  const { isTouch } = useTouch();
  const { signOut } = useAuthActions();
  const openPanel = useSetAtom(openPanelAtom);
  const energyTheme = useEnergyTheme();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const planDropdownRef = useRef<HTMLDivElement>(null);

  const isOnTrip = currentDay > 0 && currentDay <= totalDays;
  const EnergyIcon = energyTheme.icon === 'zap' ? Zap : energyTheme.icon === 'moon' ? Moon : Sun;

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (planDropdownRef.current && !planDropdownRef.current.contains(event.target as Node)) {
        setShowPlanDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const handlePlanSelect = useCallback((plan: 'A' | 'B') => {
    onPlanChange(plan);
    setShowPlanDropdown(false);
  }, [onPlanChange]);

  // Get header background based on energy theme
  const headerBgClass = energyTheme.level === 'low'
    ? 'bg-gradient-to-r from-slate-50/90 via-blue-50/80 to-slate-50/90 border-blue-200/50'
    : energyTheme.level === 'high'
    ? 'bg-gradient-to-r from-white/90 via-sunset-50/50 to-white/90 border-sunset-200/50'
    : 'bg-white/95 border-slate-200/50';

  // Mobile compact header
  if (isMobile) {
    return (
      <>
        <header
          className={`
            fixed top-0 left-0 right-0 z-50
            h-14
            backdrop-blur-xl
            border-b
            safe-area-inset-top
            ${headerBgClass}
            ${className}
          `}
        >
          <div className="flex items-center justify-between h-full px-3">
            {/* Left: Menu toggle + Back */}
            <div className="flex items-center gap-1">
              {onMenuToggle && (
                <button
                  onClick={onMenuToggle}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  style={{ minWidth: minTouchTarget, minHeight: minTouchTarget }}
                  aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                >
                  {isMenuOpen ? (
                    <X className="w-5 h-5 text-slate-600" />
                  ) : (
                    <Menu className="w-5 h-5 text-slate-600" />
                  )}
                </button>
              )}

              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  style={{ minWidth: minTouchTarget, minHeight: minTouchTarget }}
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
              )}
            </div>

            {/* Center: Trip name + Day indicator */}
            <div className="flex flex-col items-center flex-1 min-w-0 mx-2">
              <h1 className="text-sm font-semibold text-slate-800 truncate max-w-full">
                {tripName}
              </h1>
              {isOnTrip && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>Day {currentDay}/{totalDays}</span>
                </div>
              )}
            </div>

            {/* Right: Plan toggle + User menu */}
            <div className="flex items-center gap-1">
              {/* Compact plan toggle */}
              {isOnTrip && (
                <div className={`flex items-center rounded-lg p-0.5 ${
                  energyTheme.suggestPlanB ? 'bg-blue-50/80 ring-1 ring-blue-200' : 'bg-slate-100'
                }`}>
                  <button
                    onClick={() => handlePlanSelect('A')}
                    className={`
                      px-2 py-1 text-xs font-medium rounded-md transition-all
                      ${activePlan === 'A'
                        ? 'bg-white text-ocean-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                      }
                    `}
                  >
                    A
                  </button>
                  <button
                    onClick={() => handlePlanSelect('B')}
                    className={`
                      relative px-2 py-1 text-xs font-medium rounded-md transition-all
                      ${activePlan === 'B'
                        ? energyTheme.suggestPlanB
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'bg-white text-sunset-600 shadow-sm'
                        : energyTheme.suggestPlanB
                        ? 'text-blue-600 font-semibold'
                        : 'text-slate-500 hover:text-slate-700'
                      }
                    `}
                  >
                    B
                    {energyTheme.suggestPlanB && activePlan !== 'B' && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    )}
                  </button>
                </div>
              )}

              {/* User menu */}
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  style={{ minWidth: minTouchTarget, minHeight: minTouchTarget }}
                  aria-label="User menu"
                >
                  <User className="w-5 h-5 text-slate-600" />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
                    >
                      <button
                        onClick={() => void handleSignOut()}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>
        <UserContextPanel isOpen={showContextPanel} onClose={() => setShowContextPanel(false)} />
      </>
    );
  }

  // Tablet header
  if (isTablet) {
    return (
      <>
        <header
          className={`
            fixed top-0 left-0 right-0 z-50
            h-14
            backdrop-blur-xl
            border-b
            safe-area-inset-top
            ${headerBgClass}
            ${className}
          `}
        >
          <div className="flex items-center justify-between h-full px-4">
            {/* Left: Back + Trip info */}
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  style={{ minWidth: minTouchTarget, minHeight: minTouchTarget }}
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
              )}

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-slate-800">{tripName}</h1>
                  {isOnTrip && (
                    <span className="text-xs text-slate-500">
                      Day {currentDay} of {totalDays}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Center: Plan selector */}
            {isOnTrip && (
              <div className={`flex items-center rounded-lg p-1 ${
                energyTheme.suggestPlanB ? 'bg-blue-50/80 ring-1 ring-blue-200' : 'bg-slate-100'
              }`}>
                <button
                  onClick={() => handlePlanSelect('A')}
                  className={`
                    px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2
                    ${activePlan === 'A'
                      ? 'bg-white text-ocean-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                    }
                  `}
                  style={{ minHeight: minTouchTarget }}
                >
                  <span className="w-2 h-2 rounded-full bg-ocean-500" />
                  Plan A
                </button>
                <button
                  onClick={() => handlePlanSelect('B')}
                  className={`
                    relative px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2
                    ${activePlan === 'B'
                      ? energyTheme.suggestPlanB
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'bg-white text-sunset-600 shadow-sm'
                      : energyTheme.suggestPlanB
                      ? 'text-blue-600 font-semibold hover:bg-blue-100'
                      : 'text-slate-500 hover:text-slate-700'
                    }
                  `}
                  style={{ minHeight: minTouchTarget }}
                >
                  <span className={`w-2 h-2 rounded-full ${energyTheme.suggestPlanB ? 'bg-blue-500' : 'bg-sunset-500'}`} />
                  Plan B
                  {energyTheme.suggestPlanB && activePlan !== 'B' && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </button>
              </div>
            )}

            {/* Right: Actions + User */}
            <div className="flex items-center gap-2">
              {/* Energy Context Button */}
              <button
                onClick={() => setShowContextPanel(!showContextPanel)}
                className={`relative p-2 rounded-lg transition-all ${
                  energyTheme.level === 'low'
                    ? 'text-blue-600 hover:bg-blue-100/50 bg-blue-50/50'
                    : energyTheme.level === 'high'
                    ? 'text-sunset-600 hover:bg-sunset-100/50 bg-sunset-50/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
                style={{ minWidth: minTouchTarget, minHeight: minTouchTarget }}
                aria-label="Energy context"
              >
                <EnergyIcon className="w-5 h-5" />
                {energyTheme.suggestPlanB && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                )}
              </button>

              <button
                onClick={() => openPanel('settings')}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                style={{ minWidth: minTouchTarget, minHeight: minTouchTarget }}
                aria-label="Settings"
              >
                <Settings className="w-5 h-5 text-slate-600" />
              </button>

              {actions}

              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  style={{ minWidth: minTouchTarget, minHeight: minTouchTarget }}
                >
                  <User className="w-5 h-5 text-slate-600" />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
                    >
                      <button
                        onClick={() => void handleSignOut()}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>
        <UserContextPanel isOpen={showContextPanel} onClose={() => setShowContextPanel(false)} />
      </>
    );
  }

  // Desktop/Laptop full header
  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50
          h-14
          backdrop-blur-xl
          border-b
          safe-area-inset-x safe-area-inset-top
          transition-colors duration-500
          ${headerBgClass}
          ${className}
        `}
      >
        <div className="flex items-center justify-between h-full px-4">
          {/* Left: Back Button, Logo and Trip Name */}
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg transition-colors"
                style={{ minWidth: minTouchTarget, minHeight: minTouchTarget }}
                aria-label="Back to trips"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-lg flex items-center justify-center shadow-glow-sunset">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-900">TripPlanner</span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
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

            {/* Plan A/B Toggle with dropdown */}
            <div ref={planDropdownRef} className="relative">
              <div className={`flex items-center gap-1 rounded-lg p-1 transition-colors duration-300 ${
                energyTheme.suggestPlanB ? 'bg-blue-50/80 ring-1 ring-blue-200' : 'bg-white/60'
              }`}>
                <button
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    activePlan === 'A'
                      ? 'bg-ocean-600 text-white shadow-lg shadow-ocean-600/30'
                      : energyTheme.suggestPlanB
                      ? 'text-slate-400'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  style={{ minHeight: minTouchTarget }}
                  onClick={() => handlePlanSelect('A')}
                >
                  Plan A
                </button>
                <button
                  className={`relative px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    activePlan === 'B'
                      ? energyTheme.suggestPlanB
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-sunset-500 text-white shadow-lg shadow-sunset-500/30'
                      : energyTheme.suggestPlanB
                      ? 'text-blue-600 font-semibold hover:bg-blue-100'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  style={{ minHeight: minTouchTarget }}
                  onClick={() => handlePlanSelect('B')}
                >
                  Plan B
                  {energyTheme.suggestPlanB && activePlan !== 'B' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right: User Context, Settings, and User Menu */}
          <div className="flex items-center gap-2">
            {/* Energy Context Button with indicator */}
            <button
              onClick={() => setShowContextPanel(!showContextPanel)}
              className={`relative p-2 rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                energyTheme.level === 'low'
                  ? 'text-blue-600 hover:bg-blue-100/50 bg-blue-50/50'
                  : energyTheme.level === 'high'
                  ? 'text-sunset-600 hover:bg-sunset-100/50 bg-sunset-50/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
              style={{ minWidth: minTouchTarget, minHeight: minTouchTarget }}
              aria-label="User context"
            >
              <EnergyIcon className="w-5 h-5" />
              <span className={`hidden lg:block text-xs font-medium ${
                energyTheme.level === 'low' ? 'text-blue-700' :
                energyTheme.level === 'high' ? 'text-sunset-700' : 'text-slate-600'
              }`}>
                {energyTheme.label}
              </span>
              {energyTheme.suggestPlanB && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
              )}
            </button>

            <button
              onClick={() => openPanel('settings')}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg transition-colors"
              style={{ minWidth: minTouchTarget, minHeight: minTouchTarget }}
              aria-label="Open settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {actions}

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg transition-colors"
                style={{ minHeight: minTouchTarget }}
              >
                <div className="w-6 h-6 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-full flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-xl shadow-xl overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-100">
                      <p className="text-xs text-slate-500">Signed in</p>
                    </div>
                    <button
                      onClick={() => void handleSignOut()}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>
      <UserContextPanel isOpen={showContextPanel} onClose={() => setShowContextPanel(false)} />
    </>
  );
}

export default ResponsiveFloatingHeader;
