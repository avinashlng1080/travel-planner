import { motion } from 'framer-motion';

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Generate initials from a name (first letter of each word, max 2)
 */
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

/**
 * Generate a consistent gradient based on name hash
 */
const getAvatarGradient = (name: string): string => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    'from-pink-400 to-rose-400',
    'from-blue-400 to-indigo-400',
    'from-green-400 to-emerald-400',
    'from-purple-400 to-violet-400',
    'from-orange-400 to-amber-400',
  ];
  return gradients[hash % gradients.length];
};

/**
 * Avatar component with image support and gradient initials fallback
 */
export function Avatar({ name, imageUrl, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initials = getInitials(name);
  const gradient = getAvatarGradient(name);

  return (
    <motion.div
      className={`
        ${sizeClasses[size]}
        rounded-full
        flex items-center justify-center
        font-semibold
        text-white
        overflow-hidden
        border-2 border-white/50
        shadow-md
        ${className}
      `}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient}`}>
          {initials}
        </div>
      )}
    </motion.div>
  );
}
