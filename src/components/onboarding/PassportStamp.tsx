import { motion } from 'framer-motion';
import { Plane, Home, Compass, Sparkles, Route, Check } from 'lucide-react';
import type { PassportStamp as StampType } from '@/atoms/onboardingAtoms';

interface PassportStampProps {
  stamp?: StampType;
  /** If no stamp, show placeholder with this config */
  placeholder?: {
    icon: string;
    name: string;
  };
  /** Whether this stamp was just earned (triggers animation) */
  justEarned?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  plane: Plane,
  home: Home,
  compass: Compass,
  sparkles: Sparkles,
  route: Route,
  check: Check,
};

/**
 * Individual passport stamp with earn animation.
 * Shows as greyed placeholder until earned.
 */
export function PassportStamp({ stamp, placeholder, justEarned = false, size = 'md' }: PassportStampProps) {
  const isEarned = !!stamp;
  const icon = stamp?.icon || placeholder?.icon || 'check';
  const name = stamp?.name || placeholder?.name || '';
  const Icon = iconMap[icon] || Check;

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-18 h-18',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <motion.div
      initial={justEarned ? { scale: 0, rotate: -180 } : { scale: 1 }}
      animate={justEarned ? { scale: [0, 1.3, 1], rotate: [180, 0] } : { scale: 1 }}
      transition={justEarned ? { type: 'spring', stiffness: 400, damping: 15, duration: 0.6 } : { duration: 0 }}
      className="flex flex-col items-center gap-1"
    >
      <div
        className={`
          ${sizeClasses[size]} rounded-full flex items-center justify-center
          transition-all duration-300
          ${isEarned
            ? 'bg-gradient-to-br from-sunset-400 to-ocean-500 shadow-lg shadow-sunset-500/30'
            : 'bg-slate-200/50 border-2 border-dashed border-slate-300'
          }
        `}
      >
        <Icon
          className={`
            ${iconSizes[size]} transition-all duration-300
            ${isEarned ? 'text-white' : 'text-slate-400'}
          `}
        />
      </div>
      {size !== 'sm' && (
        <span
          className={`
            text-xs font-medium transition-colors duration-300 text-center
            ${isEarned ? 'text-slate-700' : 'text-slate-400'}
          `}
        >
          {name}
        </span>
      )}

      {/* Sparkle effect when just earned */}
      {justEarned && (
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 2 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 pointer-events-none"
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 1, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                x: Math.cos((i * 60 * Math.PI) / 180) * 30,
                y: Math.sin((i * 60 * Math.PI) / 180) * 30,
              }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-sand-400"
              style={{ marginLeft: -4, marginTop: -4 }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
