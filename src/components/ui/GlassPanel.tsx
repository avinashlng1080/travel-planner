import { motion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode } from 'react';

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
        bg-white/${opacity}
        ${blurClass}
        border border-slate-200/50
        shadow-xl shadow-slate-200/50
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
        bg-white/80
        backdrop-blur-lg
        border border-slate-200/50
        rounded-xl
        ${hover ? 'hover:bg-slate-50 hover:border-slate-300/50 cursor-pointer' : ''}
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
  type = 'button',
}: {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) {
  const variantClasses = {
    default: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    primary:
      'bg-gradient-to-r from-sunset-500 to-ocean-600 hover:from-sunset-600 hover:to-ocean-700 text-white shadow-glow-sunset',
    success:
      'bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white',
    danger:
      'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[44px]',
    md: 'px-4 py-2 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[44px]',
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
      type={type}
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
        bg-white
        backdrop-blur-lg
        border border-slate-200
        rounded-xl
        px-4 py-3
        text-slate-900
        placeholder-slate-400
        focus:outline-none focus:ring-2 focus:ring-sunset-500/50 focus:border-sunset-500/50
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
  color?:
    | 'slate'
    | 'pink'
    | 'green'
    | 'blue'
    | 'amber'
    | 'red'
    | 'purple'
    | 'cyan'
    | 'sunset'
    | 'ocean';
  className?: string;
}) {
  const colorClasses = {
    slate: 'bg-slate-100 text-slate-600',
    pink: 'bg-pink-100 text-pink-700 border-pink-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    sunset: 'bg-sunset-100 text-sunset-700 border-sunset-200',
    ocean: 'bg-ocean-100 text-ocean-700 border-ocean-200',
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
