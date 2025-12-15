import { motion, useReducedMotion } from 'framer-motion';
import { Plane } from 'lucide-react';

interface FlightPathAnimationProps {
  /** Called when the animation completes */
  onComplete?: () => void;
  /** Duration of the flight animation in seconds */
  duration?: number;
}

/**
 * Animated flight path that traces from top of screen to a destination.
 * The airplane follows a curved SVG path with a trailing dashed line.
 */
export function FlightPathAnimation({ onComplete, duration = 3 }: FlightPathAnimationProps) {
  const prefersReducedMotion = useReducedMotion();

  // Simplified animation for reduced motion preference
  if (prefersReducedMotion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        onAnimationComplete={onComplete}
        className="fixed inset-0 flex items-center justify-center z-60 pointer-events-none"
      >
        <div className="flex flex-col items-center gap-4">
          <Plane className="w-16 h-16 text-sunset-500" />
          <p className="text-white text-lg font-display">Arriving in Malaysia...</p>
        </div>
      </motion.div>
    );
  }

  // Flight path coordinates - curved path from top to center-bottom
  const pathD = `
    M 50 -10
    C 50 20, 30 40, 50 60
    S 70 80, 50 90
  `;

  return (
    <div className="fixed inset-0 z-60 pointer-events-none overflow-hidden">
      {/* Background fade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-ocean-900"
      />

      {/* Stars/particles background */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 2,
              delay: Math.random() * 2,
              repeat: Infinity,
              repeatDelay: Math.random() * 3,
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
            }}
          />
        ))}
      </div>

      {/* SVG flight path */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          {/* Gradient for the path */}
          <linearGradient id="flightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0" />
            <stop offset="30%" stopColor="#f97316" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#14b8a6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="1" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Dashed trail path - animated stroke */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="url(#flightGradient)"
          strokeWidth="0.5"
          strokeDasharray="2 2"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: duration * 0.9, ease: 'easeInOut' }}
        />
      </svg>

      {/* Airplane icon following the path */}
      <motion.div
        initial={{
          top: '-5%',
          left: '50%',
          rotate: 135,
          scale: 0.5,
          opacity: 0,
        }}
        animate={{
          top: ['−5%', '30%', '60%', '85%'],
          left: ['50%', '35%', '65%', '50%'],
          rotate: [135, 150, 120, 180],
          scale: [0.5, 1, 1, 0.8],
          opacity: [0, 1, 1, 1],
        }}
        transition={{
          duration,
          ease: 'easeInOut',
          times: [0, 0.3, 0.7, 1],
        }}
        onAnimationComplete={onComplete}
        className="absolute -translate-x-1/2 -translate-y-1/2"
      >
        <div className="relative">
          {/* Glow behind plane */}
          <div className="absolute inset-0 blur-md bg-sunset-500/50 rounded-full scale-150" />
          <Plane className="w-12 h-12 md:w-16 md:h-16 text-white drop-shadow-lg relative z-10" />
        </div>
      </motion.div>

      {/* Landing destination indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: duration * 0.7 }}
        className="absolute bottom-[10%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        {/* Pulsing ring */}
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute w-8 h-8 rounded-full border-2 border-ocean-400"
        />
        <div className="w-4 h-4 rounded-full bg-ocean-500 shadow-glow-ocean" />
      </motion.div>

      {/* Text overlay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="absolute bottom-[25%] left-1/2 -translate-x-1/2 text-center"
      >
        <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
          Welcome to Malaysia
        </h2>
        <p className="text-ocean-200 text-sm md:text-base">
          Your family adventure begins...
        </p>
      </motion.div>
    </div>
  );
}
