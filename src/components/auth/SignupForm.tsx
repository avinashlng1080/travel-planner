import { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { GlassButton, GlassInput } from '../ui/GlassPanel';

interface SignupFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('already exists') || message.includes('duplicate')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (message.includes('invalid email')) {
      return 'Please enter a valid email address.';
    }
    if (message.includes('password') && message.includes('weak')) {
      return 'Password is too weak. Please use a stronger password.';
    }
    return error.message;
  }
  return 'Failed to create account. Please try again.';
}

export function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);

    try {
      await signIn('password', { email, password, flow: 'signUp' });
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-1">
          Email
        </label>
        <GlassInput
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-1">
          Password
        </label>
        <GlassInput
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
          autoComplete="new-password"
        />
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
          Confirm Password
        </label>
        <GlassInput
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          required
          autoComplete="new-password"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <GlassButton
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </GlassButton>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-pink-600 hover:text-pink-700 font-medium"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
