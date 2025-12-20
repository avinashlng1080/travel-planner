import { motion } from 'framer-motion';
import { useEffect, useState, type RefObject } from 'react';

interface SpotlightTarget {
  /** Ref to the element to highlight */
  ref?: RefObject<HTMLElement>;
  /** Or provide explicit coordinates */
  rect?: { x: number; y: number; width: number; height: number };
  /** Shape of the spotlight cutout */
  shape?: 'circle' | 'rect' | 'pill';
  /** Extra padding around the element */
  padding?: number;
}

interface SpotlightOverlayProps {
  /** Elements to spotlight (creates cutouts) */
  targets?: SpotlightTarget[];
  /** Background overlay opacity (0-1) */
  opacity?: number;
  /** Click outside handler */
  onClickOutside?: () => void;
  /** Children to render on top of the overlay */
  children?: React.ReactNode;
  /** Whether the overlay should capture pointer events */
  capturePointer?: boolean;
}

/**
 * Creates a semi-transparent overlay with animated cutouts
 * to highlight specific UI elements during onboarding.
 */
export function SpotlightOverlay({
  targets = [],
  opacity = 0.6,
  onClickOutside,
  children,
  capturePointer = true,
}: SpotlightOverlayProps) {
  const [cutouts, setCutouts] = useState<{ x: number; y: number; width: number; height: number; shape: string }[]>([]);

  // Calculate cutout positions from refs
  useEffect(() => {
    const calculateCutouts = () => {
      const newCutouts = targets.map((target) => {
        const padding = target.padding ?? 8;
        const shape = target.shape ?? 'rect';

        if (target.rect) {
          return {
            x: target.rect.x - padding,
            y: target.rect.y - padding,
            width: target.rect.width + padding * 2,
            height: target.rect.height + padding * 2,
            shape,
          };
        }

        if (target.ref?.current) {
          const rect = target.ref.current.getBoundingClientRect();
          return {
            x: rect.x - padding,
            y: rect.y - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
            shape,
          };
        }

        return null;
      }).filter(Boolean) as typeof cutouts;

      setCutouts(newCutouts);
    };

    calculateCutouts();

    // Recalculate on resize/scroll
    window.addEventListener('resize', calculateCutouts);
    window.addEventListener('scroll', calculateCutouts);

    return () => {
      window.removeEventListener('resize', calculateCutouts);
      window.removeEventListener('scroll', calculateCutouts);
    };
  }, [targets]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`fixed inset-0 ${capturePointer ? 'pointer-events-auto' : 'pointer-events-none'}`}
      onClick={onClickOutside}
      style={{ zIndex: 59 }}
    >
      {/* Dark overlay with cutouts */}
      <div
        className="absolute inset-0 bg-slate-900 transition-all duration-300"
        style={{
          opacity,
          // For simple single cutout, we use clip-path
          // For multiple cutouts, we'd need SVG mask (future enhancement)
          clipPath: cutouts.length > 0 ? `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${cutouts.map(c =>
            `${c.x}px ${c.y}px, ${c.x}px ${c.y + c.height}px, ${c.x + c.width}px ${c.y + c.height}px, ${c.x + c.width}px ${c.y}px, ${c.x}px ${c.y}px`
          ).join(', ')})` : undefined,
        }}
      />

      {/* Animated highlight rings around cutouts */}
      {cutouts.map((cutout, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="absolute pointer-events-none"
          style={{
            left: cutout.x - 4,
            top: cutout.y - 4,
            width: cutout.width + 8,
            height: cutout.height + 8,
            borderRadius: cutout.shape === 'circle' ? '50%' : cutout.shape === 'pill' ? cutout.height / 2 + 4 : 16,
            border: '2px solid rgba(249, 115, 22, 0.5)',
            boxShadow: '0 0 20px rgba(249, 115, 22, 0.3)',
          }}
        />
      ))}

      {/* Children (tooltips, etc.) */}
      {children}
    </motion.div>
  );
}
