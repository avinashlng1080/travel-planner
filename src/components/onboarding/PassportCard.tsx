import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useAtom } from 'jotai';
import { stampsAtom, isPassportExpandedAtom, STEP_CONFIGS } from '@/atoms/onboardingAtoms';
import { PassportStamp } from './PassportStamp';

/**
 * Floating passport card that collects stamps during onboarding.
 * Can be collapsed to a small badge or expanded to show all stamps.
 */
export function PassportCard() {
  const [stamps] = useAtom(stampsAtom);
  const [isPassportExpanded, setPassportExpanded] = useAtom(isPassportExpandedAtom);

  // Find which stamp was just earned (last stamp if it matches current step)
  const lastStamp = stamps[stamps.length - 1];
  const justEarnedStep = lastStamp?.step;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className={`
        fixed z-60 transition-all duration-300
        ${isPassportExpanded
          ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
          : 'top-4 right-4 md:top-6 md:right-6'
        }
      `}
    >
      <motion.div
        layout
        className={`
          bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl
          transition-all duration-300
          ${isPassportExpanded ? 'rounded-2xl p-6 w-80' : 'rounded-full'}
        `}
      >
        {/* Collapsed view - just badge */}
        {!isPassportExpanded && (
          <button
            onClick={() => setPassportExpanded(true)}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px]"
            aria-label={`Passport: ${stamps.length} stamps earned. Click to expand.`}
          >
            <BookOpen className="w-5 h-5 text-sunset-500" />
            <span className="font-display font-semibold text-slate-900">{stamps.length}</span>
            <span className="text-slate-500 text-sm">stamps</span>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>
        )}

        {/* Expanded view - full passport */}
        <AnimatePresence>
          {isPassportExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-sunset-500" />
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    Travel Passport
                  </h3>
                </div>
                <button
                  onClick={() => setPassportExpanded(false)}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Collapse passport"
                >
                  <ChevronUp className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Stamps grid */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {STEP_CONFIGS.filter(c => c.step !== 'complete').map((config) => {
                  const stamp = stamps.find((s) => s.step === config.step);
                  const isJustEarned = justEarnedStep === config.step;

                  return (
                    <PassportStamp
                      key={config.step}
                      stamp={stamp}
                      placeholder={{ icon: config.stampIcon, name: config.stampName }}
                      justEarned={isJustEarned}
                      size="md"
                    />
                  );
                })}
              </div>

              {/* Progress text */}
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  {stamps.length === 5 ? (
                    <span className="text-ocean-600 font-semibold">All stamps collected!</span>
                  ) : (
                    <>
                      <span className="font-semibold text-sunset-500">{stamps.length}</span>
                      {' of 5 stamps earned'}
                    </>
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Click outside to collapse */}
      {isPassportExpanded && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setPassportExpanded(false)}
        />
      )}
    </motion.div>
  );
}
