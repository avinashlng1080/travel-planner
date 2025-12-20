/**
 * WeatherIcon Component
 *
 * Maps WMO weather codes to appropriate Lucide icons
 * with consistent sizing and styling
 */

import {
  Sun,
  Cloud,
  CloudSun,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudLightning,
  Snowflake,
  type LucideIcon,
} from 'lucide-react';

import type { WeatherCondition } from '../../types/weather';

interface WeatherIconProps {
  condition: WeatherCondition;
  size?: number;
  className?: string;
  'aria-label'?: string;
}

const CONDITION_ICONS: Record<WeatherCondition, LucideIcon> = {
  clear: Sun,
  'partly-cloudy': CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  'heavy-rain': CloudRain,
  storm: CloudLightning,
  snow: Snowflake,
};

const CONDITION_COLORS: Record<WeatherCondition, string> = {
  clear: 'text-amber-500',
  'partly-cloudy': 'text-amber-400',
  cloudy: 'text-slate-400',
  fog: 'text-slate-400',
  drizzle: 'text-blue-400',
  rain: 'text-blue-500',
  'heavy-rain': 'text-blue-600',
  storm: 'text-purple-500',
  snow: 'text-cyan-400',
};

export function WeatherIcon({ condition, size = 24, className = '', 'aria-label': ariaLabel }: WeatherIconProps) {
  const Icon = CONDITION_ICONS[condition];
  const colorClass = CONDITION_COLORS[condition];

  return <Icon size={size} className={`${colorClass} ${className}`} aria-label={ariaLabel} />;
}

/**
 * Animated weather icon for indicators
 */
export function AnimatedWeatherIcon({ condition, size = 24, className = '', 'aria-label': ariaLabel }: WeatherIconProps) {
  const Icon = CONDITION_ICONS[condition];
  const colorClass = CONDITION_COLORS[condition];

  // Add subtle animation for certain conditions
  const animationClass =
    condition === 'storm'
      ? 'animate-pulse'
      : condition === 'heavy-rain'
        ? 'animate-bounce'
        : '';

  return <Icon size={size} className={`${colorClass} ${animationClass} ${className}`} aria-label={ariaLabel} />;
}
