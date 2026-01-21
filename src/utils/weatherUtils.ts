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
 * IMPORTANT: This is informational only. Always check MET Malaysia (@metmalaysia)
 * for official weather warnings and InfoBanjir for flood alerts.
 *
 * Realistic thresholds for Malaysian tropical climate:
 * - Brief afternoon thunderstorms (20-30mm) are NORMAL in KL and rarely cause floods
 * - Flash floods typically require sustained heavy rainfall (>60mm in 1-3 hours)
 * - The SMART Tunnel handles most stormwater in KL city center
 *
 * Risk levels (using AND logic - both conditions must be met):
 * - Severe: >80mm precipitation AND >85% probability (actual flood risk)
 * - High: >50mm AND >75% probability (significant rainfall)
 * - Moderate: >30mm AND >60% probability (plan indoor backup)
 * - Low: Normal tropical weather
 */
export function calculateFlashFloodRisk(
  precipitationSum: number,
  precipitationProbability: number,
  _weatherCode: number // Weather code no longer triggers auto-severe
): FlashFloodRiskLevel {
  // Severe: Requires BOTH heavy precipitation AND high probability
  // This indicates sustained heavy rainfall that could actually cause flooding
  if (precipitationSum > 80 && precipitationProbability > 85) {
    return 'severe';
  }

  // High: Significant rainfall expected with high confidence
  if (precipitationSum > 50 && precipitationProbability > 75) {
    return 'high';
  }

  // Moderate: Notable rain expected - worth having indoor backup plans
  if (precipitationSum > 30 && precipitationProbability > 60) {
    return 'moderate';
  }

  // Low: Normal tropical weather - brief showers are common and manageable
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
    label: 'Clear/Light',
  },
  moderate: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: 'text-yellow-500',
    label: 'Rainy',
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    icon: 'text-orange-500',
    label: 'Heavy Rain',
  },
  severe: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-500',
    label: 'Very Heavy',
  },
};

/**
 * Get weather recommendation based on risk level
 */
export function getFlashFloodRecommendation(level: FlashFloodRiskLevel): string {
  const recommendations: Record<FlashFloodRiskLevel, string> = {
    low: 'Typical tropical weather. Brief afternoon showers possible - carry an umbrella just in case.',
    moderate:
      'Heavier rain expected. Have indoor backup plans ready (malls, Aquaria KLCC, museums).',
    high:
      'Significant rainfall forecast. Recommend indoor activities. Check MET Malaysia for updates.',
    severe:
      'Heavy sustained rainfall expected. Stay flexible with plans and monitor MET Malaysia (@metmalaysia) for official alerts.',
  };
  return recommendations[level];
}

/**
 * Get Plan B suggestion when rain is expected
 */
export function getPlanBSuggestion(level: FlashFloodRiskLevel): string | undefined {
  if (level === 'low') {return undefined;}

  const suggestions: Record<FlashFloodRiskLevel, string> = {
    moderate: 'Good day to have Plan B ready: malls, Aquaria KLCC, or museum visits if rain persists.',
    high: 'Consider Plan B (indoor): Suria KLCC, Pavilion KL, or indoor playgrounds for your toddler.',
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
  // Risk level priority for comparison
  const riskPriority: Record<FlashFloodRiskLevel, number> = {
    low: 0,
    moderate: 1,
    high: 2,
    severe: 3,
  };

  // First pass: determine the maximum risk level
  let maxRiskLevel: FlashFloodRiskLevel = 'low';
  for (const day of dailyForecasts) {
    if (riskPriority[day.flashFloodRisk] > riskPriority[maxRiskLevel]) {
      maxRiskLevel = day.flashFloodRisk;
    }
  }

  // Return null if risk is low across all days
  if (maxRiskLevel === 'low') {
    return null;
  }

  // Second pass: collect all days with elevated risk (above 'low')
  const affectedDays: string[] = dailyForecasts
    .filter((day) => day.flashFloodRisk !== 'low')
    .map((day) => day.dayOfWeek);

  const titles: Record<FlashFloodRiskLevel, string> = {
    low: '',
    moderate: 'Rain Expected',
    high: 'Heavy Rain Expected',
    severe: 'Very Heavy Rain Expected',
  };

  const messages: Record<FlashFloodRiskLevel, string> = {
    low: '',
    moderate: `Rain likely on ${affectedDays.join(', ')}. Consider having indoor backup plans.`,
    high: `Significant rainfall expected on ${affectedDays.join(', ')}. Indoor activities recommended.`,
    severe: `Very heavy rainfall forecast for ${affectedDays.join(', ')}. Check MET Malaysia for official updates.`,
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
 * @deprecated Use getWeatherTipsForClimate() for location-agnostic tips.
 * Kept for legacy sample Malaysia trip compatibility.
 *
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
 * Climate type definitions for location-agnostic weather tips.
 */
export type ClimateType =
  | 'tropical'
  | 'subtropical'
  | 'mediterranean'
  | 'continental'
  | 'temperate'
  | 'arid'
  | 'arctic'
  | 'monsoon';

/**
 * Get weather tips appropriate for a climate type.
 * Used for location-agnostic travel planning.
 *
 * @param climate - Climate type or description string
 * @returns Array of relevant weather tips
 */
export function getWeatherTipsForClimate(climate: string): string[] {
  const normalizedClimate = climate.toLowerCase();

  // Tropical/Monsoon climates
  if (normalizedClimate.includes('tropical') || normalizedClimate.includes('monsoon')) {
    return [
      'Brief afternoon rain showers are common - carry a compact umbrella',
      'Stay hydrated and take breaks in air-conditioned spaces',
      'Plan outdoor activities for morning when it is typically cooler and drier',
      'Thunderstorms can be intense but usually pass within 30-60 minutes',
      'Lightweight, breathable clothing is essential',
    ];
  }

  // Hot/Arid climates
  if (normalizedClimate.includes('arid') || normalizedClimate.includes('desert') || normalizedClimate.includes('dry')) {
    return [
      'Stay hydrated - carry water at all times',
      'Avoid outdoor activities during peak heat (11am-3pm)',
      'Wear sun protection: hat, sunglasses, and sunscreen',
      'Temperatures can drop significantly at night',
      'Lightweight, loose-fitting clothing helps stay cool',
    ];
  }

  // Mediterranean climates
  if (normalizedClimate.includes('mediterranean')) {
    return [
      'Summers are warm and dry - stay hydrated',
      'Winters can bring rain - pack a light jacket',
      'Spring and fall offer the most pleasant weather',
      'Sea breezes can make coastal areas cooler',
      'Sunscreen is essential year-round',
    ];
  }

  // Cold/Continental climates
  if (normalizedClimate.includes('continental') || normalizedClimate.includes('cold') || normalizedClimate.includes('arctic')) {
    return [
      'Layer clothing for variable temperatures',
      'Check forecasts for sudden weather changes',
      'Pack warm layers even in milder months',
      'Icy conditions may affect walking - wear appropriate footwear',
      'Shorter daylight hours in winter - plan accordingly',
    ];
  }

  // Temperate climates
  if (normalizedClimate.includes('temperate') || normalizedClimate.includes('moderate')) {
    return [
      'Weather can be changeable - pack layers',
      'A light rain jacket is useful year-round',
      'Spring and fall offer pleasant temperatures',
      'Check local forecasts for day-to-day variations',
      'Sun protection is still important on clear days',
    ];
  }

  // Subtropical climates
  if (normalizedClimate.includes('subtropical')) {
    return [
      'Summers are hot and humid - stay hydrated',
      'Afternoon thunderstorms are common in summer',
      'Winters are mild but can have cool snaps',
      'Hurricane/typhoon season varies by region - check advisories',
      'Light, breathable clothing works best',
    ];
  }

  // Default generic tips
  return [
    'Check the local weather forecast before outdoor activities',
    'Pack layers to adapt to changing conditions',
    'Stay hydrated regardless of temperature',
    'Have indoor backup plans for rainy days',
    'Sun protection is important in most climates',
  ];
}

/**
 * Get general travel safety tips for weather-related situations.
 * These are location-agnostic and apply universally.
 */
export function getGeneralWeatherSafetyTips(): string[] {
  return [
    'Check local weather forecasts daily and plan accordingly',
    'Have both indoor and outdoor activity options ready',
    'Keep emergency contacts and hotel info accessible',
    'Download offline maps in case of connectivity issues',
    'Carry basic weather protection (umbrella, sun protection)',
    'Know the location of nearby shelters during severe weather',
  ];
}

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
