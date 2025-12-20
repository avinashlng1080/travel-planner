/**
 * Timezone utilities for travel planning.
 *
 * Handles:
 * - Detecting timezone from destination names
 * - Converting between timezone formats
 * - Formatting times with timezone indicators
 * - Parsing GMT offset strings from TripIt
 */

/** Mapping of common destinations to IANA timezones */
const DESTINATION_TIMEZONES: Record<string, string> = {
  // Malaysia
  'malaysia': 'Asia/Kuala_Lumpur',
  'kuala lumpur': 'Asia/Kuala_Lumpur',
  'kl': 'Asia/Kuala_Lumpur',
  'penang': 'Asia/Kuala_Lumpur',
  'langkawi': 'Asia/Kuala_Lumpur',
  'malacca': 'Asia/Kuala_Lumpur',
  'melaka': 'Asia/Kuala_Lumpur',
  'johor': 'Asia/Kuala_Lumpur',
  'sabah': 'Asia/Kuala_Lumpur',
  'sarawak': 'Asia/Kuala_Lumpur',
  'borneo': 'Asia/Kuala_Lumpur',

  // Singapore
  'singapore': 'Asia/Singapore',

  // Thailand
  'thailand': 'Asia/Bangkok',
  'bangkok': 'Asia/Bangkok',
  'phuket': 'Asia/Bangkok',
  'chiang mai': 'Asia/Bangkok',
  'pattaya': 'Asia/Bangkok',

  // Indonesia
  'indonesia': 'Asia/Jakarta',
  'jakarta': 'Asia/Jakarta',
  'bali': 'Asia/Makassar',
  'denpasar': 'Asia/Makassar',

  // Vietnam
  'vietnam': 'Asia/Ho_Chi_Minh',
  'ho chi minh': 'Asia/Ho_Chi_Minh',
  'hanoi': 'Asia/Ho_Chi_Minh',
  'saigon': 'Asia/Ho_Chi_Minh',

  // Japan
  'japan': 'Asia/Tokyo',
  'tokyo': 'Asia/Tokyo',
  'osaka': 'Asia/Tokyo',
  'kyoto': 'Asia/Tokyo',

  // South Korea
  'korea': 'Asia/Seoul',
  'south korea': 'Asia/Seoul',
  'seoul': 'Asia/Seoul',

  // China
  'china': 'Asia/Shanghai',
  'shanghai': 'Asia/Shanghai',
  'beijing': 'Asia/Shanghai',
  'hong kong': 'Asia/Hong_Kong',
  'macau': 'Asia/Macau',

  // Taiwan
  'taiwan': 'Asia/Taipei',
  'taipei': 'Asia/Taipei',

  // Philippines
  'philippines': 'Asia/Manila',
  'manila': 'Asia/Manila',

  // India
  'india': 'Asia/Kolkata',
  'mumbai': 'Asia/Kolkata',
  'delhi': 'Asia/Kolkata',
  'bangalore': 'Asia/Kolkata',

  // Australia
  'australia': 'Australia/Sydney',
  'sydney': 'Australia/Sydney',
  'melbourne': 'Australia/Melbourne',
  'brisbane': 'Australia/Brisbane',
  'perth': 'Australia/Perth',

  // New Zealand
  'new zealand': 'Pacific/Auckland',
  'auckland': 'Pacific/Auckland',

  // Europe
  'uk': 'Europe/London',
  'london': 'Europe/London',
  'paris': 'Europe/Paris',
  'france': 'Europe/Paris',
  'germany': 'Europe/Berlin',
  'berlin': 'Europe/Berlin',
  'spain': 'Europe/Madrid',
  'madrid': 'Europe/Madrid',
  'barcelona': 'Europe/Madrid',
  'italy': 'Europe/Rome',
  'rome': 'Europe/Rome',
  'amsterdam': 'Europe/Amsterdam',
  'netherlands': 'Europe/Amsterdam',

  // US
  'new york': 'America/New_York',
  'nyc': 'America/New_York',
  'los angeles': 'America/Los_Angeles',
  'la': 'America/Los_Angeles',
  'san francisco': 'America/Los_Angeles',
  'chicago': 'America/Chicago',
  'miami': 'America/New_York',
  'hawaii': 'Pacific/Honolulu',

  // Middle East
  'dubai': 'Asia/Dubai',
  'uae': 'Asia/Dubai',
  'abu dhabi': 'Asia/Dubai',
};

/** GMT offset to IANA timezone mapping (approximate) */
const GMT_OFFSET_TO_TIMEZONE: Record<string, string> = {
  'GMT+0': 'Europe/London',
  'GMT+1': 'Europe/Paris',
  'GMT+2': 'Europe/Athens',
  'GMT+3': 'Europe/Moscow',
  'GMT+4': 'Asia/Dubai',
  'GMT+5': 'Asia/Karachi',
  'GMT+5:30': 'Asia/Kolkata',
  'GMT+6': 'Asia/Dhaka',
  'GMT+7': 'Asia/Bangkok',
  'GMT+8': 'Asia/Singapore',
  'GMT+9': 'Asia/Tokyo',
  'GMT+10': 'Australia/Sydney',
  'GMT+11': 'Pacific/Noumea',
  'GMT+12': 'Pacific/Auckland',
  'GMT-5': 'America/New_York',
  'GMT-6': 'America/Chicago',
  'GMT-7': 'America/Denver',
  'GMT-8': 'America/Los_Angeles',
  'GMT-10': 'Pacific/Honolulu',
};

/** Common timezone display names */
export const TIMEZONE_DISPLAY_NAMES: Record<string, string> = {
  'Asia/Kuala_Lumpur': 'Malaysia Time (MYT)',
  'Asia/Singapore': 'Singapore Time (SGT)',
  'Asia/Bangkok': 'Indochina Time (ICT)',
  'Asia/Jakarta': 'Western Indonesia (WIB)',
  'Asia/Makassar': 'Central Indonesia (WITA)',
  'Asia/Ho_Chi_Minh': 'Vietnam Time (ICT)',
  'Asia/Tokyo': 'Japan Time (JST)',
  'Asia/Seoul': 'Korea Time (KST)',
  'Asia/Shanghai': 'China Time (CST)',
  'Asia/Hong_Kong': 'Hong Kong Time (HKT)',
  'Asia/Taipei': 'Taiwan Time (CST)',
  'Asia/Manila': 'Philippine Time (PHT)',
  'Asia/Kolkata': 'India Time (IST)',
  'Asia/Dubai': 'Gulf Time (GST)',
  'Australia/Sydney': 'Australian Eastern (AEST)',
  'Australia/Perth': 'Australian Western (AWST)',
  'Pacific/Auckland': 'New Zealand (NZST)',
  'Europe/London': 'British Time (GMT/BST)',
  'Europe/Paris': 'Central European (CET)',
  'America/New_York': 'Eastern Time (ET)',
  'America/Los_Angeles': 'Pacific Time (PT)',
  'America/Chicago': 'Central Time (CT)',
  'Pacific/Honolulu': 'Hawaii Time (HST)',
};

/** Get short timezone abbreviation */
export function getTimezoneAbbr(timezone: string): string {
  const abbrs: Record<string, string> = {
    'Asia/Kuala_Lumpur': 'MYT',
    'Asia/Singapore': 'SGT',
    'Asia/Bangkok': 'ICT',
    'Asia/Jakarta': 'WIB',
    'Asia/Makassar': 'WITA',
    'Asia/Ho_Chi_Minh': 'ICT',
    'Asia/Tokyo': 'JST',
    'Asia/Seoul': 'KST',
    'Asia/Shanghai': 'CST',
    'Asia/Hong_Kong': 'HKT',
    'Asia/Taipei': 'CST',
    'Asia/Manila': 'PHT',
    'Asia/Kolkata': 'IST',
    'Asia/Dubai': 'GST',
    'Australia/Sydney': 'AEST',
    'Australia/Perth': 'AWST',
    'Pacific/Auckland': 'NZST',
    'Europe/London': 'GMT',
    'Europe/Paris': 'CET',
    'America/New_York': 'ET',
    'America/Los_Angeles': 'PT',
    'America/Chicago': 'CT',
    'Pacific/Honolulu': 'HST',
  };
  return abbrs[timezone] || timezone.split('/').pop() || 'UTC';
}

/**
 * Detect timezone from a destination string.
 * Returns IANA timezone or null if not found.
 */
export function detectTimezoneFromDestination(destination: string): string | null {
  const normalized = destination.toLowerCase().trim();

  // Direct match
  if (DESTINATION_TIMEZONES[normalized]) {
    return DESTINATION_TIMEZONES[normalized];
  }

  // Partial match
  for (const [key, tz] of Object.entries(DESTINATION_TIMEZONES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return tz;
    }
  }

  return null;
}

/**
 * Parse GMT offset string from TripIt format.
 * Examples: "GMT+8", "GMT-5", "GMT+5:30"
 * Returns IANA timezone or null.
 */
export function parseGMTOffset(gmtString: string): string | null {
  // Normalize format
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/i.exec(gmtString);
  if (!match) {return null;}

  const sign = match[1];
  const hours = match[2];
  const minutes = match[3] || '0';

  const key = minutes !== '0'
    ? `GMT${sign}${hours}:${minutes.padStart(2, '0')}`
    : `GMT${sign}${hours}`;

  return GMT_OFFSET_TO_TIMEZONE[key] || null;
}

/**
 * Extract timezone from TripIt text.
 * Looks for patterns like "16:30 GMT+8" and extracts the timezone.
 */
export function extractTimezoneFromText(text: string): {
  timezone: string | null;
  gmtOffset: string | null;
} {
  // Look for GMT+X pattern
  const gmtMatch = /GMT([+-]\d{1,2}(?::\d{2})?)/i.exec(text);
  if (gmtMatch) {
    const gmtOffset = `GMT${gmtMatch[1]}`;
    const timezone = parseGMTOffset(gmtOffset);
    return { timezone, gmtOffset };
  }

  return { timezone: null, gmtOffset: null };
}

/**
 * Get GMT offset for a timezone.
 * Returns string like "+8" or "-5".
 */
export function getGMTOffset(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    if (tzPart) {
      // Extract offset from "GMT+8" format
      const match = /GMT([+-]\d+)/.exec(tzPart.value);
      if (match) {return match[1];}
    }
  } catch {
    // Fallback
  }

  // Hardcoded fallbacks
  const offsets: Record<string, string> = {
    'Asia/Kuala_Lumpur': '+8',
    'Asia/Singapore': '+8',
    'Asia/Bangkok': '+7',
    'Asia/Tokyo': '+9',
    'Asia/Seoul': '+9',
    'Europe/London': '+0',
    'America/New_York': '-5',
    'America/Los_Angeles': '-8',
  };
  return offsets[timezone] || '+0';
}

/**
 * Format time with optional timezone indicator.
 * Shows timezone abbreviation when viewing from different timezone.
 */
export function formatTimeWithTimezone(
  time: string,
  tripTimezone: string,
  options?: {
    showTz?: boolean;
    showLocalEquivalent?: boolean;
    userTimezone?: string;
  }
): string {
  const { showTz = false, showLocalEquivalent = false, userTimezone } = options || {};

  let result = time;

  if (showTz) {
    const abbr = getTimezoneAbbr(tripTimezone);
    result = `${time} ${abbr}`;
  }

  if (showLocalEquivalent && userTimezone && userTimezone !== tripTimezone) {
    const localTime = convertTimeBetweenTimezones(time, tripTimezone, userTimezone);
    if (localTime !== time) {
      result += ` (${localTime} your time)`;
    }
  }

  return result;
}

/**
 * Convert a time string between timezones.
 * Simple hour-based conversion (doesn't handle DST perfectly).
 */
export function convertTimeBetweenTimezones(
  time: string,
  fromTz: string,
  toTz: string
): string {
  const fromOffset = parseInt(getGMTOffset(fromTz), 10);
  const toOffset = parseInt(getGMTOffset(toTz), 10);
  const diff = toOffset - fromOffset;

  const [hours, minutes] = time.split(':').map(Number);
  let newHours = hours + diff;

  // Wrap around
  if (newHours < 0) {newHours += 24;}
  if (newHours >= 24) {newHours -= 24;}

  return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Get common timezone options for a dropdown.
 */
export function getTimezoneOptions(): { value: string; label: string; offset: string }[] {
  return [
    { value: 'Asia/Kuala_Lumpur', label: 'Malaysia (MYT)', offset: 'GMT+8' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: 'GMT+8' },
    { value: 'Asia/Bangkok', label: 'Thailand (ICT)', offset: 'GMT+7' },
    { value: 'Asia/Jakarta', label: 'Indonesia - West (WIB)', offset: 'GMT+7' },
    { value: 'Asia/Makassar', label: 'Indonesia - Central (WITA)', offset: 'GMT+8' },
    { value: 'Asia/Tokyo', label: 'Japan (JST)', offset: 'GMT+9' },
    { value: 'Asia/Seoul', label: 'South Korea (KST)', offset: 'GMT+9' },
    { value: 'Asia/Shanghai', label: 'China (CST)', offset: 'GMT+8' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', offset: 'GMT+8' },
    { value: 'Asia/Taipei', label: 'Taiwan (CST)', offset: 'GMT+8' },
    { value: 'Asia/Manila', label: 'Philippines (PHT)', offset: 'GMT+8' },
    { value: 'Asia/Ho_Chi_Minh', label: 'Vietnam (ICT)', offset: 'GMT+7' },
    { value: 'Asia/Kolkata', label: 'India (IST)', offset: 'GMT+5:30' },
    { value: 'Asia/Dubai', label: 'UAE (GST)', offset: 'GMT+4' },
    { value: 'Australia/Sydney', label: 'Australia - Sydney (AEST)', offset: 'GMT+10' },
    { value: 'Australia/Perth', label: 'Australia - Perth (AWST)', offset: 'GMT+8' },
    { value: 'Pacific/Auckland', label: 'New Zealand (NZST)', offset: 'GMT+12' },
    { value: 'Europe/London', label: 'UK (GMT/BST)', offset: 'GMT+0' },
    { value: 'Europe/Paris', label: 'France/Germany (CET)', offset: 'GMT+1' },
    { value: 'America/New_York', label: 'US Eastern (ET)', offset: 'GMT-5' },
    { value: 'America/Chicago', label: 'US Central (CT)', offset: 'GMT-6' },
    { value: 'America/Los_Angeles', label: 'US Pacific (PT)', offset: 'GMT-8' },
    { value: 'Pacific/Honolulu', label: 'Hawaii (HST)', offset: 'GMT-10' },
  ];
}

/**
 * Get user's current timezone.
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}
