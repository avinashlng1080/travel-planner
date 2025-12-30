import { motion } from 'framer-motion';
import { Route, ToggleLeft, ArrowLeftRight, ArrowRight } from 'lucide-react';
import { useAtom, useSetAtom } from 'jotai';
import {
  hasToggledPlanAtom,
  advanceToNextStepAtom,
  FALLBACK_MESSAGES,
  STEP_CONFIGS,
} from '@/atoms/onboardingAtoms';
import { SpotlightOverlay } from '../SpotlightOverlay';

/**
 * Step 5: Plan Toggle
 * Teaches the user about Plan A/B system.
 * Advances automatically when user toggles the plan.
 */
export function PlanToggleStep() {
  const [hasToggledPlan] = useAtom(hasToggledPlanAtom);
  const advanceToNextStep = useSetAtom(advanceToNextStepAtom);

  // Get current step number for display
  const stepNumber = STEP_CONFIGS.findIndex((c) => c.step === 'plans') + 1;

  return (
    <>
      {/* Overlay */}
      <SpotlightOverlay opacity={0.4} capturePointer={false} />

      {/* Instruction card - positioned near center-top */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-24 left-1/2 -translate-x-1/2 z-60 w-[90%] max-w-md pointer-events-auto"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 p-4">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-ocean-400 to-emerald-500 text-white text-sm font-bold">
              {stepNumber}
            </span>
            <span className="text-xs text-slate-400 font-medium">Step {stepNumber} of 5</span>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
              <Route className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-slate-900 mb-1">Plan A & Plan B</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{FALLBACK_MESSAGES.plans}</p>
            </div>
          </div>

          {/* Visual representation of plans */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-ocean-50 rounded-xl border-2 border-ocean-200">
              <div className="w-3 h-3 rounded-full bg-ocean-500" />
              <span className="text-ocean-700 font-semibold text-sm">Plan A</span>
              <span className="text-ocean-500 text-xs">Adventure</span>
            </div>
            <ArrowLeftRight className="w-5 h-5 text-slate-400" />
            <div className="flex items-center gap-2 px-4 py-2 bg-sunset-50 rounded-xl border-2 border-sunset-200">
              <div className="w-3 h-3 rounded-full bg-sunset-500" />
              <span className="text-sunset-700 font-semibold text-sm">Plan B</span>
              <span className="text-sunset-500 text-xs">Backup</span>
            </div>
          </div>

          {/* Interaction prompt */}
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center justify-center gap-2 mt-4 py-2 px-4 bg-sunset-50 rounded-xl"
          >
            <ToggleLeft className="w-4 h-4 text-sunset-500" />
            <span className="text-sunset-600 text-sm font-medium">
              {hasToggledPlan ? 'Perfect! Now you know!' : 'Click Plan A or Plan B above'}
            </span>
          </motion.div>

          {/* Continue button - fallback */}
          <button
            onClick={advanceToNextStep}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px] font-medium text-sm"
          >
            <span>Continue to next step</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Arrow pointing to header toggle */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="fixed top-16 left-1/2 -translate-x-1/2 z-60"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="flex flex-col items-center"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-sunset-500 rotate-90"
          >
            <path
              d="M5 12H19M19 12L12 5M19 12L12 19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg mt-2">
            <span className="text-sm font-medium text-slate-700">Find the toggle here</span>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
