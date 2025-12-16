/**
 * TypeScript interfaces for the AI-Powered Itinerary Import feature.
 *
 * This module defines the data structures used throughout the import flow:
 * - Request/response types for the parseItinerary API
 * - Parsed location and activity types with edit capability
 * - State management types for the parser hook
 */

/** Valid location categories for trip locations */
export type LocationCategory =
  | 'restaurant'
  | 'attraction'
  | 'shopping'
  | 'nature'
  | 'temple'
  | 'hotel'
  | 'transport'
  | 'medical'
  | 'playground';

/** Confidence level for parsed data */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * A location parsed from the raw itinerary text.
 * Includes coordinates from web search and confidence indicator.
 */
export interface ParsedLocation {
  /** Temporary UUID for client-side reference */
  id: string;
  /** Name of the place */
  name: string;
  /** Latitude coordinate */
  lat: number;
  /** Longitude coordinate */
  lng: number;
  /** Category of the location */
  category: LocationCategory;
  /** Optional description of the place */
  description?: string;
  /** How confident the AI is in this parsing */
  confidence: ConfidenceLevel;
  /** The original text that was parsed to create this location */
  originalText: string;
}

/**
 * An activity parsed from the raw itinerary text.
 * Links to a ParsedLocation and includes time information.
 */
export interface ParsedActivity {
  /** Temporary UUID for client-side reference */
  id: string;
  /** References ParsedLocation.id */
  locationId: string;
  /** Name of the location (denormalized for display) */
  locationName: string;
  /** Start time in HH:MM format (24-hour) */
  startTime: string;
  /** End time in HH:MM format (24-hour) */
  endTime: string;
  /** Optional notes for this activity */
  notes?: string;
  /** Whether the timing is flexible */
  isFlexible: boolean;
  /** The original text that was parsed to create this activity */
  originalText: string;
}

/**
 * A day in the parsed itinerary, containing multiple activities.
 */
export interface ParsedDay {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Optional title for the day (e.g., "Arrival Day", "Temple Tour") */
  title?: string;
  /** Activities scheduled for this day */
  activities: ParsedActivity[];
}

/**
 * The complete parsed itinerary returned by the AI.
 */
export interface ParsedItinerary {
  /** All locations found in the itinerary */
  locations: ParsedLocation[];
  /** Days with scheduled activities */
  days: ParsedDay[];
  /** Warnings about parsing issues */
  warnings: string[];
  /** AI suggestions for improving the itinerary */
  suggestions: string[];
}

/**
 * Trip context provided to the parser for better understanding.
 */
export interface TripContext {
  /** Name of the trip */
  name: string;
  /** Destination (city/country) */
  destination?: string;
  /** Trip start date in YYYY-MM-DD format */
  startDate: string;
  /** Trip end date in YYYY-MM-DD format */
  endDate: string;
  /** Information about travelers (e.g., "2 adults, 1 toddler") */
  travelerInfo?: string;
}

/**
 * Existing location data to help avoid duplicates.
 */
export interface ExistingLocation {
  name: string;
  lat: number;
  lng: number;
}

/**
 * Request body for the /parseItinerary endpoint.
 */
export interface ParseItineraryRequest {
  /** The raw itinerary text to parse */
  rawText: string;
  /** Trip ID for context */
  tripId: string;
  /** Trip information for better parsing */
  tripContext: TripContext;
  /** Existing locations to avoid duplicates */
  existingLocations?: ExistingLocation[];
}

/**
 * Response from the /parseItinerary endpoint.
 */
export interface ParseItineraryResponse {
  /** Whether parsing was successful */
  success: boolean;
  /** The parsed itinerary data (if successful) */
  parsed?: ParsedItinerary;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Steps in the import flow state machine.
 */
export type ParserStep = 'input' | 'parsing' | 'preview' | 'importing' | 'complete';

/**
 * Result of a successful import, storing IDs for undo capability.
 */
export interface ImportResult {
  /** IDs of created locations */
  locationIds: string[];
  /** IDs of created schedule items */
  scheduleItemIds: string[];
}
