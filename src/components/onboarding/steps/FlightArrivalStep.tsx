import { useAtom, useSetAtom } from 'jotai';

import { advanceToNextStepAtom, tripDestinationAtom } from '@/atoms/onboardingAtoms';

import { FlightPathAnimation } from '../FlightPathAnimation';

/**
 * Step 1: Flight Arrival
 * Automated cinematic animation showing the user "arriving" in Malaysia.
 * Auto-advances after animation completes.
 */
export function FlightArrivalStep() {
  const advanceToNextStep = useSetAtom(advanceToNextStepAtom);
  const [tripDestination] = useAtom(tripDestinationAtom);

  return (
    <FlightPathAnimation
      duration={3.5}
      destination={tripDestination || undefined}
      onComplete={() => {
        // Small delay before advancing to let the landing animation settle
        setTimeout(() => {
          advanceToNextStep();
        }, 500);
      }}
    />
  );
}
