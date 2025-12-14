import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Animated Logo */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30"
        >
          <MapPin className="w-8 h-8 text-white" />
        </motion.div>

        {/* Loading Text */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900">TripPlanner</h2>
          <p className="text-sm text-slate-500 mt-1">Loading your trip...</p>
        </div>

        {/* Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="w-6 h-6 border-2 border-slate-200 border-t-pink-500 rounded-full"
        />
      </motion.div>
    </div>
  );
}
