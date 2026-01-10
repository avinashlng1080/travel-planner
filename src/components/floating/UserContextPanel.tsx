import { motion, AnimatePresence } from 'framer-motion';
import { useAtom, useSetAtom } from 'jotai';
import { Battery, BatteryLow, BatteryMedium, Baby, Thermometer, MapPin, X, Zap, Sun, Moon, ArrowRight } from 'lucide-react';

import {
  userContextAtom,
  updateEnergyLevelAtom,
  updateToddlerMoodAtom,
  updateHealthStatusAtom,
} from '@/atoms/userContextAtoms';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useEnergyTheme } from '@/hooks/useEnergyTheme';

interface UserContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserContextPanel({ isOpen, onClose }: UserContextPanelProps) {
  const [userContext] = useAtom(userContextAtom);
  const updateEnergy = useSetAtom(updateEnergyLevelAtom);
  const updateMood = useSetAtom(updateToddlerMoodAtom);
  const updateHealth = useSetAtom(updateHealthStatusAtom);
  const theme = useEnergyTheme();

  const { currentLocation, permission, isTracking, requestPermission, startTracking, stopTracking } =
    useGeolocation();

  const handleLocationToggle = async () => {
    if (permission === 'prompt' || permission === 'unavailable') {
      const granted = await requestPermission();
      if (granted) {
        startTracking();
      }
    } else if (permission === 'granted') {
      if (isTracking) {
        stopTracking();
      } else {
        startTracking();
      }
    }
  };

  // Get the energy icon component
  const EnergyIcon = theme.icon === 'zap' ? Zap : theme.icon === 'moon' ? Moon : Sun;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className={`fixed right-4 top-20 w-80 backdrop-blur-xl rounded-2xl shadow-xl border z-50 overflow-hidden transition-colors duration-500 ${
            theme.level === 'low'
              ? 'bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-100 border-blue-200/50'
              : theme.level === 'high'
              ? 'bg-gradient-to-br from-white via-sunset-50/30 to-ocean-50/20 border-sunset-200/50'
              : 'bg-white/95 border-slate-200/50'
          }`}
        >
          {/* Header with energy indicator */}
          <div className={`flex items-center justify-between p-4 border-b transition-colors duration-500 ${
            theme.level === 'low'
              ? 'border-blue-200/50 bg-gradient-to-r from-blue-50 to-slate-50'
              : theme.level === 'high'
              ? 'border-sunset-200/50 bg-gradient-to-r from-sunset-50 to-ocean-50'
              : 'border-slate-200/50'
          }`}>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800">How are you feeling?</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-500 ${
                theme.level === 'low'
                  ? 'bg-blue-100 text-blue-700'
                  : theme.level === 'high'
                  ? 'bg-sunset-100 text-sunset-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                <EnergyIcon className="w-3 h-3" />
                {theme.label}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="p-4 space-y-5">
            {/* Plan B Suggestion Banner */}
            <AnimatePresence>
              {theme.suggestPlanB && theme.message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl p-3 border border-blue-200/50"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Moon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-semibold text-blue-800">Plan B Mode</span>
                        <ArrowRight className="w-3 h-3 text-blue-600" />
                      </div>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        {theme.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" />
                Location Tracking
              </label>
              <button
                onClick={handleLocationToggle}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  isTracking
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : permission === 'denied'
                    ? 'bg-red-100 text-red-700 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                disabled={permission === 'denied'}
              >
                {isTracking
                  ? `Tracking (${currentLocation?.accuracy.toFixed(0)}m accuracy)`
                  : permission === 'denied'
                  ? 'Location access denied'
                  : 'Enable location'}
              </button>
              {permission === 'denied' && (
                <p className="text-xs text-slate-500 mt-1">
                  Please enable location in your browser settings
                </p>
              )}
            </div>

            {/* Energy Level */}
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                <Battery className="w-4 h-4" />
                Your Energy Level
              </label>
              <div className="flex gap-2" role="group" aria-label="Energy level selection">
                <button
                  onClick={() => { updateEnergy('high'); }}
                  aria-label="Set energy level to high"
                  aria-pressed={userContext.energyLevel === 'high'}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-300 flex flex-col items-center gap-1 ${
                    userContext.energyLevel === 'high'
                      ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 ring-2 ring-green-500 shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Battery className="w-4 h-4" aria-hidden="true" />
                  High
                </button>
                <button
                  onClick={() => { updateEnergy('medium'); }}
                  aria-label="Set energy level to medium"
                  aria-pressed={userContext.energyLevel === 'medium'}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-300 flex flex-col items-center gap-1 ${
                    userContext.energyLevel === 'medium'
                      ? 'bg-gradient-to-br from-yellow-100 to-amber-100 text-yellow-700 ring-2 ring-yellow-500 shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <BatteryMedium className="w-4 h-4" aria-hidden="true" />
                  Medium
                </button>
                <button
                  onClick={() => { updateEnergy('low'); }}
                  aria-label="Set energy level to low"
                  aria-pressed={userContext.energyLevel === 'low'}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-300 flex flex-col items-center gap-1 ${
                    userContext.energyLevel === 'low'
                      ? 'bg-gradient-to-br from-blue-100 to-slate-100 text-blue-700 ring-2 ring-blue-500 shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <BatteryLow className="w-4 h-4" aria-hidden="true" />
                  Low
                </button>
              </div>
              {/* Energy level hint */}
              <p className={`text-xs mt-2 transition-colors duration-300 ${
                userContext.energyLevel === 'low' ? 'text-blue-600' :
                userContext.energyLevel === 'high' ? 'text-green-600' : 'text-slate-500'
              }`}>
                {userContext.energyLevel === 'low'
                  ? 'Rest mode active - showing easier, indoor activities'
                  : userContext.energyLevel === 'high'
                  ? 'Adventure mode - all activities available!'
                  : 'Balanced mode - flexible itinerary'}
              </p>
            </div>

            {/* Toddler Mood */}
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                <Baby className="w-4 h-4" />
                Toddler's Mood
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'happy', emoji: '\uD83D\uDE0A', label: 'Happy', activeClass: 'bg-gradient-to-br from-pink-100 to-rose-100 text-pink-700 ring-2 ring-pink-500' },
                  { value: 'tired', emoji: '\uD83D\uDE34', label: 'Tired', activeClass: 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 ring-2 ring-blue-500' },
                  { value: 'fussy', emoji: '\uD83D\uDE2B', label: 'Fussy', activeClass: 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 ring-2 ring-amber-500' },
                  { value: 'sleeping', emoji: '\uD83D\uDCA4', label: 'Sleeping', activeClass: 'bg-gradient-to-br from-slate-100 to-blue-100 text-slate-700 ring-2 ring-slate-400' },
                ].map(({ value, emoji, label, activeClass }) => (
                  <button
                    key={value}
                    onClick={() =>
                      { updateMood(value as 'happy' | 'tired' | 'fussy' | 'sleeping'); }
                    }
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-300 shadow-sm ${
                      userContext.toddlerMood === value
                        ? activeClass
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Health Status */}
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                <Thermometer className="w-4 h-4" />
                Health Status
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => { updateHealth('good'); }}
                  className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    userContext.healthStatus === 'good'
                      ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 ring-2 ring-green-500 shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Feeling Good
                </button>
                <button
                  onClick={() => { updateHealth('mild_sickness'); }}
                  className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    userContext.healthStatus === 'mild_sickness'
                      ? 'bg-gradient-to-br from-yellow-100 to-amber-100 text-yellow-700 ring-2 ring-yellow-500 shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Mild Sickness
                </button>
                <button
                  onClick={() => { updateHealth('needs_rest'); }}
                  className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    userContext.healthStatus === 'needs_rest'
                      ? 'bg-gradient-to-br from-red-100 to-rose-100 text-red-700 ring-2 ring-red-500 shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Need Rest
                </button>
              </div>
            </div>

            {/* Current Mode Summary */}
            <div className={`rounded-xl p-3 border transition-all duration-500 ${
              theme.level === 'low'
                ? 'bg-gradient-to-r from-blue-50 to-slate-50 border-blue-200'
                : theme.level === 'high'
                ? 'bg-gradient-to-r from-sunset-50 to-ocean-50 border-sunset-200'
                : 'bg-gradient-to-r from-slate-50 to-white border-slate-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <EnergyIcon className={`w-4 h-4 ${
                  theme.level === 'low' ? 'text-blue-600' :
                  theme.level === 'high' ? 'text-sunset-600' : 'text-slate-600'
                }`} />
                <span className={`text-sm font-semibold ${
                  theme.level === 'low' ? 'text-blue-800' :
                  theme.level === 'high' ? 'text-sunset-800' : 'text-slate-800'
                }`}>
                  {theme.level === 'low' ? 'Rest Mode Active' :
                   theme.level === 'high' ? 'Adventure Mode' : 'Balanced Mode'}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${
                theme.level === 'low' ? 'text-blue-700' :
                theme.level === 'high' ? 'text-sunset-700' : 'text-slate-600'
              }`}>
                {theme.level === 'low'
                  ? 'UI shifted to calm colors. Plan B activities prioritized for easier exploration.'
                  : theme.level === 'high'
                  ? 'Vibrant mode enabled! All activities and adventures are highlighted.'
                  : 'Standard mode with flexible itinerary options.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
