import posthog from 'posthog-js';

export const initPostHog = () => {
  if (typeof window !== 'undefined' && import.meta.env.VITE_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageview: false,
      persistence: 'localStorage',
    });
  }
};

export const trackEvent = (event: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && import.meta.env.VITE_POSTHOG_KEY) {
    posthog.capture(event, properties);
  }
};

// Predefined events for the travel planner
export const analytics = {
  locationViewed: (locationId: string, locationName: string) => {
    trackEvent('location_viewed', { locationId, locationName });
  },

  planSwitched: (from: 'A' | 'B', to: 'A' | 'B') => {
    trackEvent('plan_switched', { from, to });
  },

  daySelected: (dayId: string, date: string) => {
    trackEvent('day_selected', { dayId, date });
  },

  checklistItemCompleted: (checklistType: string, itemId: string) => {
    trackEvent('checklist_item_completed', { checklistType, itemId });
  },

  aiQuestionAsked: (questionPreview: string) => {
    trackEvent('ai_question_asked', { questionPreview: questionPreview.slice(0, 100) });
  },

  categoryToggled: (category: string, visible: boolean) => {
    trackEvent('category_toggled', { category, visible });
  },

  mapMarkerClicked: (locationId: string) => {
    trackEvent('map_marker_clicked', { locationId });
  },
};

export default posthog;
