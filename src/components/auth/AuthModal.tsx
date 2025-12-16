import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { useAtom } from 'jotai';
import { authModalOpenAtom, authModeAtom } from '../../atoms/uiAtoms';

export function AuthModal() {
  const [authModalOpen, setAuthModalOpen] = useAtom(authModalOpenAtom);
  const [authMode, setAuthMode] = useAtom(authModeAtom);

  const handleClose = () => {
    setAuthModalOpen(false);
  };

  const handleSuccess = () => {
    setAuthModalOpen(false);
  };

  const handleSwitchToSignup = () => {
    setAuthMode('signup');
  };

  const handleSwitchToLogin = () => {
    setAuthMode('login');
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
          >
            <GlassPanel
              className="w-full max-w-md p-6 relative"
              initial={false}
              animate={false}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {authMode === 'login' ? 'Welcome back' : 'Create an account'}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {authMode === 'login'
                    ? 'Sign in to access your trip plans'
                    : 'Start planning your perfect trip'}
                </p>
              </div>

              {/* Form */}
              {authMode === 'login' ? (
                <LoginForm
                  onSuccess={handleSuccess}
                  onSwitchToSignup={handleSwitchToSignup}
                />
              ) : (
                <SignupForm
                  onSuccess={handleSuccess}
                  onSwitchToLogin={handleSwitchToLogin}
                />
              )}
            </GlassPanel>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
