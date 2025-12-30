import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

/**
 * Onboarding Steps - "The Journey Begins"
 * Each step represents a milestone in the user's first experience
 */
export type OnboardingStep =
  | 'flight' // Animated flight arrival
  | 'welcome' // Claude welcomes user at home base
  | 'map' // Discover map markers
  | 'chat' // Interact with AI companion
  | 'plans' // Toggle Plan A/B
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
  {
    step: 'flight',
    name: 'Flight Arrival',
    stampIcon: 'plane',
    stampName: 'Safe Landing',
    requiresInteraction: false,
  },
  {
    step: 'welcome',
    name: 'Welcome Home',
    stampIcon: 'home',
    stampName: 'Home Base',
    requiresInteraction: true,
  },
  {
    step: 'map',
    name: 'Discover Map',
    stampIcon: 'compass',
    stampName: 'Explorer',
    requiresInteraction: true,
  },
  {
    step: 'chat',
    name: 'AI Companion',
    stampIcon: 'sparkles',
    stampName: 'Connected',
    requiresInteraction: true,
  },
  {
    step: 'plans',
    name: 'Plan Toggle',
    stampIcon: 'route',
    stampName: 'Prepared',
    requiresInteraction: true,
  },
  {
    step: 'complete',
    name: 'Journey Ready',
    stampIcon: 'check',
    stampName: 'Ready',
    requiresInteraction: false,
  },
];

const STEP_ORDER: OnboardingStep[] = ['flight', 'welcome', 'map', 'chat', 'plans', 'complete'];

/**
 * Fallback messages for Claude when API is unavailable
 */
export const FALLBACK_MESSAGES: Record<OnboardingStep, string> = {
  flight: '',
  welcome:
    "Selamat datang! I'm your travel companion for this Malaysian adventure. This is your home base - everything starts and ends here. Ready for me to show you around?",
  map: 'See those markers on the map? Each shape tells a different story. Hearts are toddler-friendly spots, cameras are attractions, and pagodas are temples. Try tapping one to learn more!',
  chat: "I'm always here to help plan your perfect trip. Ask me anything - like 'What should we do if it rains?' or 'Where's the best laksa near us?' I can even suggest new places right on the map!",
  plans:
    'Traveling with a toddler means always having a backup plan! Plan A is your adventure route. Plan B is for rainy days or tired little legs. Toggle between them anytime to see different options.',
  complete:
    "You're all set! Your passport has 5 stamps already, and your real adventure is about to begin. I'll be here whenever you need me. Selamat jalan - safe travels!",
};

// Persisted state atoms
const statusStorageAtom = atomWithStorage<OnboardingStatus>(
  'travel-planner-onboarding-status',
  'pending'
);
const stepsCompletedStorageAtom = atomWithStorage<OnboardingStep[]>(
  'travel-planner-onboarding-stepsCompleted',
  []
);
const stampsStorageAtom = atomWithStorage<PassportStamp[]>('travel-planner-onboarding-stamps', []);

// Non-persisted state atoms
export const currentStepAtom = atom<OnboardingStep>('flight');
export const hasInteractedWithMarkerAtom = atom<boolean>(false);
export const hasInteractedWithChatAtom = atom<boolean>(false);
export const hasToggledPlanAtom = atom<boolean>(false);
export const isPassportExpandedAtom = atom<boolean>(false);
export const showSkipConfirmAtom = atom<boolean>(false);

// Persisted atoms (exported for direct use)
export const statusAtom = atom(
  (get) => get(statusStorageAtom),
  (_get, set, update: OnboardingStatus) => {
    set(statusStorageAtom, update);
  }
);

export const stepsCompletedAtom = atom(
  (get) => get(stepsCompletedStorageAtom),
  (_get, set, update: OnboardingStep[]) => {
    set(stepsCompletedStorageAtom, update);
  }
);

export const stampsAtom = atom(
  (get) => get(stampsStorageAtom),
  (_get, set, update: PassportStamp[]) => {
    set(stampsStorageAtom, update);
  }
);

// Action atoms
export const startOnboardingAtom = atom(null, (_get, set) => {
  set(statusAtom, 'active');
  set(currentStepAtom, 'flight');
  set(stepsCompletedAtom, []);
});

export const skipOnboardingAtom = atom(null, (_get, set) => {
  set(statusAtom, 'skipped');
  set(currentStepAtom, 'complete');
  set(showSkipConfirmAtom, false);
});

export const advanceToNextStepAtom = atom(null, (get, set) => {
  const currentStep = get(currentStepAtom);
  const stepsCompleted = get(stepsCompletedAtom);
  const stamps = get(stampsAtom);

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

  set(currentStepAtom, nextStep);
  set(stepsCompletedAtom, [...stepsCompleted, currentStep]);
  set(stampsAtom, newStamps);

  if (nextStep === 'complete') {
    set(statusAtom, 'complete');
  }
});

export const goToStepAtom = atom(null, (_get, set, step: OnboardingStep) => {
  set(currentStepAtom, step);
});

export const completeCurrentStepAtom = atom(null, (get, set) => {
  const currentStep = get(currentStepAtom);
  const stepsCompleted = get(stepsCompletedAtom);

  if (!stepsCompleted.includes(currentStep)) {
    set(stepsCompletedAtom, [...stepsCompleted, currentStep]);
  }
});

export const awardStampAtom = atom(null, (get, set, step: OnboardingStep) => {
  const stamps = get(stampsAtom);
  const hasStamp = stamps.some((s) => s.step === step);
  const config = STEP_CONFIGS.find((c) => c.step === step);

  if (!hasStamp && config) {
    set(stampsAtom, [
      ...stamps,
      {
        id: `stamp-${step}-${Date.now()}`,
        step,
        name: config.stampName,
        icon: config.stampIcon,
        earnedAt: Date.now(),
      },
    ]);
  }
});

export const markInteractionAtom = atom(null, (get, set, type: 'marker' | 'chat' | 'plan') => {
  const currentStep = get(currentStepAtom);

  switch (type) {
    case 'marker':
      set(hasInteractedWithMarkerAtom, true);
      if (currentStep === 'map') {
        set(advanceToNextStepAtom);
      }
      break;
    case 'chat':
      set(hasInteractedWithChatAtom, true);
      if (currentStep === 'chat') {
        set(advanceToNextStepAtom);
      }
      break;
    case 'plan':
      set(hasToggledPlanAtom, true);
      if (currentStep === 'plans') {
        set(advanceToNextStepAtom);
      }
      break;
  }
});

export const completeOnboardingAtom = atom(null, (_get, set) => {
  set(statusAtom, 'complete');
  set(currentStepAtom, 'complete');
});

export const resetOnboardingAtom = atom(null, (_get, set) => {
  set(statusAtom, 'pending');
  set(currentStepAtom, 'flight');
  set(stepsCompletedAtom, []);
  set(stampsAtom, []);
  set(hasInteractedWithMarkerAtom, false);
  set(hasInteractedWithChatAtom, false);
  set(hasToggledPlanAtom, false);
  set(isPassportExpandedAtom, false);
  set(showSkipConfirmAtom, false);
});

// Computed atoms
export const getCurrentStepConfigAtom = atom((get) => {
  const currentStep = get(currentStepAtom);
  return STEP_CONFIGS.find((c) => c.step === currentStep);
});

export const getStampCountAtom = atom((get) => {
  const stamps = get(stampsAtom);
  return stamps.length;
});

export const canAdvanceAtom = atom((get) => {
  const currentStep = get(currentStepAtom);
  const hasInteractedWithMarker = get(hasInteractedWithMarkerAtom);
  const hasInteractedWithChat = get(hasInteractedWithChatAtom);
  const hasToggledPlan = get(hasToggledPlanAtom);
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
});
