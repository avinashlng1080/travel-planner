import { useEffect, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { OnboardingOverlay } from './OnboardingOverlay';

interface OnboardingProviderProps {
  children: ReactNode;
  /** Set to true to trigger onboarding check (e.g., after first trip created) */
  shouldTrigger?: boolean;
}

/**
 * OnboardingProvider wraps the app and manages the onboarding overlay.
 * The overlay only appears when:
 * 1. shouldTrigger is true (user just entered their first trip)
 * 2. status is 'pending' (hasn't completed or skipped onboarding)
 */
export function OnboardingProvider({ children, shouldTrigger = false }: OnboardingProviderProps) {
  const { status, startOnboarding } = useOnboardingStore();

  // Auto-start onboarding when triggered and status is pending
  useEffect(() => {
    if (shouldTrigger && status === 'pending') {
      startOnboarding();
    }
  }, [shouldTrigger, status, startOnboarding]);

  // Handle Escape key to show skip confirmation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status === 'active') {
        useOnboardingStore.getState().setShowSkipConfirm(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  return (
    <>
      {children}
      <AnimatePresence>
        {status === 'active' && <OnboardingOverlay />}
      </AnimatePresence>
    </>
  );
}
