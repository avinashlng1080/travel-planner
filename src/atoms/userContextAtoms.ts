import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: Date;
}

export interface UserContext {
  // Location
  currentLocation: UserLocation | null;
  locationPermission: 'granted' | 'denied' | 'prompt' | 'unavailable';
  isTrackingLocation: boolean;

  // Energy & Mood
  energyLevel: 'high' | 'medium' | 'low';
  toddlerMood: 'happy' | 'tired' | 'fussy' | 'sleeping';

  // Health
  healthStatus: 'good' | 'mild_sickness' | 'needs_rest';

  // Budget
  budgetTier: 'budget' | 'mid' | 'premium';

  // Preferences for current session
  preferIndoor: boolean;
  avoidCrowds: boolean;
}

// Default context
const DEFAULT_CONTEXT: UserContext = {
  currentLocation: null,
  locationPermission: 'prompt',
  isTrackingLocation: false,
  energyLevel: 'medium',
  toddlerMood: 'happy',
  healthStatus: 'good',
  budgetTier: 'mid',
  preferIndoor: false,
  avoidCrowds: false,
};

// Persisted user preferences
export const userContextAtom = atomWithStorage<UserContext>(
  'malaysia-trip-user-context',
  DEFAULT_CONTEXT
);

// Action atoms
export const updateEnergyLevelAtom = atom(
  null,
  (get, set, level: UserContext['energyLevel']) => {
    const current = get(userContextAtom);
    set(userContextAtom, { ...current, energyLevel: level });
  }
);

export const updateToddlerMoodAtom = atom(
  null,
  (get, set, mood: UserContext['toddlerMood']) => {
    const current = get(userContextAtom);
    set(userContextAtom, { ...current, toddlerMood: mood });
  }
);

export const updateHealthStatusAtom = atom(
  null,
  (get, set, status: UserContext['healthStatus']) => {
    const current = get(userContextAtom);
    set(userContextAtom, { ...current, healthStatus: status });
  }
);

export const updateLocationAtom = atom(
  null,
  (get, set, location: UserLocation | null) => {
    const current = get(userContextAtom);
    set(userContextAtom, { ...current, currentLocation: location });
  }
);

export const setLocationPermissionAtom = atom(
  null,
  (get, set, permission: UserContext['locationPermission']) => {
    const current = get(userContextAtom);
    set(userContextAtom, { ...current, locationPermission: permission });
  }
);

export const toggleLocationTrackingAtom = atom(
  null,
  (get, set, isTracking: boolean) => {
    const current = get(userContextAtom);
    set(userContextAtom, { ...current, isTrackingLocation: isTracking });
  }
);
