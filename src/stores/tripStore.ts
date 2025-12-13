import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LOCATIONS, DAILY_PLANS, TRAVEL_PLANS } from '../data/tripData';
import type { Location, DayPlan, TravelPlan } from '../data/tripData';

interface TripState {
  // Data
  locations: Location[];
  dayPlans: DayPlan[];
  travelPlans: TravelPlan[];

  // UI State
  selectedLocation: Location | null;
  selectedDay: string | null;
  visibleCategories: string[];
  visiblePlans: string[];
  chatOpen: boolean;

  // Actions
  selectLocation: (location: Location | null) => void;
  selectDay: (dayId: string | null) => void;
  toggleCategory: (category: string) => void;
  togglePlan: (planId: string) => void;
  setChatOpen: (open: boolean) => void;
  reorderSchedule: (dayId: string, plan: 'A' | 'B', itemIds: string[]) => void;
  setAllCategories: (show: boolean) => void;
}

export const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  'home-base': { label: 'Home Base', color: '#EC4899' },
  'toddler-friendly': { label: 'Toddler Friendly', color: '#F472B6' },
  'attraction': { label: 'Attractions', color: '#10B981' },
  'shopping': { label: 'Shopping', color: '#8B5CF6' },
  'restaurant': { label: 'Restaurants', color: '#F59E0B' },
  'nature': { label: 'Nature & Parks', color: '#22C55E' },
  'temple': { label: 'Temples', color: '#EF4444' },
  'playground': { label: 'Playgrounds', color: '#06B6D4' },
  'medical': { label: 'Medical', color: '#DC2626' },
  'avoid': { label: 'Avoid', color: '#6B7280' },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG);

export const useTripStore = create<TripState>()(
  persist(
    (set) => ({
      locations: LOCATIONS,
      dayPlans: DAILY_PLANS,
      travelPlans: TRAVEL_PLANS,

      selectedLocation: null,
      selectedDay: null,
      visibleCategories: ALL_CATEGORIES,
      visiblePlans: ['plan-a', 'plan-b'],
      chatOpen: true,

      selectLocation: (location) => set({ selectedLocation: location }),
      selectDay: (dayId) => set({ selectedDay: dayId }),
      toggleCategory: (category) => set((state) => ({
        visibleCategories: state.visibleCategories.includes(category)
          ? state.visibleCategories.filter(c => c !== category)
          : [...state.visibleCategories, category]
      })),
      togglePlan: (planId) => set((state) => ({
        visiblePlans: state.visiblePlans.includes(planId)
          ? state.visiblePlans.filter(p => p !== planId)
          : [...state.visiblePlans, planId]
      })),
      setChatOpen: (open) => set({ chatOpen: open }),
      reorderSchedule: (dayId, plan, itemIds) => set((state) => ({
        dayPlans: state.dayPlans.map(day => {
          if (day.id !== dayId) return day;
          const planKey = plan === 'A' ? 'planA' : 'planB';
          const items = day[planKey];
          const reordered = itemIds.map(id => items.find(item => item.id === id)!).filter(Boolean);
          return { ...day, [planKey]: reordered };
        })
      })),
      setAllCategories: (show) => set({
        visibleCategories: show ? ALL_CATEGORIES : []
      }),
    }),
    {
      name: 'malaysia-trip-storage',
    }
  )
);
