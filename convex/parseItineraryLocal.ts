import { httpAction } from "./_generated/server";

/**
 * Smart itinerary parser that:
 * 1. Parses TripIt/text format locally (no AI needed for structure)
 * 2. Only uses geocoding API for unique locations
 * 3. Falls back to Claude only when local parsing fails
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Known locations in Malaysia with coordinates (saves API calls)
const KNOWN_LOCATIONS: Record<string, { lat: number; lng: number; category: string }> = {
  // Kuala Lumpur
  'klcc': { lat: 3.1578, lng: 101.7117, category: 'attraction' },
  'klcc park': { lat: 3.1555, lng: 101.7115, category: 'nature' },
  'petronas': { lat: 3.1578, lng: 101.7117, category: 'attraction' },
  'petronas twin tower': { lat: 3.1578, lng: 101.7117, category: 'attraction' },
  'petronas towers': { lat: 3.1578, lng: 101.7117, category: 'attraction' },
  'suria klcc': { lat: 3.1580, lng: 101.7132, category: 'shopping' },
  'pavilion': { lat: 3.1490, lng: 101.7133, category: 'shopping' },
  'pavilion kl': { lat: 3.1490, lng: 101.7133, category: 'shopping' },
  'berjaya times square': { lat: 3.1421, lng: 101.7108, category: 'shopping' },
  'bukit bintang': { lat: 3.1466, lng: 101.7108, category: 'shopping' },
  'jalan alor': { lat: 3.1456, lng: 101.7089, category: 'restaurant' },
  'petaling street': { lat: 3.1456, lng: 101.6958, category: 'shopping' },
  'chinatown': { lat: 3.1456, lng: 101.6958, category: 'shopping' },
  'plaza low yat': { lat: 3.1454, lng: 101.7108, category: 'shopping' },
  'sungai wang': { lat: 3.1477, lng: 101.7108, category: 'shopping' },
  'aquaria klcc': { lat: 3.1530, lng: 101.7118, category: 'attraction' },
  'kl sentral': { lat: 3.1343, lng: 101.6864, category: 'transport' },
  'sunway velocity': { lat: 3.1282, lng: 101.7215, category: 'shopping' },

  // Batu Caves area
  'batu caves': { lat: 3.2378, lng: 101.6840, category: 'temple' },
  'batu cave': { lat: 3.2378, lng: 101.6840, category: 'temple' },

  // Genting
  'genting highlands': { lat: 3.4236, lng: 101.7932, category: 'attraction' },
  'genting highland': { lat: 3.4236, lng: 101.7932, category: 'attraction' },
  'skyavenue': { lat: 3.4236, lng: 101.7932, category: 'shopping' },

  // Cameron Highlands
  'cameron highlands': { lat: 4.4718, lng: 101.3767, category: 'nature' },
  'cameron highland': { lat: 4.4718, lng: 101.3767, category: 'nature' },
  'tanah rata': { lat: 4.4718, lng: 101.3767, category: 'nature' },
  'brinchang': { lat: 4.4925, lng: 101.3867, category: 'nature' },

  // Putrajaya
  'putrajaya': { lat: 2.9264, lng: 101.6964, category: 'attraction' },

  // Sunway
  'sunway pyramid': { lat: 3.0733, lng: 101.6078, category: 'shopping' },
  'sunway lagoon': { lat: 3.0733, lng: 101.6050, category: 'attraction' },

  // Cheras area
  'm vertica': { lat: 3.1073, lng: 101.7271, category: 'hotel' },
  'aeon mall maluri': { lat: 3.1234, lng: 101.7234, category: 'shopping' },
  'aeon mall': { lat: 3.1234, lng: 101.7234, category: 'shopping' },

  // Zoo
  'zoo negara': { lat: 3.2099, lng: 101.7583, category: 'attraction' },

  // Airports
  'klia': { lat: 2.7456, lng: 101.7072, category: 'transport' },
  'klia2': { lat: 2.7456, lng: 101.7072, category: 'transport' },
  'kuala lumpur international airport': { lat: 2.7456, lng: 101.7072, category: 'transport' },
};

// Parse time string to 24-hour format
function parseTime(timeStr: string): string {
  // Already 24-hour format like "16:30"
  const time24Match = /(\d{1,2}):(\d{2})/.exec(timeStr);
  if (time24Match) {
    const hours = parseInt(time24Match[1]);
    const minutes = time24Match[2];
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  // 12-hour format like "3:00 PM"
  const time12Match = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(timeStr);
  if (time12Match) {
    let hours = parseInt(time12Match[1]);
    const minutes = time12Match[2];
    const period = time12Match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {hours += 12;}
    if (period === 'AM' && hours === 12) {hours = 0;}

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  return '09:00'; // Default
}

// Parse date string to YYYY-MM-DD format
function parseDate(dateStr: string, tripYear: number): string {
  // Format: "Sun, 21 Dec" or "Mon, 22 Dec"
  const tripItMatch = /\w+,?\s+(\d{1,2})\s+(\w+)/.exec(dateStr);
  if (tripItMatch) {
    const day = parseInt(tripItMatch[1]);
    const monthStr = tripItMatch[2].toLowerCase();

    const months: Record<string, number> = {
      jan: 1, january: 1,
      feb: 2, february: 2,
      mar: 3, march: 3,
      apr: 4, april: 4,
      may: 5,
      jun: 6, june: 6,
      jul: 7, july: 7,
      aug: 8, august: 8,
      sep: 9, september: 9,
      oct: 10, october: 10,
      nov: 11, november: 11,
      dec: 12, december: 12,
    };

    const month = months[monthStr] || 1;
    // If month is Jan and we're parsing a Dec-Jan trip, use next year
    const year = month < 6 ? tripYear + 1 : tripYear;

    return `${String(year)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return new Date().toISOString().split('T')[0];
}

// Infer category from activity name
function inferCategory(name: string): string {
  const nameLower = name.toLowerCase();

  if (nameLower.includes('mall') || nameLower.includes('shopping') || nameLower.includes('outlet')) {
    return 'shopping';
  }
  if (nameLower.includes('cafe') || nameLower.includes('restaurant') || nameLower.includes('dinner') || nameLower.includes('lunch') || nameLower.includes('food')) {
    return 'restaurant';
  }
  if (nameLower.includes('temple') || nameLower.includes('cave') || nameLower.includes('mosque')) {
    return 'temple';
  }
  if (nameLower.includes('park') || nameLower.includes('garden') || nameLower.includes('highland') || nameLower.includes('nature')) {
    return 'nature';
  }
  if (nameLower.includes('hotel') || nameLower.includes('check in') || nameLower.includes('check out') || nameLower.includes('vertica')) {
    return 'hotel';
  }
  if (nameLower.includes('airport') || nameLower.includes('transfer') || nameLower.includes('→') || nameLower.includes('flight')) {
    return 'transport';
  }
  if (nameLower.includes('playground') || nameLower.includes('play')) {
    return 'playground';
  }
  if (nameLower.includes('aquaria') || nameLower.includes('zoo') || nameLower.includes('tower') || nameLower.includes('museum')) {
    return 'attraction';
  }

  return 'attraction';
}

// Find known location coordinates
function findKnownLocation(name: string): { lat: number; lng: number; category: string } | null {
  const nameLower = name.toLowerCase();

  // Direct match
  if (nameLower in KNOWN_LOCATIONS) {
    return KNOWN_LOCATIONS[nameLower];
  }

  // Partial match
  for (const [key, value] of Object.entries(KNOWN_LOCATIONS)) {
    if (nameLower.includes(key) || key.includes(nameLower.split(' ')[0])) {
      return value;
    }
  }

  return null;
}

// Extract coordinates from address using regex (Malaysia addresses often contain coordinates)
function extractCoordsFromAddress(address: string): { lat: number; lng: number } | null {
  // Try to match coordinates in address
  const coordMatch = /([0-9]+\.[0-9]+),\s*([0-9]+\.[0-9]+)/.exec(address);
  if (coordMatch) {
    return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
  }
  return null;
}

// Geocode using OpenStreetMap Nominatim (free, no API key needed)
async function geocodeLocation(name: string, address?: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // First check known locations
    const known = findKnownLocation(name);
    if (known) {
      return { lat: known.lat, lng: known.lng };
    }

    // Try to extract from address
    if (address) {
      const extracted = extractCoordsFromAddress(address);
      if (extracted) {return extracted;}
    }

    // Use Nominatim for geocoding
    const query = address ? `${name}, ${address}` : `${name}, Malaysia`;
    const encodedQuery = encodeURIComponent(query);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'TravelPlannerApp/1.0',
        },
      }
    );

    if (response.ok) {
      const data = (await response.json()) as { lat: string; lon: string }[];
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Extract timezone from TripIt text
function extractTimezoneFromText(text: string): {
  timezone: string | null;
  gmtOffset: string | null;
} {
  // Look for GMT+X pattern
  const gmtMatch = /GMT([+-]\d{1,2}(?::\d{2})?)/i.exec(text);
  if (gmtMatch) {
    const gmtOffset = `GMT${gmtMatch[1]}`;
    // Map GMT offset to IANA timezone
    const gmtToTimezone: Record<string, string> = {
      'GMT+8': 'Asia/Kuala_Lumpur',
      'GMT+7': 'Asia/Bangkok',
      'GMT+9': 'Asia/Tokyo',
      'GMT+0': 'Europe/London',
      'GMT-5': 'America/New_York',
      'GMT-8': 'America/Los_Angeles',
    };
    const timezone = gmtToTimezone[gmtOffset] || null;
    return { timezone, gmtOffset };
  }

  return { timezone: null, gmtOffset: null };
}

// Parse TripIt format
function parseTripItFormat(text: string, tripYear: number): {
  activities: {
    date: string;
    name: string;
    address?: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }[];
  detectedTimezone: string | null;
  detectedGmtOffset: string | null;
} {
  const activities: {
    date: string;
    name: string;
    address?: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }[] = [];

  // Split by date patterns
  const lines = text.split('\n');
  let currentDate = '';
  let currentTime = '09:00';
  let currentEndTime = '11:00';
  let currentName = '';
  let currentAddress = '';
  let currentNotes = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {continue;}

    // Check if this is a date line: "Sun, 21 Dec 16:30 GMT+8 Activity Name"
    const dateTimeMatch = /^(\w+,?\s+\d{1,2}\s+\w+)\s+(\d{1,2}:\d{2})\s*(?:GMT[+-]?\d+)?\s+(.+)/.exec(line);

    if (dateTimeMatch) {
      // Save previous activity if exists
      if (currentName && currentDate) {
        activities.push({
          date: currentDate,
          name: currentName,
          address: currentAddress || undefined,
          startTime: currentTime,
          endTime: currentEndTime,
          notes: currentNotes || undefined,
        });
      }

      currentDate = parseDate(dateTimeMatch[1], tripYear);
      currentTime = parseTime(dateTimeMatch[2]);
      currentEndTime = addHours(currentTime, 2); // Default 2 hour duration

      // Parse the rest - could be "Activity Name" or "Activity Name Until 19:00"
      const rest = dateTimeMatch[3];
      const untilMatch = /(.+?)\s+Until\s+(\d{1,2}:\d{2})/i.exec(rest);

      if (untilMatch) {
        currentName = untilMatch[1].trim();
        currentEndTime = parseTime(untilMatch[2]);
      } else {
        currentName = rest.trim();
      }

      currentAddress = '';
      currentNotes = '';
    } else if (/^Until\s+(\d{1,2}:\d{2})/i.exec(line)) {
      // End time on its own line
      const endMatch = /Until\s+(\d{1,2}:\d{2})/i.exec(line);
      if (endMatch) {
        currentEndTime = parseTime(endMatch[1]);
      }
    } else if ((/^\d+.*Malaysia/i.exec(line)) || (/^Lot\s+/i.exec(line)) || (/^Jalan\s+/i.exec(line)) || (/^Level\s+/i.exec(line))) {
      // This looks like an address
      currentAddress = line;
    } else if (currentName && !line.startsWith('URL:') && !(/^\d{3}-/.exec(line))) {
      // Additional notes
      if (currentNotes) {
        currentNotes += ' ' + line;
      } else {
        currentNotes = line;
      }
    }
  }

  // Save last activity
  if (currentName && currentDate) {
    activities.push({
      date: currentDate,
      name: currentName,
      address: currentAddress || undefined,
      startTime: currentTime,
      endTime: currentEndTime,
      notes: currentNotes || undefined,
    });
  }

  // Extract timezone from the text
  const { timezone, gmtOffset } = extractTimezoneFromText(text);

  return { activities, detectedTimezone: timezone, detectedGmtOffset: gmtOffset };
}

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const newHour = Math.min(23, h + hours);
  return `${newHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export const parseItineraryLocal = httpAction(async (_ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = (await request.json()) as {
      rawText: string;
      tripContext?: {
        startDate?: string;
      };
    };
    const { rawText, tripContext } = body;

    if (!rawText || typeof rawText !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: "Please paste your itinerary text" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (rawText.length < 50) {
      return new Response(
        JSON.stringify({ success: false, error: "This doesn't look like a full itinerary." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Determine trip year from context
    const tripYear = tripContext?.startDate
      ? new Date(tripContext.startDate).getFullYear()
      : new Date().getFullYear();

    // Parse the text locally
    const { activities, detectedTimezone, detectedGmtOffset } = parseTripItFormat(rawText, tripYear);

    if (activities.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Could not parse any activities. Please check the format." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Extract unique locations for geocoding
    const uniqueLocations = new Map<string, { name: string; address?: string }>();
    for (const activity of activities) {
      const key = activity.name.toLowerCase();
      if (!uniqueLocations.has(key)) {
        uniqueLocations.set(key, { name: activity.name, address: activity.address });
      }
    }

    // Geocode unique locations (with rate limiting to avoid Nominatim limits)
    const locationCoords = new Map<string, { lat: number; lng: number; category: string }>();
    const warnings: string[] = [];

    let geocodeCount = 0;
    for (const [key, loc] of Array.from(uniqueLocations.entries())) {
      // Check known locations first (no API call needed)
      const known = findKnownLocation(loc.name);
      if (known) {
        locationCoords.set(key, known);
        continue;
      }

      // Rate limit Nominatim calls (1 per second)
      if (geocodeCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 1100));
      }

      const coords = await geocodeLocation(loc.name, loc.address);
      geocodeCount++;

      if (coords) {
        locationCoords.set(key, {
          ...coords,
          category: inferCategory(loc.name),
        });
      } else {
        // Use a default location (KL center) with warning
        locationCoords.set(key, {
          lat: 3.1390,
          lng: 101.6869,
          category: inferCategory(loc.name),
        });
        warnings.push(`Could not find coordinates for "${loc.name}" - please verify location`);
      }

      // Limit geocoding to prevent timeouts
      if (geocodeCount >= 15) {
        warnings.push(`Geocoding limited to first 15 unique locations. Some locations may need manual verification.`);
        break;
      }
    }

    // Build locations array
    const locations = Array.from(uniqueLocations.entries()).map(([key, loc]: [string, { name: string; address?: string }]) => {
      const coords = locationCoords.get(key) || { lat: 3.1390, lng: 101.6869, category: 'attraction' };
      return {
        id: generateId(),
        name: loc.name,
        lat: coords.lat,
        lng: coords.lng,
        category: coords.category as any,
        confidence: coords.lat === 3.1390 ? 'low' : 'high' as const,
        originalText: loc.name,
      };
    });

    // Create location name to ID map
    const locationNameToId: Record<string, string> = {};
    for (const loc of locations) {
      locationNameToId[loc.name.toLowerCase()] = loc.id;
    }

    // Group activities by date
    const dayMap = new Map<string, {
      id: string;
      locationId: string;
      locationName: string;
      startTime: string;
      endTime: string;
      notes?: string;
      isFlexible: boolean;
      originalText: string;
    }[]>();

    for (const activity of activities) {
      if (!dayMap.has(activity.date)) {
        dayMap.set(activity.date, []);
      }

      dayMap.get(activity.date)!.push({
        id: generateId(),
        locationId: locationNameToId[activity.name.toLowerCase()] || '',
        locationName: activity.name,
        startTime: activity.startTime,
        endTime: activity.endTime,
        notes: activity.notes,
        isFlexible: true,
        originalText: `${activity.startTime}-${activity.endTime} ${activity.name}`,
      });
    }

    // Convert to days array
    const days = Array.from(dayMap.entries())
      .sort(([a]: [string, unknown], [b]: [string, unknown]) => a.localeCompare(b))
      .map(([date, dayActivities]: [string, {
        id: string;
        locationId: string;
        locationName: string;
        startTime: string;
        endTime: string;
        notes?: string;
        isFlexible: boolean;
        originalText: string;
      }[]]) => ({
        date,
        title: undefined,
        activities: dayActivities.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      }));

    // Build suggestions
    const suggestions = [
      `Parsed ${activities.length} activities across ${days.length} days`,
      'Review locations with "low" confidence and verify coordinates',
    ];

    if (detectedTimezone) {
      suggestions.unshift(`Detected timezone: ${detectedGmtOffset} (${detectedTimezone})`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        parsed: {
          locations,
          days,
          warnings,
          suggestions,
          // Timezone info
          detectedTimezone,
          detectedGmtOffset,
        },
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Parse error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to parse itinerary. Please try again." }),
      { status: 500, headers: corsHeaders }
    );
  }
});
