import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Onboarding Steps - "The Journey Begins"
 * Each step represents a milestone in the user's first experience
 */
export type OnboardingStep =
  | 'flight'    // Animated flight arrival
  | 'welcome'   // Claude welcomes user at home base
  | 'map'       // Discover map markers
  | 'chat'      // Interact with AI companion
  | 'plans'     // Toggle Plan A/B
  | 'complete'; // Journey complete, all stamps earned

export type OnboardingStatus = 'pending' | 'active' | 'skipped' | 'complete';

/**
 * Passport stamp earned at each step
 */
export interface PassportStamp {
  id: string;
  step: OnboardingStep;
  name: string;
  icon: string;
  earnedAt: number;
}

/**
 * Step configuration with metadata
 */
export interface StepConfig {
  step: OnboardingStep;
  name: string;
  stampIcon: string;
  stampName: string;
  requiresInteraction: boolean;
}

export const STEP_CONFIGS: StepConfig[] = [
  { step: 'flight', name: 'Flight Arrival', stampIcon: 'plane', stampName: 'Safe Landing', requiresInteraction: false },
  { step: 'welcome', name: 'Welcome Home', stampIcon: 'home', stampName: 'Home Base', requiresInteraction: true },
  { step: 'map', name: 'Discover Map', stampIcon: 'compass', stampName: 'Explorer', requiresInteraction: true },
  { step: 'chat', name: 'AI Companion', stampIcon: 'sparkles', stampName: 'Connected', requiresInteraction: true },
  { step: 'plans', name: 'Plan Toggle', stampIcon: 'route', stampName: 'Prepared', requiresInteraction: true },
  { step: 'complete', name: 'Journey Ready', stampIcon: 'check', stampName: 'Ready', requiresInteraction: false },
];

const STEP_ORDER: OnboardingStep[] = ['flight', 'welcome', 'map', 'chat', 'plans', 'complete'];

/**
 * Fallback messages for Claude when API is unavailable
 */
export const FALLBACK_MESSAGES: Record<OnboardingStep, string> = {
  flight: '',
  welcome: "Selamat datang! I'm your travel companion for this Malaysian adventure. This is your home base - everything starts and ends here. Ready for me to show you around?",
  map: "See those markers on the map? Each shape tells a different story. Hearts are toddler-friendly spots, cameras are attractions, and pagodas are temples. Try tapping one to learn more!",
  chat: "I'm always here to help plan your perfect trip. Ask me anything - like 'What should we do if it rains?' or 'Where's the best laksa near us?' I can even suggest new places right on the map!",
  plans: "Traveling with a toddler means always having a backup plan! Plan A is your adventure route. Plan B is for rainy days or tired little legs. Toggle between them anytime to see different options.",
  complete: "You're all set! Your passport has 5 stamps already, and your real adventure is about to begin. I'll be here whenever you need me. Selamat jalan - safe travels!",
};

interface OnboardingState {
  // Core state
  status: OnboardingStatus;
  currentStep: OnboardingStep;
  stepsCompleted: OnboardingStep[];
  stamps: PassportStamp[];

  // Interaction tracking
  hasInteractedWithMarker: boolean;
  hasInteractedWithChat: boolean;
  hasToggledPlan: boolean;

  // UI state
  isPassportExpanded: boolean;
  showSkipConfirm: boolean;

  // Actions
  startOnboarding: () => void;
  skipOnboarding: () => void;
  advanceToNextStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  completeCurrentStep: () => void;
  awardStamp: (step: OnboardingStep) => void;
  markInteraction: (type: 'marker' | 'chat' | 'plan') => void;
  setPassportExpanded: (expanded: boolean) => void;
  setShowSkipConfirm: (show: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  // Computed helpers
  getCurrentStepConfig: () => StepConfig | undefined;
  getStampCount: () => number;
  canAdvance: () => boolean;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      status: 'pending',
      currentStep: 'flight',
      stepsCompleted: [],
      stamps: [],
      hasInteractedWithMarker: false,
      hasInteractedWithChat: false,
      hasToggledPlan: false,
      isPassportExpanded: false,
      showSkipConfirm: false,

      // Start the onboarding experience
      startOnboarding: () =>
        set({
          status: 'active',
          currentStep: 'flight',
          stepsCompleted: [],
        }),

      // Skip onboarding entirely
      skipOnboarding: () =>
        set({
          status: 'skipped',
          currentStep: 'complete',
          showSkipConfirm: false,
        }),

      // Move to the next step in sequence
      advanceToNextStep: () => {
        const { currentStep, stepsCompleted, stamps } = get();
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        const nextStep = STEP_ORDER[currentIndex + 1] || 'complete';

        // Award stamp for completing current step (if not already awarded)
        const config = STEP_CONFIGS.find((c) => c.step === currentStep);
        const hasStamp = stamps.some((s) => s.step === currentStep);

        const newStamps =
          config && !hasStamp && currentStep !== 'complete'
            ? [
                ...stamps,
                {
                  id: `stamp-${currentStep}-${Date.now()}`,
                  step: currentStep,
                  name: config.stampName,
                  icon: config.stampIcon,
                  earnedAt: Date.now(),
                },
              ]
            : stamps;

        set({
          currentStep: nextStep,
          stepsCompleted: [...stepsCompleted, currentStep],
          stamps: newStamps,
          status: nextStep === 'complete' ? 'complete' : get().status,
        });
      },

      // Jump to a specific step (for manual navigation)
      goToStep: (step) => set({ currentStep: step }),

      // Mark current step as completed
      completeCurrentStep: () => {
        const { currentStep, stepsCompleted } = get();
        if (!stepsCompleted.includes(currentStep)) {
          set({ stepsCompleted: [...stepsCompleted, currentStep] });
        }
      },

      // Award a stamp manually (for special cases)
      awardStamp: (step) => {
        const { stamps } = get();
        const hasStamp = stamps.some((s) => s.step === step);
        const config = STEP_CONFIGS.find((c) => c.step === step);

        if (!hasStamp && config) {
          set({
            stamps: [
              ...stamps,
              {
                id: `stamp-${step}-${Date.now()}`,
                step,
                name: config.stampName,
                icon: config.stampIcon,
                earnedAt: Date.now(),
              },
            ],
          });
        }
      },

      // Track user interactions to auto-advance
      markInteraction: (type) => {
        const { currentStep } = get();

        switch (type) {
          case 'marker':
            set({ hasInteractedWithMarker: true });
            if (currentStep === 'map') {
              get().advanceToNextStep();
            }
            break;
          case 'chat':
            set({ hasInteractedWithChat: true });
            if (currentStep === 'chat') {
              get().advanceToNextStep();
            }
            break;
          case 'plan':
            set({ hasToggledPlan: true });
            if (currentStep === 'plans') {
              get().advanceToNextStep();
            }
            break;
        }
      },

      // UI actions
      setPassportExpanded: (expanded) => set({ isPassportExpanded: expanded }),
      setShowSkipConfirm: (show) => set({ showSkipConfirm: show }),

      // Complete onboarding (called from JourneyCompleteStep)
      completeOnboarding: () =>
        set({
          status: 'complete',
          currentStep: 'complete',
        }),

      // Reset for testing or re-doing tour
      resetOnboarding: () =>
        set({
          status: 'pending',
          currentStep: 'flight',
          stepsCompleted: [],
          stamps: [],
          hasInteractedWithMarker: false,
          hasInteractedWithChat: false,
          hasToggledPlan: false,
          isPassportExpanded: false,
          showSkipConfirm: false,
        }),

      // Helpers
      getCurrentStepConfig: () => {
        const { currentStep } = get();
        return STEP_CONFIGS.find((c) => c.step === currentStep);
      },

      getStampCount: () => get().stamps.length,

      canAdvance: () => {
        const { currentStep, hasInteractedWithMarker, hasInteractedWithChat, hasToggledPlan } = get();
        const config = STEP_CONFIGS.find((c) => c.step === currentStep);

        if (!config?.requiresInteraction) return true;

        switch (currentStep) {
          case 'welcome':
            return true; // User chooses to continue
          case 'map':
            return hasInteractedWithMarker;
          case 'chat':
            return hasInteractedWithChat;
          case 'plans':
            return hasToggledPlan;
          default:
            return true;
        }
      },
    }),
    {
      name: 'travel-planner-onboarding',
      partialize: (state) => ({
        status: state.status,
        stepsCompleted: state.stepsCompleted,
        stamps: state.stamps,
      }),
    }
  )
);
