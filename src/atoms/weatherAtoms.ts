/**
 * Weather State Atoms
 *
 * Jotai atoms for weather data management
 * Follows the same patterns as floatingPanelAtoms.ts and uiAtoms.ts
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import type { WeatherLocation, WeatherState } from '../types/weather';

/**
 * Weather location preference (persisted)
 * Default: Kuala Lumpur city center
 */
export const weatherLocationAtom = atomWithStorage<WeatherLocation>(
  'malaysia-trip-weather-location',
  {
    lat: 3.1390,
    lng: 101.6869,
    name: 'Kuala Lumpur',
  }
);

/**
 * Weather indicator visibility (persisted)
 * Shows/hides the floating weather badge on the map
 */
export const weatherIndicatorVisibleAtom = atomWithStorage<boolean>(
  'malaysia-trip-weather-indicator-visible',
  true
);

/**
 * Temperature unit preference (persisted)
 * true = Celsius, false = Fahrenheit
 */
export const useCelsiusAtom = atomWithStorage<boolean>(
  'malaysia-trip-weather-celsius',
  true
);

/**
 * Last fetched weather data (not persisted - refreshes each session)
 * Used for quick display before fetch completes
 */
export const lastWeatherDataAtom = atom<WeatherState | null>(null);

/**
 * Weather auto-refresh enabled (persisted)
 * When enabled, weather refreshes every 15 minutes
 */
export const weatherAutoRefreshAtom = atomWithStorage<boolean>(
  'malaysia-trip-weather-autorefresh',
  true
);

/**
 * Action atom to update weather location
 */
export const setWeatherLocationAtom = atom(
  null,
  (_get, set, location: WeatherLocation) => {
    set(weatherLocationAtom, location);
    // Clear cached weather data when location changes
    set(lastWeatherDataAtom, null);
  }
);

/**
 * Action atom to toggle weather indicator visibility
 */
export const toggleWeatherIndicatorAtom = atom(null, (get, set) => {
  const current = get(weatherIndicatorVisibleAtom);
  set(weatherIndicatorVisibleAtom, !current);
});

/**
 * Action atom to toggle temperature unit
 */
export const toggleTemperatureUnitAtom = atom(null, (get, set) => {
  const current = get(useCelsiusAtom);
  set(useCelsiusAtom, !current);
});

/**
 * Helper: Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

/**
 * Derived atom: Get temperature in user's preferred unit
 */
export const formatTemperatureAtom = atom((get) => {
  const useCelsius = get(useCelsiusAtom);
  return (tempCelsius: number): string => {
    if (useCelsius) {
      return `${Math.round(tempCelsius)}°C`;
    }
    return `${celsiusToFahrenheit(tempCelsius)}°F`;
  };
});
