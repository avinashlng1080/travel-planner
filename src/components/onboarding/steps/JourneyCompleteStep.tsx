import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, BookOpen, Sparkles, PartyPopper } from 'lucide-react';
import { useOnboardingStore, STEP_CONFIGS, FALLBACK_MESSAGES } from '@/stores/onboardingStore';
import { PassportStamp } from '../PassportStamp';

/**
 * Step 6: Journey Complete
 * Celebrates the user completing the onboarding with a stamp collection reveal.
 * Shows final message from Claude and dismisses the onboarding.
 */
export function JourneyCompleteStep() {
  const { stamps, completeOnboarding } = useOnboardingStore();
  const [showConfetti, setShowConfetti] = useState(true);
  const [phase, setPhase] = useState<'stamps' | 'message' | 'done'>('stamps');

  // Progress through celebration phases
  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('message'), 2000);
    const timer2 = setTimeout(() => setShowConfetti(false), 3000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleDismiss = () => {
    setPhase('done');
    setTimeout(() => {
      completeOnboarding();
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 flex items-center justify-center bg-gradient-to-b from-slate-900/90 via-slate-800/90 to-ocean-900/90 backdrop-blur-sm"
    >
      {/* Confetti particles */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 1,
                  y: -20,
                  x: Math.random() * window.innerWidth,
                  rotate: 0,
                }}
                animate={{
                  opacity: 0,
                  y: window.innerHeight + 100,
                  rotate: Math.random() * 720 - 360,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: 'easeOut',
                }}
                className="absolute"
                style={{
                  width: 8 + Math.random() * 8,
                  height: 8 + Math.random() * 8,
                  backgroundColor: ['#f97316', '#14b8a6', '#fbbf24', '#ec4899', '#8b5cf6'][
                    Math.floor(Math.random() * 5)
                  ],
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 300 }}
        className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 p-6 md:p-8 max-w-md mx-4"
      >
        {/* Celebration icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, type: 'spring', delay: 0.2 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sunset-400 to-ocean-500 flex items-center justify-center shadow-lg shadow-sunset-500/30">
            <PartyPopper className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        {/* Content */}
        <div className="mt-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-display font-bold text-slate-900 mb-2"
          >
            You're All Set!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-600 text-sm mb-6"
          >
            Your travel passport is ready for adventure
          </motion.p>

          {/* Passport stamps reveal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-50 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-sunset-500" />
              <span className="font-semibold text-slate-700">Your Stamps</span>
            </div>
            <div className="flex justify-center gap-3">
              {STEP_CONFIGS.filter((c) => c.step !== 'complete').map((config, i) => {
                const stamp = stamps.find((s) => s.step === config.step);
                return (
                  <motion.div
                    key={config.step}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                  >
                    <PassportStamp
                      stamp={stamp}
                      placeholder={{ icon: config.stampIcon, name: config.stampName }}
                      size="sm"
                    />
                  </motion.div>
                );
              })}
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-sm text-ocean-600 font-medium mt-3"
            >
              <Check className="w-4 h-4 inline mr-1" />
              {stamps.length} of 5 stamps collected!
            </motion.p>
          </motion.div>

          {/* Claude's final message */}
          <AnimatePresence>
            {phase !== 'stamps' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="flex items-start gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sunset-400 to-ocean-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-100 rounded-xl rounded-tl-none p-3 flex-1">
                    <p className="text-slate-700 text-sm">
                      {FALLBACK_MESSAGES.complete}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dismiss button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            onClick={handleDismiss}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-sunset-500 to-ocean-500 text-white font-semibold hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center gap-2"
          >
            <span>Start Exploring</span>
            <Sparkles className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
