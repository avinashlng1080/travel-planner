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

  return (
    <div
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
      <WeatherIcon condition={condition} size={14} />
      <span className="text-slate-700">{Math.round(tempMax)}°</span>
      {showRainChance && precipitationProbability > 0 && (
        <>
          <Droplets size={12} className="text-blue-500" />
          <span className="text-blue-600">{Math.round(precipitationProbability)}%</span>
        </>
      )}
    </div>
  );
}
