import { useEffect, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAtom, useSetAtom } from 'jotai';
import { statusAtom, startOnboardingAtom, showSkipConfirmAtom } from '@/atoms/onboardingAtoms';
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
  const [status] = useAtom(statusAtom);
  const startOnboarding = useSetAtom(startOnboardingAtom);
  const setShowSkipConfirm = useSetAtom(showSkipConfirmAtom);

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
        setShowSkipConfirm(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  return (
    <>
      {children}
      <AnimatePresence>{status === 'active' && <OnboardingOverlay />}</AnimatePresence>
    </>
  );
}
