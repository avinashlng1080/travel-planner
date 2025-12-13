import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Location } from '../data/tripData';

interface UIState {
  // UI State
  selectedLocation: Location | null;
  selectedDayId: string | null;
  activePlan: 'A' | 'B';
  activeSection: string;
  visibleCategories: string[];
  sidebarCollapsed: boolean;
  chatMessages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  isAILoading: boolean;

  // Actions
  selectLocation: (location: Location | null) => void;
  selectDay: (dayId: string | null) => void;
  setActivePlan: (plan: 'A' | 'B') => void;
  setActiveSection: (section: string) => void;
  toggleCategory: (category: string) => void;
  setAllCategories: (categories: string[]) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  clearChatMessages: () => void;
  setAILoading: (loading: boolean) => void;
}

const ALL_CATEGORIES = [
  'home-base',
  'toddler-friendly',
  'attraction',
  'shopping',
  'restaurant',
  'nature',
  'temple',
  'playground',
  'medical',
  'avoid',
];

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial State
      selectedLocation: null,
      selectedDayId: null,
      activePlan: 'A',
      activeSection: 'itinerary',
      visibleCategories: ALL_CATEGORIES,
      sidebarCollapsed: false,
      chatMessages: [],
      isAILoading: false,

      // Actions
      selectLocation: (location) => set({ selectedLocation: location }),
      selectDay: (dayId) => set({ selectedDayId: dayId }),
      setActivePlan: (plan) => set({ activePlan: plan }),
      setActiveSection: (section) => set({ activeSection: section }),
      toggleCategory: (category) =>
        set((state) => ({
          visibleCategories: state.visibleCategories.includes(category)
            ? state.visibleCategories.filter((c) => c !== category)
            : [...state.visibleCategories, category],
        })),
      setAllCategories: (categories) => set({ visibleCategories: categories }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      addChatMessage: (role, content) =>
        set((state) => ({
          chatMessages: [
            ...state.chatMessages,
            {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              role,
              content,
              timestamp: new Date(),
            },
          ],
        })),
      clearChatMessages: () => set({ chatMessages: [] }),
      setAILoading: (loading) => set({ isAILoading: loading }),
    }),
    {
      name: 'malaysia-trip-ui-storage',
      partialize: (state) => ({
        activePlan: state.activePlan,
        visibleCategories: state.visibleCategories,
        sidebarCollapsed: state.sidebarCollapsed,
        chatMessages: state.chatMessages,
      }),
    }
  )
);
