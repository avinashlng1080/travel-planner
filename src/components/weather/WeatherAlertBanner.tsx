import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

import { GlassBadge } from '../ui/GlassPanel';

import type { FlashFloodAlert, FlashFloodRiskLevel } from '../../types/weather';

interface WeatherAlertBannerProps {
  alert: FlashFloodAlert;
  onDismiss?: () => void;
}

const SEVERITY_COLORS: Record<FlashFloodRiskLevel, {
  bg: string;
  border: string;
  text: string;
  badge: 'amber' | 'red';
}> = {
  low: {
    bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
    border: 'border-green-200',
    text: 'text-green-900',
    badge: 'amber',
  },
  moderate: {
    bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    badge: 'amber',
  },
  high: {
    bg: 'bg-gradient-to-r from-orange-50 to-red-50',
    border: 'border-orange-300',
    text: 'text-orange-900',
    badge: 'red',
  },
  severe: {
    bg: 'bg-gradient-to-r from-red-50 to-rose-50',
    border: 'border-red-300',
    text: 'text-red-900',
    badge: 'red',
  },
};

/**
 * Animated warning banner for monsoon/flash flood alerts
 * Displays prominent warnings with severity-based styling
 */
export function WeatherAlertBanner({ alert, onDismiss }: WeatherAlertBannerProps) {
  const colors = SEVERITY_COLORS[alert.level];

  return (
    <AnimatePresence>
      <motion.div
        role="alert"
        aria-live="polite"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`
          relative
          ${colors.bg}
          backdrop-blur-xl
          border ${colors.border}
          rounded-xl
          p-4
          shadow-lg
        `}
      >
        {/* Header with icon, title, and severity badge */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle
              size={20}
              className={alert.level === 'severe' || alert.level === 'high'
                ? 'text-red-600'
                : 'text-amber-600'
              }
              aria-label="Warning"
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold ${colors.text}`}>
                {alert.title}
              </h3>
              <GlassBadge color={colors.badge} className="uppercase text-[10px] font-bold">
                {alert.level}
              </GlassBadge>
            </div>

            {/* Message */}
            <p className={`text-sm ${colors.text} mb-2`}>
              {alert.message}
            </p>

            {/* Recommendation */}
            <div className={`text-xs ${colors.text} mb-2`}>
              <span className="font-semibold">Recommendation:</span> {alert.recommendation}
            </div>

            {/* Plan B Suggestion (if available) */}
            {alert.planBSuggestion && (
              <div className="mt-2 p-2 rounded-lg bg-white/50 border border-current/10">
                <div className={`text-xs ${colors.text}`}>
                  <span className="font-semibold">💡 Plan B:</span> {alert.planBSuggestion}
                </div>
              </div>
            )}

            {/* Affected Days */}
            {alert.affectedDays.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {alert.affectedDays.map((day) => (
                  <span
                    key={day}
                    className={`
                      inline-block px-2 py-0.5
                      text-[10px] font-medium
                      rounded-full
                      bg-white/60 ${colors.text}
                    `}
                  >
                    {day}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`
                flex-shrink-0
                p-3 rounded-lg
                hover:bg-white/50
                focus:ring-2 focus:ring-offset-1 focus:ring-current
                transition-colors duration-200
                ${colors.text}
              `}
              aria-label="Dismiss alert"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
