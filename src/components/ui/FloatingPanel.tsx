import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, Minus, Minimize2, Square } from 'lucide-react';
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
  const [isMaximized, setIsMaximized] = useState(false);

  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate dimensions based on state
  const HEADER_HEIGHT = 56;
  const MAXIMIZED_PADDING = 20;
  const isMobile = windowSize.width < 768;
  const NAV_DOCK_WIDTH = isMobile ? 0 : 56;

  // Maximized dimensions (accounting for nav dock and some padding)
  // On mobile: full-screen with no margins
  const maximizedDimensions = {
    x: isMobile ? 0 : NAV_DOCK_WIDTH + MAXIMIZED_PADDING,
    y: isMobile ? 0 : HEADER_HEIGHT + MAXIMIZED_PADDING,
    width: isMobile ? windowSize.width : windowSize.width - NAV_DOCK_WIDTH - (MAXIMIZED_PADDING * 2),
    height: isMobile ? windowSize.height : windowSize.height - HEADER_HEIGHT - (MAXIMIZED_PADDING * 2),
  };

  // Current dimensions based on state
  const currentX = isMaximized ? maximizedDimensions.x : position.x;
  const currentY = isMaximized ? maximizedDimensions.y : position.y;
  const currentWidth = isMaximized ? maximizedDimensions.width : size.width;
  const currentHeight = isMinimized ? HEADER_HEIGHT : (isMaximized ? maximizedDimensions.height : size.height);

  // Calculate drag constraints to keep panel within viewport
  const dragConstraints = isMaximized ? { top: 0, left: 0, right: 0, bottom: 0 } : {
    top: -position.y,
    left: -position.x,
    right: windowSize.width - position.x - size.width,
    bottom: windowSize.height - position.y - currentHeight,
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed"
          style={{
            zIndex: isMaximized ? zIndex + 100 : zIndex,
          }}
          drag={!isMaximized}
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={dragConstraints}
          onDragEnd={(_event, info) => {
            if (isMaximized) return;
            const newX = position.x + info.offset.x;
            const newY = position.y + info.offset.y;

            // Ensure panel stays within viewport bounds
            const boundedX = Math.max(0, Math.min(newX, windowSize.width - size.width));
            const boundedY = Math.max(0, Math.min(newY, windowSize.height - currentHeight));

            onPositionChange({ x: boundedX, y: boundedY });
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: currentX,
            y: currentY,
            width: currentWidth,
            height: currentHeight,
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onFocus}
        >
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col">
            {/* Draggable Header - triggers drag on parent */}
            <div
              className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r from-sunset-500/10 to-ocean-600/10 border-b border-slate-200/50 select-none ${isMaximized ? 'cursor-default' : 'cursor-move'}`}
              onPointerDown={(e) => !isMaximized && dragControls.start(e)}
              onDoubleClick={toggleMaximize}
            >
              <div className="flex items-center gap-3 pointer-events-none">
                <div className="w-8 h-8 bg-gradient-to-r from-sunset-500 to-ocean-600 rounded-lg flex items-center justify-center shadow-lg shadow-sunset-500/30">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                  <p className="text-[10px] text-slate-600">
                    {isMaximized ? 'Double-click to restore' : 'Drag to move • Double-click to maximize'}
                  </p>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-1 pointer-events-auto">
                {/* Minimize button */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isMaximized) setIsMaximized(false);
                    onMinimize();
                  }}
                  className="p-2.5 md:p-1.5 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title="Minimize"
                >
                  <Minus className="w-5 h-5 md:w-4 md:h-4" />
                </motion.button>

                {/* Maximize/Restore button */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMaximize();
                  }}
                  className="p-2.5 md:p-1.5 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title={isMaximized ? 'Restore' : 'Maximize'}
                >
                  {isMaximized ? (
                    <Minimize2 className="w-5 h-5 md:w-4 md:h-4" />
                  ) : (
                    <Square className="w-5 h-5 md:w-4 md:h-4" />
                  )}
                </motion.button>

                {/* Close button */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-2.5 md:p-1.5 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title="Close"
                >
                  <X className="w-5 h-5 md:w-4 md:h-4" />
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
