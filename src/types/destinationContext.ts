/**
 * Destination context types for location-agnostic travel planning.
 *
 * These types enable the travel planner to work with any destination
 * by providing structured information about the country, emergency
 * contacts, safety tips, weather, and currency.
 */

/**
 * Country information for a destination.
 */
export interface CountryInfo {
  /** Full country name (e.g., "Japan", "Malaysia") */
  name: string;
  /** ISO 3166-1 alpha-2 country code (e.g., "JP", "MY") */
  code: string;
  /** IANA timezone identifier (e.g., "Asia/Tokyo", "Asia/Kuala_Lumpur") */
  timezone: string;
}

/**
 * Emergency contact numbers for a destination.
 * These are the local emergency services numbers.
 */
export interface EmergencyContacts {
  /** Police emergency number (e.g., "110" in Japan, "999" in Malaysia) */
  police: string;
  /** Ambulance/medical emergency number */
  ambulance: string;
  /** Fire department emergency number */
  fire: string;
}

/**
 * Safety and cultural information for travelers.
 */
export interface SafetyInfo {
  /** Health-related tips and warnings (e.g., "Tap water is safe", "Carry mosquito repellent") */
  healthTips: string[];
  /** Cultural etiquette guidelines (e.g., "Remove shoes indoors", "Tipping is not expected") */
  culturalEtiquette: string[];
}

/**
 * Weather and packing information for a destination.
 */
export interface WeatherInfo {
  /** General climate description (e.g., "Tropical humid", "Four distinct seasons") */
  climate: string;
  /** Packing recommendations based on weather (e.g., "Light breathable clothing", "Umbrella essential") */
  packingTips: string[];
}

/**
 * Currency information for a destination.
 */
export interface CurrencyInfo {
  /** ISO 4217 currency code (e.g., "JPY", "MYR", "USD") */
  code: string;
  /** Currency symbol (e.g., "¥", "RM", "$") */
  symbol: string;
}

/**
 * Complete destination context containing all location-specific information
 * needed for travel planning.
 */
export interface DestinationContext {
  /** Country information */
  country: CountryInfo;
  /** Emergency contact numbers */
  emergency: EmergencyContacts;
  /** Safety and cultural information */
  safety: SafetyInfo;
  /** Weather and packing information */
  weather: WeatherInfo;
  /** Currency information */
  currency: CurrencyInfo;
}

/**
 * Parsed destination information from a destination string.
 */
export interface ParsedDestination {
  /** City name (e.g., "Tokyo", "Kuala Lumpur") */
  city: string;
  /** Country name (e.g., "Japan", "Malaysia") */
  country: string;
  /** ISO 3166-1 alpha-2 country code (e.g., "JP", "MY") */
  countryCode: string;
}
