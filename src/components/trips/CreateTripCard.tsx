import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface CreateTripCardProps {
  onClick: () => void;
}

export function CreateTripCard({ onClick }: CreateTripCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className="group relative w-full h-full min-h-[320px] bg-white/60 backdrop-blur-lg border-2 border-dashed border-slate-300 hover:border-sunset-500 rounded-2xl transition-all duration-200 overflow-hidden"
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Create new trip"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-sunset-500/5 to-ocean-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6">
        {/* Icon Circle */}
        <motion.div
          className="w-16 h-16 bg-gradient-to-br from-sunset-500/10 to-ocean-600/10 group-hover:from-sunset-500/20 group-hover:to-ocean-600/20 border-2 border-sunset-500/30 group-hover:border-sunset-500 rounded-2xl flex items-center justify-center transition-all duration-200"
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.3 }}
        >
          <Plus className="w-8 h-8 text-sunset-600 group-hover:text-sunset-700 transition-colors" />
        </motion.div>

        {/* Text */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-sunset-700 transition-colors">
            Create New Trip
          </h3>
          <p className="mt-1 text-sm text-slate-600 group-hover:text-slate-700 transition-colors">
            Start planning your next adventure
          </p>
        </div>

        {/* Subtle hint */}
        <div className="mt-2 text-xs text-slate-400 group-hover:text-slate-500 transition-colors">
          Click to get started
        </div>
      </div>

      {/* Corner decoration */}
      <div className="absolute top-3 right-3 w-2 h-2 bg-sunset-500/20 group-hover:bg-sunset-500/40 rounded-full transition-colors" />
      <div className="absolute bottom-3 left-3 w-2 h-2 bg-ocean-600/20 group-hover:bg-ocean-600/40 rounded-full transition-colors" />
    </motion.button>
  );
}
