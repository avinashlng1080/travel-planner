import { motion } from 'framer-motion';
import { useAtomValue, useSetAtom } from 'jotai';
import { Home, MessageCircle, ArrowRight, Compass } from 'lucide-react';
import { useState, useEffect } from 'react';

import { advanceToNextStepAtom, skipOnboardingAtom, getFallbackMessage, STEP_CONFIGS, tripDestinationAtom } from '@/atoms/onboardingAtoms';

import { SpotlightOverlay } from '../SpotlightOverlay';

/**
 * Step 2: Welcome Home
 * Claude welcomes the user and introduces the home base.
 * User can choose to continue the tour or explore on their own.
 */
export function WelcomeHomeStep() {
  const advanceToNextStep = useSetAtom(advanceToNextStepAtom);
  const skipOnboarding = useSetAtom(skipOnboardingAtom);
  const tripDestination = useAtomValue(tripDestinationAtom);

  // Get current step number for display
  const stepNumber = STEP_CONFIGS.findIndex(c => c.step === 'welcome') + 1;
  const [claudeMessage, setClaudeMessage] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Simulate Claude "typing" the welcome message
  useEffect(() => {
    const message = getFallbackMessage('welcome', tripDestination);
    let index = 0;
    setIsTyping(true);

    const typeInterval = setInterval(() => {
      if (index < message.length) {
        setClaudeMessage(message.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 25);

    return () => { clearInterval(typeInterval); };
  }, []);

  return (
    <>
      {/* Dim overlay */}
      <SpotlightOverlay opacity={0.5} capturePointer={false} />

      {/* Content card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="fixed inset-x-4 bottom-24 md:inset-x-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] z-60 pointer-events-auto"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden">
          {/* Header with home icon */}
          <div className="bg-gradient-to-r from-sunset-500 to-ocean-500 p-4">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white text-sm font-bold">
                {stepNumber}
              </span>
              <span className="text-xs text-white/70 font-medium">Step {stepNumber} of 5</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-lg">
                  Your Home Base
                </h3>
                <p className="text-white/80 text-sm">M Vertica Residence, Cheras</p>
              </div>
            </div>
          </div>

          {/* Claude message */}
          <div className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sunset-400 to-ocean-500 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 bg-slate-50 rounded-xl rounded-tl-none p-3">
                <p className="text-slate-700 text-sm leading-relaxed">
                  {claudeMessage}
                  {isTyping && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="inline-block w-2 h-4 bg-sunset-500 ml-1 align-middle"
                    />
                  )}
                </p>
              </div>
            </div>

            {/* Action buttons - only show after typing completes */}
            {!isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <button
                  onClick={advanceToNextStep}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-sunset-500 to-ocean-500 text-white font-semibold hover:opacity-90 transition-opacity min-h-[44px]"
                >
                  <Compass className="w-5 h-5" />
                  Show me around
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={skipOnboarding}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px] font-medium"
                >
                  I'll explore myself
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Hint about the map */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-60 text-center"
      >
        <p className="text-white/60 text-sm">
          Look at the map below - this is where your adventure begins
        </p>
      </motion.div>
    </>
  );
}
