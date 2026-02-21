import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { GlassPanel } from '../ui/GlassPanel';

export interface DeleteDestinationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  destinationName: string;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  error?: string | null;
}

export default function DeleteDestinationDialog({
  isOpen,
  onClose,
  destinationName,
  onConfirm,
  isDeleting,
  error,
}: DeleteDestinationDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap: focus cancel button when dialog opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 100);
      return () => { clearTimeout(timer); };
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => { document.removeEventListener('keydown', handleEscape); };
  }, [isOpen, isDeleting, onClose]);

  const handleConfirm = async () => {
    // Parent component handles success/error state and closing
    await onConfirm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
            onClick={isDeleting ? undefined : onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-destination-title"
            aria-describedby="delete-destination-description"
          >
            <GlassPanel
              className="w-full max-w-md p-6 relative"
              initial={false}
              animate={false}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Warning Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" aria-hidden="true" />
                </div>
              </div>

              {/* Title */}
              <h2
                id="delete-destination-title"
                className="text-xl font-semibold text-slate-900 text-center mb-3"
              >
                Delete Destination?
              </h2>

              {/* Description */}
              <p
                id="delete-destination-description"
                className="text-sm text-slate-600 text-center mb-4"
              >
                Are you sure you want to delete{' '}
                <span className="font-semibold text-slate-900">"{destinationName}"</span>?
                This action cannot be undone.
              </p>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {/* Cancel Button */}
                <button
                  ref={cancelButtonRef}
                  onClick={onClose}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  aria-label="Cancel deletion"
                >
                  Cancel
                </button>

                {/* Delete Button */}
                <button
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  aria-label={isDeleting ? 'Deleting destination' : 'Confirm deletion'}
                >
                  {isDeleting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                        aria-hidden="true"
                      />
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </GlassPanel>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
