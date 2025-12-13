import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassPanelProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  className?: string;
  blur?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  opacity?: number;
}

export function GlassPanel({
  children,
  className = '',
  blur = 'xl',
  opacity = 80,
  ...motionProps
}: GlassPanelProps) {
  const blurClass = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
    '2xl': 'backdrop-blur-2xl',
  }[blur];

  return (
    <motion.div
      className={`
        bg-slate-900/${opacity}
        ${blurClass}
        border border-slate-700/50
        shadow-2xl shadow-black/50
        rounded-2xl
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}

export function GlassCard({
  children,
  className = '',
  onClick,
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}) {
  return (
    <motion.div
      className={`
        bg-slate-800/60
        backdrop-blur-lg
        border border-slate-700/50
        rounded-xl
        ${hover ? 'hover:bg-slate-700/60 hover:border-slate-600/50 cursor-pointer' : ''}
        transition-colors duration-200
        ${className}
      `}
      onClick={onClick}
      whileHover={hover ? { scale: 1.02 } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
    >
      {children}
    </motion.div>
  );
}

export function GlassButton({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
}) {
  const variantClasses = {
    default: 'bg-slate-700/80 hover:bg-slate-600/80 text-white',
    primary: 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <motion.button
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        backdrop-blur-lg
        border border-white/10
        rounded-xl
        font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
    >
      {children}
    </motion.button>
  );
}

export function GlassInput({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      className={`
        w-full
        bg-slate-800/60
        backdrop-blur-lg
        border border-slate-700/50
        rounded-xl
        px-4 py-2
        text-white
        placeholder-slate-400
        focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50
        transition-all duration-200
        ${className}
      `}
      {...props}
    />
  );
}

export function GlassBadge({
  children,
  color = 'slate',
  className = '',
}: {
  children: ReactNode;
  color?: 'slate' | 'pink' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'cyan';
  className?: string;
}) {
  const colorClasses = {
    slate: 'bg-slate-700/60 text-slate-300',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };

  return (
    <span
      className={`
        inline-flex items-center
        px-2 py-0.5
        text-xs font-medium
        rounded-full
        border
        ${colorClasses[color]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
