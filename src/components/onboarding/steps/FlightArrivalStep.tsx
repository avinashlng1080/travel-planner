import { useOnboardingStore } from '@/stores/onboardingStore';
import { FlightPathAnimation } from '../FlightPathAnimation';

/**
 * Step 1: Flight Arrival
 * Automated cinematic animation showing the user "arriving" in Malaysia.
 * Auto-advances after animation completes.
 */
export function FlightArrivalStep() {
  const { advanceToNextStep } = useOnboardingStore();

  return (
    <FlightPathAnimation
      duration={3.5}
      onComplete={() => {
        // Small delay before advancing to let the landing animation settle
        setTimeout(() => {
          advanceToNextStep();
        }, 500);
      }}
    />
  );
}
