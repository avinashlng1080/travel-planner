import { Droplets } from 'lucide-react';

import { WeatherIcon } from './WeatherIcon';

import type { ProcessedDailyForecast } from '../../types/weather';

interface WeatherBadgeProps {
  forecast: ProcessedDailyForecast;
  showRainChance?: boolean;
  className?: string;
}

/**
 * Compact glassmorphic weather badge for day headers
 * Shows: [☀️ 32° 💧20%]
 */
export function WeatherBadge({
  forecast,
  showRainChance = true,
  className = ''
}: WeatherBadgeProps) {
  const { condition, tempMax, precipitationProbability } = forecast;

  // Construct comprehensive aria-label
  const ariaLabel = `Weather: ${condition.replace('-', ' ')}, ${Math.round(tempMax)} degrees${
    showRainChance && precipitationProbability > 0
      ? `, ${Math.round(precipitationProbability)}% chance of rain`
      : ''
  }`;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`
        inline-flex items-center gap-1.5
        bg-white/80 backdrop-blur-sm
        border border-slate-200/50
        rounded-full
        px-2.5 py-1
        text-xs font-medium
        ${className}
      `}
    >
      <WeatherIcon condition={condition} size={14} aria-label={condition.replace('-', ' ')} />
      <span className="text-slate-700" aria-label="Temperature">{Math.round(tempMax)}°</span>
      {showRainChance && precipitationProbability > 0 && (
        <>
          <Droplets size={12} className="text-blue-500" aria-label="Rain probability" />
          <span className="text-blue-600">{Math.round(precipitationProbability)}%</span>
        </>
      )}
    </div>
  );
}
