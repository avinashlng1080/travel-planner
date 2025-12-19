import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { Location } from '../data/tripData';
import { markInteractionAtom } from './onboardingAtoms';
import type { TravelMode } from '../hooks/useCommutes';

// Dynamic pin created by AI chat
export interface DynamicPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category?: string;
  description?: string;
  reason?: string;
  createdAt: Date;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

// Persisted state atoms
const activePlanStorageAtom = atomWithStorage<'A' | 'B'>('malaysia-trip-ui-activePlan', 'A');
const visibleCategoriesStorageAtom = atomWithStorage<string[]>(
  'malaysia-trip-ui-visibleCategories',
  ALL_CATEGORIES
);
const sidebarCollapsedStorageAtom = atomWithStorage<boolean>('malaysia-trip-ui-sidebarCollapsed', false);
const chatMessagesStorageAtom = atomWithStorage<ChatMessage[]>('malaysia-trip-ui-chatMessages', []);

// Non-persisted state atoms
const selectedLocationBaseAtom = atom<Location | null>(null);
export const selectedLocationAtom = atom(
  (get) => get(selectedLocationBaseAtom),
  (_get, set, location: Location | null) => {
    set(selectedLocationBaseAtom, location);
    // Notify onboarding when a marker is selected
    if (location) {
      set(markInteractionAtom, 'marker');
    }
  }
);

export const selectedDayIdAtom = atom<string | null>(null);
export const activeSectionAtom = atom<string>('itinerary');
export const isAILoadingAtom = atom<boolean>(false);

// Focused activity for map synchronization
export interface FocusedActivity {
  activityId: string;
  locationId: string;
  lat: number;
  lng: number;
}
export const focusedActivityAtom = atom<FocusedActivity | null>(null);
export const authModalOpenAtom = atom<boolean>(false);
export const authModeAtom = atom<'login' | 'signup'>('login');
export const dynamicPinsAtom = atom<DynamicPin[]>([]);
export const newlyAddedPinsAtom = atom<DynamicPin[] | null>(null);

// Persisted atoms (exported for direct use)
export const activePlanAtom = atom(
  (get) => get(activePlanStorageAtom),
  (_get, set, update: 'A' | 'B') => {
    set(activePlanStorageAtom, update);
    // Notify onboarding when plan is toggled
    set(markInteractionAtom, 'plan');
  }
);

export const visibleCategoriesAtom = atom(
  (get) => get(visibleCategoriesStorageAtom),
  (_get, set, update: string[]) => {
    set(visibleCategoriesStorageAtom, update);
  }
);

export const sidebarCollapsedAtom = atom(
  (get) => get(sidebarCollapsedStorageAtom),
  (_get, set, update: boolean) => {
    set(sidebarCollapsedStorageAtom, update);
  }
);

export const chatMessagesAtom = atom(
  (get) => get(chatMessagesStorageAtom),
  (_get, set, update: ChatMessage[]) => {
    set(chatMessagesStorageAtom, update);
  }
);

// Action atoms
export const toggleCategoryAtom = atom(
  null,
  (get, set, category: string) => {
    const current = get(visibleCategoriesAtom);
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    set(visibleCategoriesAtom, updated);
  }
);

export const addChatMessageAtom = atom(
  null,
  (get, set, args: { role: 'user' | 'assistant'; content: string }) => {
    const { role, content } = args;
    const current = get(chatMessagesAtom);
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
    };
    set(chatMessagesAtom, [...current, newMessage]);
    // Notify onboarding when user sends a message
    if (role === 'user') {
      set(markInteractionAtom, 'chat');
    }
  }
);

export const clearChatMessagesAtom = atom(
  null,
  (_get, set) => {
    set(chatMessagesAtom, []);
  }
);

export const addDynamicPinsAtom = atom(
  null,
  (get, set, pins: Omit<DynamicPin, 'id' | 'createdAt'>[]) => {
    const current = get(dynamicPinsAtom);
    const newPins = pins.map((pin) => ({
      ...pin,
      id: `dynamic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    }));
    set(dynamicPinsAtom, [...current, ...newPins]);
    set(newlyAddedPinsAtom, newPins);
  }
);

export const clearDynamicPinsAtom = atom(
  null,
  (_get, set) => {
    set(dynamicPinsAtom, []);
    set(newlyAddedPinsAtom, null);
  }
);

export const removeDynamicPinAtom = atom(
  null,
  (get, set, id: string) => {
    const current = get(dynamicPinsAtom);
    set(dynamicPinsAtom, current.filter((pin) => pin.id !== id));
  }
);

export const clearNewlyAddedPinsAtom = atom(
  null,
  (_get, set) => {
    set(newlyAddedPinsAtom, null);
  }
);

// Commutes panel state
export const travelModeAtom = atomWithStorage<TravelMode>('malaysia-trip-ui-travelMode', 'DRIVING');
export const commutesPanelOpenAtom = atom<boolean>(false);
export const activeCommuteDestinationAtom = atom<string | null>(null);
