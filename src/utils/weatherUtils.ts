/**
 * Weather Utility Functions
 *
 * - WMO weather code mappings
 * - Flash flood risk calculation for Malaysia monsoon season
 * - Weather description helpers
 * - Malaysian-specific safety tips
 */

import type {
  WeatherCondition,
  FlashFloodRiskLevel,
  FlashFloodAlert,
  ProcessedDailyForecast,
} from '../types/weather';

/**
 * WMO Weather Code to Condition Mapping
 * https://open-meteo.com/en/docs#weathervariables
 */
export const WEATHER_CODE_MAP: Record<number, WeatherCondition> = {
  // Clear
  0: 'clear',
  // Mainly clear, partly cloudy, and overcast
  1: 'clear',
  2: 'partly-cloudy',
  3: 'cloudy',
  // Fog and depositing rime fog
  45: 'fog',
  48: 'fog',
  // Drizzle: Light, moderate, and dense intensity
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  // Freezing drizzle
  56: 'drizzle',
  57: 'drizzle',
  // Rain: Slight, moderate and heavy intensity
  61: 'rain',
  63: 'rain',
  65: 'heavy-rain',
  // Freezing rain
  66: 'rain',
  67: 'heavy-rain',
  // Snow fall
  71: 'snow',
  73: 'snow',
  75: 'snow',
  77: 'snow',
  // Rain showers
  80: 'rain',
  81: 'rain',
  82: 'heavy-rain',
  // Snow showers
  85: 'snow',
  86: 'snow',
  // Thunderstorm
  95: 'storm',
  96: 'storm',
  99: 'storm',
};

/**
 * Weather condition to human-readable description
 */
export const WEATHER_DESCRIPTIONS: Record<WeatherCondition, string> = {
  clear: 'Clear skies',
  'partly-cloudy': 'Partly cloudy',
  cloudy: 'Cloudy',
  fog: 'Foggy',
  drizzle: 'Light drizzle',
  rain: 'Rainy',
  'heavy-rain': 'Heavy rain',
  storm: 'Thunderstorm',
  snow: 'Snow',
};

/**
 * Get weather condition from WMO code
 */
export function getWeatherCondition(code: number): WeatherCondition {
  return WEATHER_CODE_MAP[code] || 'cloudy';
}

/**
 * Get human-readable weather description from WMO code
 */
export function getWeatherDescription(code: number): string {
  const condition = getWeatherCondition(code);
  return WEATHER_DESCRIPTIONS[condition];
}

/**
 * Calculate flash flood risk level based on precipitation data
 *
 * Malaysian monsoon context (Dec-Jan is monsoon season on west coast):
 * - Severe: >50mm precipitation OR thunderstorm codes (95-99)
 * - High: >30mm OR >80% probability
 * - Moderate: >15mm OR >50% probability
 * - Low: Otherwise
 */
export function calculateFlashFloodRisk(
  precipitationSum: number,
  precipitationProbability: number,
  weatherCode: number
): FlashFloodRiskLevel {
  // Thunderstorm codes always severe
  if ([95, 96, 99].includes(weatherCode)) {
    return 'severe';
  }

  // Heavy rain codes with high precipitation
  if ([65, 67, 82].includes(weatherCode) && precipitationSum > 30) {
    return 'severe';
  }

  // Severe: >50mm precipitation OR >90% probability with rain
  if (precipitationSum > 50 || (precipitationProbability > 90 && precipitationSum > 20)) {
    return 'severe';
  }

  // High: >30mm OR >80% probability
  if (precipitationSum > 30 || precipitationProbability > 80) {
    return 'high';
  }

  // Moderate: >15mm OR >50% probability
  if (precipitationSum > 15 || precipitationProbability > 50) {
    return 'moderate';
  }

  return 'low';
}

/**
 * Risk level styling configuration
 */
export const RISK_LEVEL_STYLES: Record<FlashFloodRiskLevel, {
  bg: string;
  border: string;
  text: string;
  icon: string;
  label: string;
}> = {
  low: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'text-green-500',
    label: 'Low Risk',
  },
  moderate: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: 'text-yellow-500',
    label: 'Moderate Risk',
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    icon: 'text-orange-500',
    label: 'High Risk',
  },
  severe: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-500',
    label: 'Severe Risk',
  },
};

/**
 * Get flash flood recommendation based on risk level
 */
export function getFlashFloodRecommendation(level: FlashFloodRiskLevel): string {
  const recommendations: Record<FlashFloodRiskLevel, string> = {
    low: 'Great day for outdoor activities! Stay hydrated and bring sunscreen.',
    moderate:
      'Rain expected. Carry an umbrella and plan indoor backup activities for the afternoon.',
    high:
      'Heavy rain likely. Consider switching to Plan B with indoor activities. Avoid underpasses and low-lying areas.',
    severe:
      'Severe weather alert! Stay indoors. Avoid all outdoor activities, underpasses, and flooded roads. Monitor official MET Malaysia alerts.',
  };
  return recommendations[level];
}

/**
 * Get Plan B suggestion when rain is expected
 */
export function getPlanBSuggestion(level: FlashFloodRiskLevel): string | undefined {
  if (level === 'low') return undefined;

  const suggestions: Record<FlashFloodRiskLevel, string> = {
    moderate: 'Consider indoor alternatives like malls, Aquaria KLCC, or museum visits for afternoon activities.',
    high: 'Strongly recommend Plan B (indoor): Suria KLCC, Pavilion KL, or indoor playgrounds for your toddler.',
    severe: 'Use Plan B only: Stay at accommodations or nearby malls. Avoid travel until weather improves.',
    low: '', // Won't be used
  };
  return suggestions[level];
}

/**
 * Generate flash flood alert from forecast data
 */
export function generateFlashFloodAlert(
  dailyForecasts: ProcessedDailyForecast[]
): FlashFloodAlert | null {
  // Find the highest risk level in the forecast
  let maxRiskLevel: FlashFloodRiskLevel = 'low';
  const affectedDays: string[] = [];

  for (const day of dailyForecasts) {
    if (day.flashFloodRisk === 'severe') {
      maxRiskLevel = 'severe';
      affectedDays.push(day.dayOfWeek);
    } else if (day.flashFloodRisk === 'high' && maxRiskLevel !== 'severe') {
      maxRiskLevel = 'high';
      affectedDays.push(day.dayOfWeek);
    } else if (day.flashFloodRisk === 'moderate' && maxRiskLevel === 'low') {
      maxRiskLevel = 'moderate';
      affectedDays.push(day.dayOfWeek);
    }
  }

  // Return null if risk is low across all days
  if (maxRiskLevel === 'low') {
    return null;
  }

  const titles: Record<FlashFloodRiskLevel, string> = {
    low: '',
    moderate: 'Rain Advisory',
    high: 'Heavy Rain Warning',
    severe: 'Flash Flood Warning',
  };

  const messages: Record<FlashFloodRiskLevel, string> = {
    low: '',
    moderate: `Light to moderate rain expected on ${affectedDays.join(', ')}. Plan indoor backup activities.`,
    high: `Heavy rainfall expected on ${affectedDays.join(', ')}. Flash flooding possible in low-lying areas.`,
    severe: `Severe weather alert for ${affectedDays.join(', ')}. High risk of flash flooding and thunderstorms.`,
  };

  return {
    level: maxRiskLevel,
    title: titles[maxRiskLevel],
    message: messages[maxRiskLevel],
    recommendation: getFlashFloodRecommendation(maxRiskLevel),
    planBSuggestion: getPlanBSuggestion(maxRiskLevel),
    affectedDays,
  };
}

/**
 * Malaysian-specific weather tips
 */
export const MALAYSIA_WEATHER_TIPS = {
  monsoon: [
    'December-January is monsoon season on west coast Malaysia',
    'Flash floods are common in KL during heavy rain (esp. Jalan TAR, KLCC area)',
    'The SMART Tunnel helps manage stormwater but localized flooding still occurs',
    'Check MET Malaysia (@metmalaysia) and Public InfoBanjir for real-time alerts',
  ],
  toddlerSafety: [
    'Carry extra change of clothes for sudden rain',
    'Stay indoors during thunderstorms - lightning is very common',
    'Never walk near fast-moving drains during heavy rain',
    'Keep stroller covered during unexpected showers',
  ],
  timing: [
    'Plan outdoor activities for morning (before 2pm)',
    'Afternoon thunderstorms are common and usually last 30-90 minutes',
    "If caught in rain, shelter in place - don't rush through flooded areas",
    'Avoid driving through water-covered roads (depth is hard to judge)',
  ],
  locations: {
    klcc: 'Some streets get waterlogged; move indoors and avoid wading.',
    batuCaves: 'Stairs get slippery in rain; go early and skip if storming.',
    genting: 'Rain can be persistent; bring light rain jackets + anti-slip shoes.',
    cameron: 'Expect more frequent mist/rain; cooler temperatures.',
    putrajaya: 'Avoid walking long exposed lakeside paths in thunderstorms.',
  },
};

/**
 * Get day of week from date string
 */
export function getDayOfWeek(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Format time for display (e.g., "6:30 AM")
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Check if weather is considered "bad" for outdoor activities
 */
export function isBadWeather(condition: WeatherCondition): boolean {
  return ['heavy-rain', 'storm'].includes(condition);
}

/**
 * Check if weather requires caution but is still manageable
 */
export function isCautionWeather(condition: WeatherCondition): boolean {
  return ['rain', 'drizzle', 'fog'].includes(condition);
}
