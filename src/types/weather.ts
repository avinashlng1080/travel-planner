/**
 * Weather & Flash Flood Alert Types
 *
 * Integrates with Open-Meteo API (free, no API key required)
 * Designed for Malaysia monsoon season safety alerts
 */

// Open-Meteo API response types
export interface OpenMeteoCurrentWeather {
  time: string;
  interval: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  weather_code: number;
  precipitation: number;
  rain: number;
  showers: number;
  wind_speed_10m: number;
}

export interface OpenMeteoHourlyForecast {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  precipitation: number[];
  weather_code: number[];
  rain: number[];
  showers: number[];
}

export interface OpenMeteoDailyForecast {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  sunrise: string[];
  sunset: string[];
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  timezone_abbreviation: string;
  utc_offset_seconds: number;
  current: OpenMeteoCurrentWeather;
  hourly: OpenMeteoHourlyForecast;
  daily: OpenMeteoDailyForecast;
}

// Internal weather state types
export type FlashFloodRiskLevel = 'low' | 'moderate' | 'high' | 'severe';

export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'storm'
  | 'snow';

export interface ProcessedCurrentWeather {
  temperature: number;
  humidity: number;
  condition: WeatherCondition;
  weatherCode: number;
  precipitation: number;
  windSpeed: number;
  description: string;
  updatedAt: Date;
}

export interface ProcessedDailyForecast {
  date: string;
  dayOfWeek: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbability: number;
  condition: WeatherCondition;
  weatherCode: number;
  flashFloodRisk: FlashFloodRiskLevel;
  sunrise: string;
  sunset: string;
}

export interface FlashFloodAlert {
  level: FlashFloodRiskLevel;
  title: string;
  message: string;
  recommendation: string;
  planBSuggestion?: string;
  affectedDays: string[];
}

export interface WeatherLocation {
  lat: number;
  lng: number;
  name: string;
}

export interface WeatherState {
  current: ProcessedCurrentWeather | null;
  daily: ProcessedDailyForecast[];
  flashFloodAlert: FlashFloodAlert | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: Date | null;
  location: WeatherLocation | null;
}

// Weather hook return type
export interface UseWeatherResult extends WeatherState {
  refresh: () => void;
  setLocation: (location: WeatherLocation | null) => void;
}

