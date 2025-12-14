import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PanelState {
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  zIndex: number;
}

// All available floating panels
export type PanelId = 'tripPlanner' | 'days' | 'checklist' | 'filters' | 'suggestions' | 'alerts';

interface FloatingPanelState {
  panels: Record<PanelId, PanelState>;
  nextZIndex: number;

  // Actions
  openPanel: (id: PanelId) => void;
  closePanel: (id: PanelId) => void;
  toggleMinimize: (id: PanelId) => void;
  updatePosition: (id: PanelId, pos: { x: number; y: number }) => void;
  bringToFront: (id: PanelId) => void;
}

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
};

const INITIAL_Z_INDEX = 7;

export const useFloatingPanelStore = create<FloatingPanelState>()(
  persist(
    (set) => ({
      // Initial State
      panels: DEFAULT_PANELS,
      nextZIndex: INITIAL_Z_INDEX,

      // Actions
      openPanel: (id) =>
        set((state) => {
          const currentZIndex = state.nextZIndex;
          return {
            panels: {
              ...state.panels,
              [id]: {
                ...state.panels[id],
                isOpen: true,
                isMinimized: false,
                zIndex: currentZIndex,
              },
            },
            nextZIndex: currentZIndex + 1,
          };
        }),

      closePanel: (id) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [id]: {
              ...state.panels[id],
              isOpen: false,
            },
          },
        })),

      toggleMinimize: (id) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [id]: {
              ...state.panels[id],
              isMinimized: !state.panels[id].isMinimized,
            },
          },
        })),

      updatePosition: (id, pos) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [id]: {
              ...state.panels[id],
              position: pos,
            },
          },
        })),

      bringToFront: (id) =>
        set((state) => {
          const currentZIndex = state.nextZIndex;
          return {
            panels: {
              ...state.panels,
              [id]: {
                ...state.panels[id],
                zIndex: currentZIndex,
              },
            },
            nextZIndex: currentZIndex + 1,
          };
        }),
    }),
    {
      name: 'malaysia-trip-floating-panels-storage',
      partialize: (state) => ({
        panels: Object.entries(state.panels).reduce(
          (acc, [key, panel]) => ({
            ...acc,
            [key]: {
              position: panel.position,
              // Persist position only, reset open/minimized states on reload
              isOpen: false,
              isMinimized: false,
              zIndex: panel.zIndex,
            },
          }),
          {} as Record<PanelId, PanelState>
        ),
        nextZIndex: state.nextZIndex,
      }),
    }
  )
);
