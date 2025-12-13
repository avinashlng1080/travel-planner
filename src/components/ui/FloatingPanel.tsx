import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, Minus, Maximize2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface FloatingPanelProps {
  id: string;
  title: string;
  icon: LucideIcon;
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  onClose: () => void;
  onMinimize: () => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onFocus: () => void;
  children: React.ReactNode;
}

export function FloatingPanel({
  id,
  title,
  icon: Icon,
  isOpen,
  isMinimized,
  position,
  size,
  zIndex,
  onClose,
  onMinimize,
  onPositionChange,
  onFocus,
  children,
}: FloatingPanelProps) {
  const dragControls = useDragControls();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate drag constraints to keep panel within viewport
  const panelHeight = isMinimized ? 56 : size.height;
  const dragConstraints = {
    top: -position.y,
    left: -position.x,
    right: windowSize.width - position.x - size.width,
    bottom: windowSize.height - position.y - panelHeight,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed"
          style={{
            left: position.x,
            top: position.y,
            width: size.width,
            zIndex,
          }}
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={dragConstraints}
          onDragEnd={(event, info) => {
            const newX = position.x + info.offset.x;
            const newY = position.y + info.offset.y;

            // Ensure panel stays within viewport bounds
            const boundedX = Math.max(0, Math.min(newX, windowSize.width - size.width));
            const boundedY = Math.max(0, Math.min(newY, windowSize.height - panelHeight));

            onPositionChange({ x: boundedX, y: boundedY });
          }}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            height: panelHeight,
          }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onFocus}
        >
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col">
            {/* Draggable Header - triggers drag on parent */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-b border-slate-200/50 cursor-move select-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex items-center gap-3 pointer-events-none">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/30">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                  <p className="text-[10px] text-slate-600">Drag to move</p>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-1 pointer-events-auto">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMinimize();
                  }}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title={isMinimized ? 'Maximize' : 'Minimize'}
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minus className="w-4 h-4" />
                  )}
                </motion.button>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Content Area */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  className="flex-1 overflow-hidden"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="h-full overflow-auto">
                    {children}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
