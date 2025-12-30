import { motion, AnimatePresence } from 'framer-motion';
import { useAtom, useSetAtom } from 'jotai';
import { Battery, BatteryLow, BatteryMedium, Baby, Thermometer, MapPin, X } from 'lucide-react';
import {
  userContextAtom,
  updateEnergyLevelAtom,
  updateToddlerMoodAtom,
  updateHealthStatusAtom,
} from '@/atoms/userContextAtoms';
import { useGeolocation } from '@/hooks/useGeolocation';

interface UserContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserContextPanel({ isOpen, onClose }: UserContextPanelProps) {
  const [userContext] = useAtom(userContextAtom);
  const updateEnergy = useSetAtom(updateEnergyLevelAtom);
  const updateMood = useSetAtom(updateToddlerMoodAtom);
  const updateHealth = useSetAtom(updateHealthStatusAtom);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-4 top-20 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200/50">
            <h3 className="font-semibold text-slate-800">How are you feeling?</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="p-4 space-y-5">
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
              <div className="flex gap-2">
                {[
                  { value: 'high', icon: Battery, label: 'High', color: 'green' },
                  { value: 'medium', icon: BatteryMedium, label: 'Medium', color: 'yellow' },
                  { value: 'low', icon: BatteryLow, label: 'Low', color: 'red' },
                ].map(({ value, icon: Icon, label, color }) => (
                  <button
                    key={value}
                    onClick={() => updateEnergy(value as 'high' | 'medium' | 'low')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
                      userContext.energyLevel === value
                        ? `bg-${color}-100 text-${color}-700 ring-2 ring-${color}-500`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toddler Mood */}
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                <Baby className="w-4 h-4" />
                Toddler's Mood
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'happy', emoji: '😊', label: 'Happy' },
                  { value: 'tired', emoji: '😴', label: 'Tired' },
                  { value: 'fussy', emoji: '😫', label: 'Fussy' },
                  { value: 'sleeping', emoji: '💤', label: 'Sleeping' },
                ].map(({ value, emoji, label }) => (
                  <button
                    key={value}
                    onClick={() =>
                      updateMood(value as 'happy' | 'tired' | 'fussy' | 'sleeping')
                    }
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      userContext.toddlerMood === value
                        ? 'bg-pink-100 text-pink-700 ring-2 ring-pink-500'
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
                {[
                  { value: 'good', label: 'Feeling Good', color: 'green' },
                  { value: 'mild_sickness', label: 'Mild Sickness', color: 'yellow' },
                  { value: 'needs_rest', label: 'Need Rest', color: 'red' },
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() =>
                      updateHealth(value as 'good' | 'mild_sickness' | 'needs_rest')
                    }
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                      userContext.healthStatus === value
                        ? `bg-${color}-100 text-${color}-700 ring-2 ring-${color}-500`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Suggestion based on context */}
            {(userContext.energyLevel === 'low' ||
              userContext.toddlerMood === 'fussy' ||
              userContext.healthStatus !== 'good') && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-sm text-blue-800">
                  <strong>AI Suggestion:</strong>{' '}
                  {userContext.healthStatus !== 'good'
                    ? 'Consider indoor activities near medical facilities. Sunway Velocity has a clinic nearby.'
                    : userContext.toddlerMood === 'fussy'
                    ? 'A quiet indoor playground or return to home base might help.'
                    : 'Plan B activities (indoor malls) might be better today.'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
