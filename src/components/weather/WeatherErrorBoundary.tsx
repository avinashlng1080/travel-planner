import { AlertTriangle } from 'lucide-react';
import React, { Component, type ReactNode } from 'react';

import { GlassCard } from '../ui/GlassPanel';

interface Props {
  children: ReactNode;
  fallback?: 'inline' | 'card';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for weather components
 * Prevents weather errors from crashing the entire app
 */
export class WeatherErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Weather component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const fallbackType = this.props.fallback || 'inline';
      return fallbackType === 'card'
        ? <WeatherErrorFallbackCard error={this.state.error} />
        : <WeatherErrorFallbackInline error={this.state.error} />;
    }

    return this.props.children;
  }
}

/**
 * Inline error fallback for badges and compact components
 */
export function WeatherErrorFallbackInline({ error }: { error: Error | null }) {
  return (
    <div
      role="alert"
      className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-2.5 py-1 text-xs"
    >
      <AlertTriangle size={12} className="text-red-500" aria-label="Error" />
      <span className="text-red-700">Weather unavailable</span>
    </div>
  );
}

/**
 * Card error fallback for detailed weather displays
 */
export function WeatherErrorFallbackCard({ error }: { error: Error | null }) {
  return (
    <GlassCard hover={false} className="p-4">
      <div role="alert" className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <AlertTriangle size={20} className="text-red-500" aria-label="Error" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-1">
            Weather Data Unavailable
          </h3>
          <p className="text-sm text-red-700 mb-2">
            Unable to load weather information. Please try again later.
          </p>
          {error && process.env.NODE_ENV === 'development' && (
            <details className="text-xs text-red-600">
              <summary className="cursor-pointer hover:underline">
                Error details (dev only)
              </summary>
              <pre className="mt-2 p-2 bg-red-100 rounded overflow-x-auto">
                {error.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
