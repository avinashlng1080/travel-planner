/**
 * FlashFloodAlert Component
 *
 * Displays flash flood warnings with severity-based styling
 * Includes recommendations and Plan B suggestions for Malaysia travel
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CloudRain, Droplets, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { FlashFloodAlert as FlashFloodAlertType, FlashFloodRiskLevel } from '../../types/weather';
import { RISK_LEVEL_STYLES, MALAYSIA_WEATHER_TIPS } from '../../utils/weatherUtils';

interface FlashFloodAlertProps {
  alert: FlashFloodAlertType;
  compact?: boolean;
}

const RISK_ICONS: Record<FlashFloodRiskLevel, typeof AlertTriangle> = {
  low: Droplets,
  moderate: CloudRain,
  high: AlertTriangle,
  severe: ShieldAlert,
};

export function FlashFloodAlert({ alert, compact = false }: FlashFloodAlertProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const styles = RISK_LEVEL_STYLES[alert.level];
  const Icon = RISK_ICONS[alert.level];

  if (compact) {
    return (
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border
          ${styles.bg} ${styles.border}
          hover:brightness-95 transition-all
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Icon className={`w-5 h-5 ${styles.icon} flex-shrink-0`} />
        <div className="flex-1 text-left">
          <p className={`text-sm font-semibold ${styles.text}`}>{alert.title}</p>
          <p className={`text-xs ${styles.text} opacity-80`}>
            {alert.affectedDays.join(', ')}
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className={`w-4 h-4 ${styles.icon}`} />
        ) : (
          <ChevronDown className={`w-4 h-4 ${styles.icon}`} />
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border-2 overflow-hidden ${styles.bg} ${styles.border}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-inherit">
        <div className={`p-2 rounded-lg ${styles.bg} bg-opacity-50`}>
          <Icon className={`w-5 h-5 ${styles.icon}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${styles.text}`}>{alert.title}</h3>
          <p className={`text-xs ${styles.text} opacity-70`}>
            Affected: {alert.affectedDays.join(', ')}
          </p>
        </div>
        <span
          className={`px-2.5 py-1 text-xs font-bold rounded-full ${styles.bg} ${styles.text} border ${styles.border}`}
        >
          {styles.label}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {/* Message */}
        <p className={`text-sm ${styles.text}`}>{alert.message}</p>

        {/* Recommendation */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-white/50">
          <AlertTriangle className={`w-4 h-4 ${styles.icon} mt-0.5 flex-shrink-0`} />
          <p className={`text-sm ${styles.text}`}>{alert.recommendation}</p>
        </div>

        {/* Plan B Suggestion */}
        {alert.planBSuggestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200"
          >
            <span className="text-lg">💡</span>
            <div>
              <p className="text-xs font-semibold text-blue-800 mb-1">Plan B Suggestion</p>
              <p className="text-sm text-blue-700">{alert.planBSuggestion}</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Expandable weather tips section
 */
export function MalaysiaWeatherTips() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🇲🇾</span>
          <span className="text-sm font-medium text-slate-700">Malaysia Weather Tips</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 space-y-4">
              {/* Monsoon Info */}
              <div>
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Monsoon Season
                </h4>
                <ul className="space-y-1.5">
                  {MALAYSIA_WEATHER_TIPS.monsoon.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-blue-500 mt-1">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Toddler Safety */}
              <div>
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Toddler Safety
                </h4>
                <ul className="space-y-1.5">
                  {MALAYSIA_WEATHER_TIPS.toddlerSafety.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-pink-500 mt-1">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Timing Tips */}
              <div>
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Best Times for Activities
                </h4>
                <ul className="space-y-1.5">
                  {MALAYSIA_WEATHER_TIPS.timing.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-green-500 mt-1">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
