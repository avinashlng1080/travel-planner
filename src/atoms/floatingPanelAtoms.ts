import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

interface PanelState {
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  zIndex: number;
}

// All available floating panels
export type PanelId = 'tripPlanner' | 'days' | 'checklist' | 'filters' | 'suggestions' | 'alerts' | 'itinerary' | 'collaboration' | 'weather';

// Helper function to get viewport-aware default position
const getDefaultPosition = (preferredX: number, preferredY: number): { x: number; y: number } => {
  if (typeof window === 'undefined') {
    return { x: preferredX, y: preferredY };
  }

  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    // On mobile, center panels with 16px margin
    return { x: 16, y: preferredY };
  }

  // On desktop, ensure x position doesn't exceed viewport
  const safeX = Math.min(preferredX, window.innerWidth - 400); // 400 = approx panel width
  return { x: safeX, y: preferredY };
};

// Default panel configurations
const DEFAULT_PANELS: Record<PanelId, PanelState> = {
  tripPlanner: {
    isOpen: false,
    isMinimized: false,
    position: getDefaultPosition(70, 70),
    zIndex: 1,
  },
  days: {
    isOpen: false,
    isMinimized: false,
    position: getDefaultPosition(70, 70),
    zIndex: 2,
  },
  checklist: {
    isOpen: false,
    isMinimized: false,
    position: getDefaultPosition(500, 100),
    zIndex: 3,
  },
  filters: {
    isOpen: false,
    isMinimized: false,
    position: getDefaultPosition(70, 400),
    zIndex: 4,
  },
  suggestions: {
    isOpen: false,
    isMinimized: false,
    position: getDefaultPosition(400, 70),
    zIndex: 5,
  },
  alerts: {
    isOpen: false,
    isMinimized: false,
    position: getDefaultPosition(400, 200),
    zIndex: 6,
  },
  itinerary: {
    isOpen: false,
    isMinimized: false,
    position: getDefaultPosition(70, 70),
    zIndex: 7,
  },
  collaboration: {
    isOpen: false,
    isMinimized: false,
    position: { x: 80, y: 180 },
    zIndex: 100,
  },
  weather: {
    isOpen: false,
    isMinimized: false,
    position: getDefaultPosition(70, 300),
    zIndex: 8,
  },
};

const INITIAL_Z_INDEX = 8;

// Storage atom for persisting positions only
const panelsStorageAtom = atomWithStorage<Record<PanelId, Partial<PanelState>>>(
  'malaysia-trip-floating-panels-storage',
  {} as Record<PanelId, Partial<PanelState>>
);

const nextZIndexStorageAtom = atomWithStorage<number>(
  'malaysia-trip-floating-panels-zindex',
  INITIAL_Z_INDEX
);

// Initialize panel state with persisted positions but reset open/minimized states
const initializePanels = (): Record<PanelId, PanelState> => {
  const panels = {} as Record<PanelId, PanelState>;

  // Try to get stored positions from localStorage
  let stored: Record<PanelId, Partial<PanelState>> = {} as Record<PanelId, Partial<PanelState>>;
  try {
    const storedData = localStorage.getItem('malaysia-trip-floating-panels-storage');
    if (storedData) {
      stored = JSON.parse(storedData);
    }
  } catch (_e) {
    // Ignore localStorage errors
  }

  for (const [key, defaultState] of Object.entries(DEFAULT_PANELS)) {
    const panelId = key as PanelId;
    panels[panelId] = {
      ...defaultState,
      position: stored[panelId]?.position || defaultState.position,
      zIndex: stored[panelId]?.zIndex || defaultState.zIndex,
      // Always reset open/minimized states on reload
      isOpen: false,
      isMinimized: false,
    };
  }

  return panels;
};

// Main panels atom - holds the actual state
const panelsStateAtom = atom<Record<PanelId, PanelState>>(initializePanels());

// Derived atom that syncs position changes to localStorage
export const panelsAtom = atom(
  (get) => get(panelsStateAtom),
  (_get, set, update: Record<PanelId, PanelState>) => {
    // Update the main state
    set(panelsStateAtom, update);

    // Persist only positions and z-indices to localStorage
    const toStore = {} as Record<PanelId, Partial<PanelState>>;
    for (const [key, panel] of Object.entries(update)) {
      toStore[key as PanelId] = {
        position: panel.position,
        zIndex: panel.zIndex,
      };
    }
    set(panelsStorageAtom, toStore);
  }
);

export const nextZIndexAtom = atom(
  (get) => get(nextZIndexStorageAtom),
  (_get, set, update: number) => set(nextZIndexStorageAtom, update)
);

// Helper atoms for common operations
export const openPanelAtom = atom(
  null,
  (get, set, panelId: PanelId) => {
    const panels = get(panelsAtom);
    const currentZIndex = get(nextZIndexAtom);
    const isMobile = get(isMobileViewAtom);

    // On mobile, set this as the single active modal
    if (isMobile) {
      set(activeMobileModalAtom, panelId);
    }

    set(panelsAtom, {
      ...panels,
      [panelId]: {
        ...panels[panelId],
        isOpen: true,
        isMinimized: false,
        zIndex: currentZIndex,
      },
    });
    set(nextZIndexAtom, currentZIndex + 1);
  }
);

export const closePanelAtom = atom(
  null,
  (get, set, panelId: PanelId) => {
    const panels = get(panelsAtom);
    const activeMobileModal = get(activeMobileModalAtom);

    // Clear active mobile modal if closing the active one
    if (activeMobileModal === panelId) {
      set(activeMobileModalAtom, null);
    }

    set(panelsAtom, {
      ...panels,
      [panelId]: {
        ...panels[panelId],
        isOpen: false,
      },
    });
  }
);

export const toggleMinimizeAtom = atom(
  null,
  (get, set, panelId: PanelId) => {
    const panels = get(panelsAtom);

    set(panelsAtom, {
      ...panels,
      [panelId]: {
        ...panels[panelId],
        isMinimized: !panels[panelId].isMinimized,
      },
    });
  }
);

export const updatePositionAtom = atom(
  null,
  (get, set, args: { panelId: PanelId; position: { x: number; y: number } }) => {
    const { panelId, position } = args;
    const panels = get(panelsAtom);

    set(panelsAtom, {
      ...panels,
      [panelId]: {
        ...panels[panelId],
        position,
      },
    });
  }
);

export const bringToFrontAtom = atom(
  null,
  (get, set, panelId: PanelId) => {
    const panels = get(panelsAtom);
    const currentZIndex = get(nextZIndexAtom);

    set(panelsAtom, {
      ...panels,
      [panelId]: {
        ...panels[panelId],
        zIndex: currentZIndex,
      },
    });
    set(nextZIndexAtom, currentZIndex + 1);
  }
);

// Mobile-specific state atoms
export const isMobileViewAtom = atom<boolean>((get) => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768; // Tailwind md breakpoint
});

export const activeMobileModalAtom = atom<PanelId | null>(null);
