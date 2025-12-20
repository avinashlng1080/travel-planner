import { Droplets, Wind, Eye, Thermometer } from 'lucide-react';

import { WeatherIcon } from './WeatherIcon';
import { GlassCard } from '../ui/GlassPanel';

import type { ProcessedCurrentWeather, ProcessedDailyForecast } from '../../types/weather';

interface WeatherCardProps {
  current?: ProcessedCurrentWeather;
  forecast?: ProcessedDailyForecast;
  isLoading?: boolean;
  className?: string;
}

/**
 * Glassmorphic detailed weather card for RightDetailPanel
 * Shows current conditions OR daily forecast with detailed metrics
 */
export function WeatherCard({ current, forecast, isLoading, className = '' }: WeatherCardProps) {
  if (isLoading) {
    return (
      <GlassCard hover={false} className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-4" role="status" aria-busy="true">
          <div className="h-20 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-slate-200 rounded-lg" />
            <div className="h-16 bg-slate-200 rounded-lg" />
            <div className="h-16 bg-slate-200 rounded-lg" />
            <div className="h-16 bg-slate-200 rounded-lg" />
          </div>
        </div>
      </GlassCard>
    );
  }

  // Determine which data to display
  const data = current || forecast;
  if (!data) {return null;}

  const isCurrent = 'temperature' in data;

  // Extract common properties
  const temp = isCurrent ? data.temperature : data.tempMax;
  const condition = data.condition;
  const description = isCurrent ? data.description : `${data.tempMin}° - ${data.tempMax}°`;

  return (
    <GlassCard hover={false} className={`p-4 ${className}`}>
      {/* Main weather display */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200">
          <WeatherIcon condition={condition} size={32} />
        </div>
        <div className="flex-1">
          <div className="text-3xl font-bold text-slate-900">{Math.round(temp)}°</div>
          <div className="text-sm text-slate-600 capitalize">
            {description}
          </div>
        </div>
      </div>

      {/* Detailed metrics grid */}
      <dl className="grid grid-cols-2 gap-3">
        {/* Humidity */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50">
          <Droplets size={16} className="text-blue-500" aria-hidden="true" />
          <div>
            <dt className="text-xs text-slate-500">Humidity</dt>
            <dd className="text-sm font-semibold text-slate-900">
              {isCurrent && current ? `${Math.round(current.humidity)}%` : 'N/A'}
            </dd>
          </div>
        </div>

        {/* Precipitation */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50">
          <Droplets size={16} className="text-blue-600" aria-label="Precipitation" />
          <div>
            <dt className="text-xs text-slate-500">Rain</dt>
            <dd className="text-sm font-semibold text-slate-900">
              {forecast ? `${Math.round(forecast.precipitationProbability)}%` :
               current ? `${current.precipitation}mm` : 'N/A'}
            </dd>
          </div>
        </div>

        {/* Wind */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/50">
          <Wind size={16} className="text-slate-500" aria-label="Wind speed" />
          <div>
            <dt className="text-xs text-slate-500">Wind</dt>
            <dd className="text-sm font-semibold text-slate-900">
              {isCurrent && current ? `${Math.round(current.windSpeed)} km/h` : 'N/A'}
            </dd>
          </div>
        </div>

        {/* Flash Flood Risk (forecast only) */}
        {forecast && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/50">
            <Eye size={16} className="text-amber-600" aria-label="Flash flood risk level" />
            <div>
              <dt className="text-xs text-slate-500">Flood Risk</dt>
              <dd className="text-sm font-semibold capitalize text-slate-900">
                {forecast.flashFloodRisk}
              </dd>
            </div>
          </div>
        )}

        {/* Temperature range (forecast only) */}
        {forecast && !isCurrent && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50/50">
            <Thermometer size={16} className="text-orange-500" aria-label="Temperature range" />
            <div>
              <dt className="text-xs text-slate-500">Range</dt>
              <dd className="text-sm font-semibold text-slate-900">
                {Math.round(forecast.tempMin)}° - {Math.round(forecast.tempMax)}°
              </dd>
            </div>
          </div>
        )}
      </dl>

      {/* Last updated (current only) */}
      {isCurrent && current && (
        <div className="mt-3 pt-3 border-t border-slate-200/50">
          <div className="text-xs text-slate-500">
            Updated {current.updatedAt.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
