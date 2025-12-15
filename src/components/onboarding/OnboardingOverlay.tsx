import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { PassportCard } from './PassportCard';
import { SkipButton } from './SkipButton';
import { FlightArrivalStep } from './steps/FlightArrivalStep';
import { WelcomeHomeStep } from './steps/WelcomeHomeStep';
import { DiscoverMapStep } from './steps/DiscoverMapStep';
import { AICompanionStep } from './steps/AICompanionStep';
import { PlanToggleStep } from './steps/PlanToggleStep';
import { JourneyCompleteStep } from './steps/JourneyCompleteStep';

/**
 * Main overlay container for the onboarding experience.
 * Renders the current step and persistent UI elements (passport, skip button).
 */
export function OnboardingOverlay() {
  const { status, currentStep, showSkipConfirm, setShowSkipConfirm, skipOnboarding } = useOnboardingStore();

  // Only render when onboarding is active
  if (status !== 'active') {
    return null;
  }

  // Render the current step component
  const renderStep = () => {
    switch (currentStep) {
      case 'flight':
        return <FlightArrivalStep />;
      case 'welcome':
        return <WelcomeHomeStep />;
      case 'map':
        return <DiscoverMapStep />;
      case 'chat':
        return <AICompanionStep />;
      case 'plans':
        return <PlanToggleStep />;
      case 'complete':
        return <JourneyCompleteStep />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-60 pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome tour"
    >
      {/* Step content - each step manages its own pointer events */}
      {renderStep()}

      {/* Passport card - always visible during onboarding */}
      {currentStep !== 'complete' && (
        <div className="pointer-events-auto">
          <PassportCard />
        </div>
      )}

      {/* Skip button - always accessible */}
      {currentStep !== 'complete' && (
        <div className="pointer-events-auto">
          <SkipButton />
        </div>
      )}

      {/* Skip confirmation modal */}
      {showSkipConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-70 pointer-events-auto"
          onClick={() => setShowSkipConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 max-w-sm mx-4 shadow-2xl border border-slate-200/50"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-display font-semibold text-slate-900 mb-2">
              Skip the tour?
            </h3>
            <p className="text-slate-600 text-sm mb-4">
              You can always take the tour later from Settings. Your travel companion will still be here to help!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium min-h-[44px]"
              >
                Continue Tour
              </button>
              <button
                onClick={skipOnboarding}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sunset-500 to-ocean-500 text-white hover:opacity-90 transition-opacity font-medium min-h-[44px]"
              >
                Skip for Now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
