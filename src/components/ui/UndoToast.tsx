import { motion, AnimatePresence } from 'framer-motion';
import { X, Undo2, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  undoAction?: () => Promise<void>;
  duration?: number;
}

interface UndoToastProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function UndoToast({ toasts, onDismiss }: UndoToastProps) {
  return (
    <div className="fixed bottom-24 md:bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isUndoing, setIsUndoing] = useState(false);
  const [progress, setProgress] = useState(100);

  const duration = toast.duration || 5000;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - 100 / (duration / 100);
        if (newProgress <= 0) {
          clearInterval(interval);
          onDismiss(toast.id);
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => { clearInterval(interval); };
  }, [duration, toast.id, onDismiss]);

  const handleUndo = async () => {
    if (!toast.undoAction || isUndoing) {return;}

    setIsUndoing(true);
    try {
      await toast.undoAction();
      onDismiss(toast.id);
    } catch (error) {
      console.error('Undo failed:', error);
      setIsUndoing(false);
    }
  };

  const bgColor =
    toast.type === 'error'
      ? 'bg-red-500/95'
      : toast.type === 'success'
        ? 'bg-ocean-600/95'
        : 'bg-slate-700/95';

  const Icon = toast.type === 'error' ? AlertCircle : toast.type === 'success' ? Sparkles : Check;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`
        pointer-events-auto
        ${bgColor} backdrop-blur-xl
        text-white rounded-xl shadow-2xl
        min-w-[300px] max-w-[400px]
        overflow-hidden
      `}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        <div
          className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${toast.type === 'error' ? 'bg-red-400/30' : 'bg-sunset-500/30'}
        `}
        >
          <Icon className="w-4 h-4" />
        </div>

        <span className="flex-1 text-sm font-medium">{toast.message}</span>

        <div className="flex items-center gap-1">
          {toast.undoAction && (
            <button
              onClick={handleUndo}
              disabled={isUndoing}
              className="
                flex items-center gap-1.5 px-3
                text-sm font-medium text-white
                bg-sunset-500/40 hover:bg-sunset-500/60
                rounded-lg transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                min-h-[44px] min-w-[44px]
              "
            >
              <Undo2 className="w-4 h-4" />
              <span className="whitespace-nowrap">{isUndoing ? 'Undoing...' : 'Undo'}</span>
            </button>
          )}

          <button
            onClick={() => { onDismiss(toast.id); }}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <motion.div
          className="h-full bg-sunset-500/60"
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </motion.div>
  );
}

// Hook for managing toasts
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return { toasts, addToast, dismissToast, clearToasts };
}
