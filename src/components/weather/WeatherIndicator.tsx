/**
 * WeatherIndicator Component
 *
 * A persistent floating badge on the map showing current weather conditions.
 * Positioned above map zoom controls. Clicking opens the weather panel.
 *
 * Features:
 * - Glassmorphic styling matching app theme
 * - Risk-level colored border for severe weather
 * - Temperature display with weather icon
 * - Subtle animations for severe conditions
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useAtomValue, useSetAtom } from 'jotai';
import { RefreshCw, CloudOff } from 'lucide-react';

import { AnimatedWeatherIcon } from './WeatherIcon';
import { openPanelAtom } from '../../atoms/floatingPanelAtoms';
import {
  weatherIndicatorVisibleAtom,
  formatTemperatureAtom,
} from '../../atoms/weatherAtoms';
import { useWeather } from '../../hooks/useWeather';

import type { FlashFloodRiskLevel } from '../../types/weather';

const RISK_BORDER_COLORS: Record<FlashFloodRiskLevel, string> = {
  low: 'border-slate-200/50',
  moderate: 'border-yellow-400/60',
  high: 'border-orange-400/70',
  severe: 'border-red-500/80',
};

const RISK_PULSE_CLASSES: Record<FlashFloodRiskLevel, string> = {
  low: '',
  moderate: '',
  high: '',
  severe: 'animate-pulse',
};

export function WeatherIndicator() {
  const isVisible = useAtomValue(weatherIndicatorVisibleAtom);
  const formatTemperature = useAtomValue(formatTemperatureAtom);
  const openPanel = useSetAtom(openPanelAtom);

  const { current, flashFloodAlert, isLoading, error, refresh } = useWeather();

  // Determine risk level from flash flood alert
  const riskLevel: FlashFloodRiskLevel = flashFloodAlert?.level || 'low';
  const borderColor = RISK_BORDER_COLORS[riskLevel];
  const pulseClass = RISK_PULSE_CLASSES[riskLevel];

  const handleClick = () => {
    openPanel('weather');
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    refresh();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-24 right-4 z-40"
      >
        <motion.button
          onClick={handleClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            flex items-center gap-2 px-3 py-2.5
            bg-white/95 backdrop-blur-xl
            border-2 ${borderColor}
            rounded-xl shadow-lg
            hover:shadow-xl hover:bg-white
            transition-all duration-200
            min-h-[48px]
            ${pulseClass}
          `}
          aria-label="Open weather panel"
        >
          {/* Loading State */}
          {isLoading && !current && (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
              <span className="text-sm text-slate-500">Loading...</span>
            </div>
          )}

          {/* Error State */}
          {error && !current && (
            <div className="flex items-center gap-2">
              <CloudOff className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-500">Offline</span>
            </div>
          )}

          {/* Weather Display */}
          {current && (
            <>
              <AnimatedWeatherIcon condition={current.condition} size={22} />
              <span className="font-semibold text-slate-900 text-sm">
                {formatTemperature(current.temperature)}
              </span>

              {/* Risk Indicator Dot */}
              {riskLevel !== 'low' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`
                    w-2.5 h-2.5 rounded-full
                    ${riskLevel === 'moderate' ? 'bg-yellow-400' : ''}
                    ${riskLevel === 'high' ? 'bg-orange-500' : ''}
                    ${riskLevel === 'severe' ? 'bg-red-500 animate-ping' : ''}
                  `}
                />
              )}

              {/* Refresh Icon (visible on hover) */}
              <motion.div
                role="button"
                tabIndex={0}
                onClick={handleRefresh}
                onKeyDown={(e) => e.key === 'Enter' && handleRefresh(e as unknown as React.MouseEvent)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`
                  ml-1 p-1 rounded-md cursor-pointer
                  text-slate-400 hover:text-slate-600
                  hover:bg-slate-100
                  transition-colors
                  ${isLoading ? 'animate-spin pointer-events-none' : ''}
                `}
                aria-label="Refresh weather"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </motion.div>
            </>
          )}
        </motion.button>

        {/* Severe Weather Alert Badge */}
        {riskLevel === 'severe' && flashFloodAlert && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-2 -right-2"
          >
            <span className="flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 items-center justify-center">
                <span className="text-[10px] font-bold text-white">!</span>
              </span>
            </span>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
