import { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { GlassButton, GlassInput } from '../ui/GlassPanel';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToSignup: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('invalidsecret') || message.includes('invalid secret')) {
      return 'Incorrect password. Please try again.';
    }
    if (message.includes('could not find') || message.includes('not found')) {
      return 'No account found with this email. Please sign up first.';
    }
    if (message.includes('invalid email')) {
      return 'Please enter a valid email address.';
    }
    return error.message;
  }
  return 'Failed to sign in. Please check your credentials.';
}

export function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn('password', { email, password, flow: 'signIn' });
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
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
          Email
        </label>
        <GlassInput
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
          Password
        </label>
        <GlassInput
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          autoComplete="current-password"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <GlassButton variant="primary" size="lg" className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </GlassButton>

      <p className="text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-pink-600 hover:text-pink-700 font-medium"
        >
          Sign up
        </button>
      </p>
    </form>
  );
}
