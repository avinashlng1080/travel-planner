/**
 * Google Maps Provider
 *
 * Wraps the application with Google Maps API context.
 * Uses @vis.gl/react-google-maps library.
 */

import { APIProvider } from '@vis.gl/react-google-maps';
import { type ReactNode } from 'react';

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  if (!apiKey) {
    console.error('[GoogleMapsProvider] Missing VITE_GOOGLE_MAPS_KEY environment variable');
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <div className="text-4xl mb-4">🗺️</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Google Maps API Key Required</h2>
          <p className="text-slate-600 text-sm">
            Please add <code className="bg-slate-100 px-2 py-1 rounded">VITE_GOOGLE_MAPS_KEY</code> to your{' '}
            <code className="bg-slate-100 px-2 py-1 rounded">.env.local</code> file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={apiKey}
      onLoad={() => {
        if (import.meta.env.DEV) {
          console.log('[GoogleMapsProvider] Maps API loaded successfully');
        }
      }}
    >
      {children}
    </APIProvider>
  );
}
