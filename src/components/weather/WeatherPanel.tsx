/**
 * WeatherPanel Component
 *
 * Main weather panel content showing:
 * - Current conditions
 * - 7-day forecast with flash flood risk
 * - Flash flood alerts
 * - Malaysian weather tips
 */

import { motion } from 'framer-motion';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  RefreshCw,
  MapPin,
  Droplets,
  Wind,
  Thermometer,
  Clock,
  ChevronRight,
} from 'lucide-react';

import { FlashFloodAlert, MalaysiaWeatherTips } from './FlashFloodAlert';
import { WeatherIcon } from './WeatherIcon';
import {
  formatTemperatureAtom,
  setWeatherLocationAtom,
} from '../../atoms/weatherAtoms';
import { useWeather } from '../../hooks/useWeather';
import { MALAYSIA_WEATHER_LOCATIONS } from '../../types/weather';
import { RISK_LEVEL_STYLES } from '../../utils/weatherUtils';

import type { ProcessedDailyForecast, WeatherLocation } from '../../types/weather';


interface WeatherPanelProps {
  className?: string;
}

export function WeatherPanel({ className = '' }: WeatherPanelProps) {
  const formatTemperature = useAtomValue(formatTemperatureAtom);
  const setLocation = useSetAtom(setWeatherLocationAtom);

  const {
    current,
    daily,
    flashFloodAlert,
    isLoading,
    error,
    lastFetch,
    location,
    refresh,
  } = useWeather();

  const handleLocationChange = (newLocation: WeatherLocation) => {
    setLocation(newLocation);
  };

  // Handle case when no location is set
  if (!location) {
    return (
      <div className={`flex flex-col h-full items-center justify-center text-center p-6 ${className}`}>
        <MapPin className="w-10 h-10 text-slate-300 mb-3" />
        <p className="text-slate-600 font-medium mb-1">No weather location set</p>
        <p className="text-sm text-slate-500">
          Set your home base or add a location to see weather information
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Current Weather Section */}
      <div className="px-4 py-4 border-b border-slate-200/50">
        {/* Location Selector */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <label htmlFor="weather-location-select" className="sr-only">
              Select weather location
            </label>
            <select
              id="weather-location-select"
              value={`${location.lat},${location.lng}`}
              onChange={(e) => {
                const loc = MALAYSIA_WEATHER_LOCATIONS.find(
                  (l) => `${l.lat},${l.lng}` === e.target.value
                );
                if (loc) {handleLocationChange(loc);}
              }}
              className="text-sm font-medium text-slate-700 bg-transparent border-none cursor-pointer hover:text-slate-900 focus:outline-none focus:ring-0"
            >
              {MALAYSIA_WEATHER_LOCATIONS.map((loc) => (
                <option key={`${loc.lat},${loc.lng}`} value={`${loc.lat},${loc.lng}`}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            aria-label="Refresh weather"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-3 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-red-500 text-sm">{error}</span>
            <button
              onClick={refresh}
              className="ml-auto text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !current && (
          <div className="animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-200 rounded-xl" />
              <div className="flex-1">
                <div className="h-8 w-24 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        )}

        {/* Current Weather Display */}
        {current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-4"
          >
            {/* Large Weather Icon */}
            <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
              <WeatherIcon condition={current.condition} size={40} />
            </div>

            {/* Temperature & Description */}
            <div className="flex-1">
              <div className="text-3xl font-bold text-slate-900">
                {formatTemperature(current.temperature)}
              </div>
              <p className="text-sm text-slate-600">{current.description}</p>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-col gap-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <span>{current.humidity}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-slate-400" />
                <span>{Math.round(current.windSpeed)} km/h</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Last Updated */}
        {lastFetch && (
          <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span>
              Updated {lastFetch.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Flash Flood Alert */}
        {flashFloodAlert && (
          <div className="px-4 pt-4">
            <FlashFloodAlert alert={flashFloodAlert} />
          </div>
        )}

        {/* 7-Day Forecast */}
        <div className="px-4 py-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">7-Day Forecast</h3>

          {daily.length === 0 && isLoading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-slate-100 rounded-lg" />
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            {daily.map((day, index) => (
              <ForecastDayRow key={day.date} day={day} index={index} />
            ))}
          </div>
        </div>

        {/* Malaysia Weather Tips */}
        <div className="px-4 pb-4">
          <MalaysiaWeatherTips />
        </div>
      </div>
    </div>
  );
}

/**
 * Single forecast day row component
 */
function ForecastDayRow({ day, index }: { day: ProcessedDailyForecast; index: number }) {
  const formatTemperature = useAtomValue(formatTemperatureAtom);
  const riskStyles = RISK_LEVEL_STYLES[day.flashFloodRisk];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg
        ${day.flashFloodRisk !== 'low' ? `${riskStyles.bg} ${riskStyles.border} border` : 'hover:bg-slate-50'}
        transition-colors
      `}
    >
      {/* Day Name */}
      <div className="w-10 text-sm font-medium text-slate-700">
        {index === 0 ? 'Today' : day.dayOfWeek}
      </div>

      {/* Weather Icon */}
      <WeatherIcon condition={day.condition} size={20} />

      {/* Precipitation Probability */}
      <div className="flex items-center gap-1 w-12 text-xs text-slate-500">
        <Droplets className="w-3 h-3 text-blue-400" />
        <span>{day.precipitationProbability}%</span>
      </div>

      {/* Temperature Range */}
      <div className="flex-1 flex items-center gap-1.5">
        <div className="flex items-center gap-1">
          <Thermometer className="w-3 h-3 text-slate-400" />
          <span className="text-sm font-medium text-slate-900">
            {formatTemperature(day.tempMax)}
          </span>
        </div>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-500">{formatTemperature(day.tempMin)}</span>
      </div>

      {/* Risk Badge */}
      {day.flashFloodRisk !== 'low' && (
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${riskStyles.bg} ${riskStyles.text}`}>
          {day.flashFloodRisk === 'severe' ? '⚠️' : day.flashFloodRisk === 'high' ? '!' : '~'}
        </span>
      )}

      <ChevronRight className="w-4 h-4 text-slate-300" />
    </motion.div>
  );
}
