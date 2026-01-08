import { motion } from 'framer-motion';
import { useAtom, useSetAtom } from 'jotai';
import { Sparkles, MessageCircle, Send, ArrowRight } from 'lucide-react';

import { hasInteractedWithChatAtom, advanceToNextStepAtom, FALLBACK_MESSAGES, STEP_CONFIGS } from '@/atoms/onboardingAtoms';

import { SpotlightOverlay } from '../SpotlightOverlay';

/**
 * Step 4: AI Companion
 * Introduces the Claude AI chat widget and asks user to send a message.
 * Advances automatically when user sends any message.
 */
export function AICompanionStep() {
  const [hasInteractedWithChat] = useAtom(hasInteractedWithChatAtom);
  const advanceToNextStep = useSetAtom(advanceToNextStepAtom);

  // Get current step number for display
  const stepNumber = STEP_CONFIGS.findIndex(c => c.step === 'chat') + 1;

  return (
    <>
      {/* Lighter overlay */}
      <SpotlightOverlay opacity={0.4} capturePointer={false} />

      {/* Instruction card - positioned to not block chat widget */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-1/2 left-4 md:left-8 -translate-y-1/2 z-60 w-[85%] max-w-sm pointer-events-auto"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 p-4">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-sunset-400 to-purple-500 text-white text-sm font-bold">
              {stepNumber}
            </span>
            <span className="text-xs text-slate-400 font-medium">Step {stepNumber} of 5</span>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sunset-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-slate-900 mb-1">
                Meet Your AI Companion
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {FALLBACK_MESSAGES.chat}
              </p>
            </div>
          </div>

          {/* Suggested questions */}
          <div className="mt-4 space-y-2">
            <p className="text-xs text-slate-500 font-medium">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'What should we do if it rains?',
                'Best places for toddlers?',
                'Where to eat laksa?',
              ].map((question, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-xs px-3 py-1.5 bg-slate-100 rounded-full text-slate-600"
                >
                  {question}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Interaction prompt */}
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center justify-center gap-2 mt-4 py-2 px-4 bg-sunset-50 rounded-xl"
          >
            <Send className="w-4 h-4 text-sunset-500" />
            <span className="text-sunset-600 text-sm font-medium">
              {hasInteractedWithChat ? 'Nice! You\'re connected!' : 'Send a message in the chat'}
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

      {/* Arrow pointing to chat widget */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="fixed bottom-24 right-24 z-60 hidden md:block"
      >
        <motion.div
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="flex items-center gap-2"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-sunset-500" />
              <span className="text-sm font-medium text-slate-700">
                Chat with me here!
              </span>
            </div>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-sunset-500">
            <path
              d="M5 12H19M19 12L12 5M19 12L12 19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </motion.div>
    </>
  );
}
