import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAtom } from 'jotai';
import { showSkipConfirmAtom } from '@/atoms/onboardingAtoms';

/**
 * Always-visible skip button for the onboarding experience.
 * Shows skip confirmation dialog when clicked.
 */
export function SkipButton() {
  const [, setShowSkipConfirm] = useAtom(showSkipConfirmAtom);

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      onClick={() => setShowSkipConfirm(true)}
      className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-60 flex items-center gap-2 px-3 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/80 hover:bg-white/30 hover:text-white transition-all min-h-[44px] text-sm font-medium"
      aria-label="Skip tour"
    >
      <X className="w-4 h-4" />
      <span className="hidden sm:inline">Skip Tour</span>
    </motion.button>
  );
}
