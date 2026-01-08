import { useMutation, useQuery } from 'convex/react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

import { api } from '../../convex/_generated/api';
import { type Id } from '../../convex/_generated/dataModel';
import { GlassPanel, GlassButton } from '../components/ui/GlassPanel';

interface JoinTripPageProps {
  token: string;
  onSuccess: (tripId: Id<'trips'>) => void;
  onCancel: () => void;
}

export function JoinTripPage({ token, onSuccess, onCancel }: JoinTripPageProps) {
  const [status, setStatus] = useState<'joining' | 'success' | 'error'>('joining');
  const [errorMessage, setErrorMessage] = useState('');
  const [tripId, setTripId] = useState<Id<'trips'> | null>(null);
  const [tripName, setTripName] = useState<string>('');

  const joinViaLink = useMutation(api.tripMembers.joinViaLink);
  const trip = useQuery(api.trips.getTrip, tripId ? { tripId } : 'skip');

  useEffect(() => {
    // Auto-join on mount
    void joinTrip();
  }, [token]);

  useEffect(() => {
    // Get trip name after successful join
    if (status === 'success' && trip) {
      setTripName(trip.name);
    }
  }, [trip, status]);

  const joinTrip = async () => {
    try {
      const result = await joinViaLink({ token });
      setTripId(result.tripId);
      setStatus('success');
      // Auto-redirect after 2 seconds
      setTimeout(() => { onSuccess(result.tripId); }, 2000);
    } catch (error: any) {
      setStatus('error');

      // Parse error messages for better UX
      const errorMsg = error?.message || 'Failed to join trip';

      if (errorMsg.includes('Invalid invite link')) {
        setErrorMessage('This invite link is invalid or has been revoked.');
      } else if (errorMsg.includes('expired')) {
        setErrorMessage('This invite link has expired.');
      } else if (errorMsg.includes('already a member')) {
        setErrorMessage('You are already a member of this trip.');
      } else if (errorMsg.includes('maximum number of uses')) {
        setErrorMessage('This invite link has reached its maximum number of uses.');
      } else if (errorMsg.includes('Not authenticated')) {
        setErrorMessage('You must be signed in to join a trip.');
      } else {
        setErrorMessage(errorMsg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <GlassPanel className="w-full max-w-md p-8">
        {status === 'joining' && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Users className="w-16 h-16 text-ocean-500" />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-20 h-20 text-sunset-500/30" />
                </motion.div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Joining Trip...
            </h1>
            <p className="text-slate-600">
              Please wait while we add you to the trip.
            </p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.1
              }}
            >
              <div className="relative">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <motion.div
                  className="absolute inset-0 bg-green-500/20 rounded-full"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Welcome to the Trip!
            </h1>
            {tripName && (
              <p className="text-lg text-slate-700 font-medium mb-4">
                {tripName}
              </p>
            )}
            <p className="text-slate-600">
              You've successfully joined the trip. Redirecting...
            </p>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.1
              }}
            >
              <div className="relative">
                <XCircle className="w-16 h-16 text-red-500" />
                <motion.div
                  className="absolute inset-0 bg-red-500/20 rounded-full"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">
              Unable to Join Trip
            </h1>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-700">
                {errorMessage}
              </p>
            </div>
            <GlassButton
              variant="primary"
              size="lg"
              className="w-full"
              onClick={onCancel}
            >
              Go to Dashboard
            </GlassButton>
          </motion.div>
        )}
      </GlassPanel>
    </div>
  );
}
