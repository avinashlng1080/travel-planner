import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  /** Unix timestamp in milliseconds (stored as number for JSON serialization compatibility) */
  timestamp: number;
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
  'travel-planner-user-context',
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

// Energy theme types and derived atom
export interface EnergyTheme {
  level: 'high' | 'medium' | 'low';
  suggestPlanB: boolean;
  colors: {
    primary: string;
    primaryBg: string;
    accent: string;
    accentBg: string;
    border: string;
    text: string;
    mutedText: string;
    badge: string;
    badgeBg: string;
  };
  css: {
    panelBg: string;
    panelBorder: string;
    headerGradient: string;
    accentGradient: string;
    tabActive: string;
    tabActiveBg: string;
  };
  label: string;
  icon: 'zap' | 'sun' | 'moon';
  message: string | null;
}

// Derived atom that computes the visual theme based on user context
export const energyThemeAtom = atom<EnergyTheme>((get) => {
  const context = get(userContextAtom);
  const { energyLevel, toddlerMood, healthStatus } = context;

  // Determine if we should suggest Plan B based on overall context
  const suggestPlanB =
    energyLevel === 'low' ||
    toddlerMood === 'fussy' ||
    toddlerMood === 'tired' ||
    healthStatus !== 'good';

  // High energy theme - vibrant sunset/ocean colors
  if (energyLevel === 'high' && !suggestPlanB) {
    return {
      level: 'high',
      suggestPlanB: false,
      colors: {
        primary: 'text-sunset-600',
        primaryBg: 'bg-sunset-500',
        accent: 'text-ocean-600',
        accentBg: 'bg-ocean-500',
        border: 'border-sunset-200',
        text: 'text-slate-900',
        mutedText: 'text-slate-600',
        badge: 'text-sunset-700',
        badgeBg: 'bg-sunset-100',
      },
      css: {
        panelBg: 'bg-gradient-to-br from-white via-sunset-50/30 to-ocean-50/20',
        panelBorder: 'border-sunset-200/50',
        headerGradient: 'from-sunset-500 via-sunset-400 to-ocean-500',
        accentGradient: 'from-sunset-500 to-ocean-600',
        tabActive: 'text-sunset-600',
        tabActiveBg: 'bg-sunset-50',
      },
      label: 'High Energy',
      icon: 'zap',
      message: null,
    };
  }

  // Low energy theme - calm, muted colors with Plan B indication
  if (energyLevel === 'low' || suggestPlanB) {
    return {
      level: 'low',
      suggestPlanB: true,
      colors: {
        primary: 'text-slate-600',
        primaryBg: 'bg-slate-500',
        accent: 'text-blue-500',
        accentBg: 'bg-blue-500',
        border: 'border-slate-300',
        text: 'text-slate-800',
        mutedText: 'text-slate-500',
        badge: 'text-blue-700',
        badgeBg: 'bg-blue-100',
      },
      css: {
        panelBg: 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100/50',
        panelBorder: 'border-blue-200/50',
        headerGradient: 'from-slate-400 via-blue-400 to-slate-500',
        accentGradient: 'from-blue-400 to-slate-500',
        tabActive: 'text-blue-600',
        tabActiveBg: 'bg-blue-50',
      },
      label: 'Rest Mode',
      icon: 'moon',
      message:
        healthStatus !== 'good'
          ? 'Take it easy - consider indoor activities near medical facilities'
          : toddlerMood === 'fussy' || toddlerMood === 'tired'
          ? 'Toddler needs rest - Plan B recommended'
          : 'Low energy - Plan B activities suggested',
    };
  }

  // Medium energy theme - balanced, default styling
  return {
    level: 'medium',
    suggestPlanB: false,
    colors: {
      primary: 'text-ocean-600',
      primaryBg: 'bg-ocean-500',
      accent: 'text-sunset-500',
      accentBg: 'bg-sunset-500',
      border: 'border-slate-200',
      text: 'text-slate-900',
      mutedText: 'text-slate-600',
      badge: 'text-ocean-700',
      badgeBg: 'bg-ocean-100',
    },
    css: {
      panelBg: 'bg-white/95',
      panelBorder: 'border-slate-200/50',
      headerGradient: 'from-ocean-500 to-sunset-500',
      accentGradient: 'from-ocean-500 to-sunset-500',
      tabActive: 'text-sunset-600',
      tabActiveBg: 'bg-sunset-50/50',
    },
    label: 'Balanced',
    icon: 'sun',
    message: null,
  };
});
