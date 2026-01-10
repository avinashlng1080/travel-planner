import { motion } from 'framer-motion';
import { MapPin, Plus } from 'lucide-react';
import { useState } from 'react';

interface AddPlaceFABProps {
  onClick: () => void;
  isActive?: boolean;
}

/**
 * Desktop Floating Action Button for adding places to the trip
 * Positioned at bottom-left (opposite from AI chat widget)
 * Hidden on mobile (md:hidden) - mobile uses FAB menu instead
 */
export function AddPlaceFAB({ onClick, isActive = false }: AddPlaceFABProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="hidden md:flex fixed z-50 items-center justify-center focus:outline-none focus:ring-2 focus:ring-sunset-500 focus:ring-offset-2 rounded-full"
      style={{
        bottom: 24,
        left: 24,
        boxShadow: isActive
          ? '0 0 0 4px rgba(249, 115, 22, 0.3), 0 8px 24px rgba(249, 115, 22, 0.4)'
          : '0 8px 24px rgba(249, 115, 22, 0.4)',
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      aria-label="Add place to trip"
    >
      {/* Main button */}
      <div
        className={`
          w-14 h-14 rounded-full flex items-center justify-center
          bg-gradient-to-br from-sunset-500 to-ocean-600
          text-white transition-all duration-200
          ${isActive ? 'ring-4 ring-sunset-300' : ''}
        `}
      >
        <div className="relative">
          <MapPin className="w-6 h-6" />
          <Plus className="w-3 h-3 absolute -top-1 -right-1 bg-white text-sunset-600 rounded-full" />
        </div>
      </div>

      {/* Tooltip - visible on hover AND focus */}
      <motion.div
        className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg whitespace-nowrap pointer-events-none"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
        transition={{ duration: 0.15 }}
      >
        Add Place
        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
      </motion.div>
    </motion.button>
  );
}
