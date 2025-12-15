import { motion } from 'framer-motion';
import { Map, MousePointer, ArrowRight } from 'lucide-react';
import { useOnboardingStore, FALLBACK_MESSAGES, STEP_CONFIGS } from '@/stores/onboardingStore';
import { SpotlightOverlay } from '../SpotlightOverlay';

/**
 * Step 3: Discover Map
 * Teaches the user about map markers and requires them to tap one.
 * Advances automatically when user interacts with any marker.
 */
export function DiscoverMapStep() {
  const { hasInteractedWithMarker, advanceToNextStep } = useOnboardingStore();

  // Get current step number for display
  const stepNumber = STEP_CONFIGS.findIndex(c => c.step === 'map') + 1;

  return (
    <>
      {/* Lighter overlay to let map be more visible */}
      <SpotlightOverlay opacity={0.3} capturePointer={false} />

      {/* Floating instruction card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-60 w-[90%] max-w-md pointer-events-auto"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 p-4">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-ocean-400 to-ocean-600 text-white text-sm font-bold">
              {stepNumber}
            </span>
            <span className="text-xs text-slate-400 font-medium">Step {stepNumber} of 5</span>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center flex-shrink-0">
              <Map className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-slate-900 mb-1">
                Explore the Map
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {FALLBACK_MESSAGES.map}
              </p>
            </div>
          </div>

          {/* Interaction prompt */}
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center justify-center gap-2 mt-4 py-2 px-4 bg-sunset-50 rounded-xl"
          >
            <MousePointer className="w-4 h-4 text-sunset-500" />
            <span className="text-sunset-600 text-sm font-medium">
              {hasInteractedWithMarker ? 'Great job!' : 'Tap any marker on the map'}
            </span>
          </motion.div>

          {/* Continue button - fallback if no markers available */}
          <button
            onClick={advanceToNextStep}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px] font-medium text-sm"
          >
            <span>Continue to next step</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Marker legend */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="fixed top-40 right-4 z-60 hidden md:block pointer-events-auto"
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200/50 p-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Marker Legend
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-pink-400" />
              <span className="text-slate-600">Toddler-friendly</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-slate-600">Attractions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-slate-600">Restaurants</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-slate-600">Temples</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Animated arrows pointing to map markers */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed inset-0 z-50 pointer-events-none"
      >
        {/* Pulsing indicators - positioned generically since we don't have exact marker refs */}
        {[
          { top: '35%', left: '30%' },
          { top: '45%', left: '60%' },
          { top: '55%', left: '45%' },
        ].map((pos, i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.3, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            className="absolute w-8 h-8"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="w-full h-full rounded-full border-2 border-sunset-400" />
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}
