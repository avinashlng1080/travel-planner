import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PanelState {
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  zIndex: number;
}

export type PanelId = 'days' | 'itinerary' | 'checklist' | 'alerts' | 'suggestions' | 'filters';

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

// Default panel configurations with staggered positions
const DEFAULT_PANELS: Record<PanelId, PanelState> = {
  days: {
    isOpen: false,
    isMinimized: false,
    position: { x: 70, y: 80 },
    zIndex: 1,
  },
  itinerary: {
    isOpen: false,
    isMinimized: false,
    position: { x: 90, y: 100 },
    zIndex: 2,
  },
  checklist: {
    isOpen: false,
    isMinimized: false,
    position: { x: 110, y: 120 },
    zIndex: 3,
  },
  alerts: {
    isOpen: false,
    isMinimized: false,
    position: { x: 130, y: 140 },
    zIndex: 4,
  },
  suggestions: {
    isOpen: false,
    isMinimized: false,
    position: { x: 150, y: 160 },
    zIndex: 5,
  },
  filters: {
    isOpen: false,
    isMinimized: false,
    position: { x: 170, y: 180 },
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
