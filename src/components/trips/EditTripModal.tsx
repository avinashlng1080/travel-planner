import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { GlassPanel, GlassInput } from '../ui/GlassPanel';
import type { Id } from '../../../convex/_generated/dataModel';

export interface EditTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: {
    _id: Id<'trips'>;
    name: string;
    description?: string;
    destination?: string;
    travelerInfo?: string;
    startDate: string;
    endDate: string;
    homeBase?: {
      name: string;
      lat: number;
      lng: number;
      city?: string;
    };
  };
  onSuccess: () => void;
}

interface FormData {
  tripName: string;
  description: string;
  destination: string;
  travelerInfo: string;
  startDate: string;
  endDate: string;
  homeBaseName: string;
  homeBaseLat: string;
  homeBaseLng: string;
}

interface FormErrors {
  tripName?: string;
  startDate?: string;
  endDate?: string;
  homeBaseLat?: string;
  homeBaseLng?: string;
}

export function EditTripModal({ isOpen, onClose, trip, onSuccess }: EditTripModalProps) {
  const [formData, setFormData] = useState<FormData>({
    tripName: '',
    description: '',
    destination: '',
    travelerInfo: '',
    startDate: '',
    endDate: '',
    homeBaseName: '',
    homeBaseLat: '',
    homeBaseLng: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHomeBase, setShowHomeBase] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Convex mutation
  const updateTrip = useMutation(api.trips.updateTrip);

  // Pre-populate form when trip data changes
  useEffect(() => {
    if (trip) {
      setFormData({
        tripName: trip.name || '',
        description: trip.description || '',
        destination: trip.destination || '',
        travelerInfo: trip.travelerInfo || '',
        startDate: trip.startDate || '',
        endDate: trip.endDate || '',
        homeBaseName: trip.homeBase?.name || '',
        homeBaseLat: trip.homeBase?.lat?.toString() || '',
        homeBaseLng: trip.homeBase?.lng?.toString() || '',
      });
      setShowHomeBase(!!trip.homeBase);
    }
  }, [trip]);

  // Focus trap: focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setTimeout(() => {
        setErrors({});
      }, 200);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required: Trip Name
    if (!formData.tripName.trim()) {
      newErrors.tripName = 'Trip name is required';
    }

    // Required: Start Date
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    // Required: End Date
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    // Validation: End date must be after start date
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    // Home base validation (if section is expanded)
    if (showHomeBase) {
      if (formData.homeBaseLat && !isValidLatitude(formData.homeBaseLat)) {
        newErrors.homeBaseLat = 'Latitude must be between -90 and 90';
      }
      if (formData.homeBaseLng && !isValidLongitude(formData.homeBaseLng)) {
        newErrors.homeBaseLng = 'Longitude must be between -180 and 180';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare homeBase data if provided
      const homeBase =
        showHomeBase && formData.homeBaseName && formData.homeBaseLat && formData.homeBaseLng
          ? {
              name: formData.homeBaseName,
              lat: parseFloat(formData.homeBaseLat),
              lng: parseFloat(formData.homeBaseLng),
              city: '',
            }
          : undefined;

      // Call Convex mutation
      await updateTrip({
        tripId: trip._id,
        name: formData.tripName,
        description: formData.description || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        homeBase,
      });

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Failed to update trip:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
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
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-trip-title"
          >
            <GlassPanel
              className="w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto"
              initial={false}
              animate={false}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Close modal"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h2 id="edit-trip-title" className="text-xl font-semibold text-slate-900">
                  Edit Trip
                </h2>
                <p className="text-sm text-slate-600 mt-1">Update your trip details</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Trip Name */}
                <div>
                  <label
                    htmlFor="tripName"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Trip Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="tripName"
                    ref={firstInputRef}
                    type="text"
                    placeholder="Malaysia Family Adventure"
                    value={formData.tripName}
                    onChange={(e) => handleChange('tripName', e.target.value)}
                    className={`w-full bg-white backdrop-blur-lg border rounded-xl px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sunset-500/50 focus:border-sunset-500/50 transition-all duration-200 disabled:opacity-50 ${errors.tripName ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-200'}`}
                    disabled={isSubmitting}
                  />
                  {errors.tripName && (
                    <p className="mt-1 text-xs text-red-600">{errors.tripName}</p>
                  )}
                </div>

                {/* Destination */}
                <div>
                  <label
                    htmlFor="destination"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Destination
                  </label>
                  <GlassInput
                    id="destination"
                    type="text"
                    placeholder="Tokyo, Japan"
                    value={formData.destination}
                    onChange={(e) => handleChange('destination', e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    AI will use this to suggest places to visit
                  </p>
                </div>

                {/* Who's Traveling */}
                <div>
                  <label
                    htmlFor="travelerInfo"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Who's Traveling?
                  </label>
                  <GlassInput
                    id="travelerInfo"
                    type="text"
                    placeholder="2 adults, 1 toddler (2yo)"
                    value={formData.travelerInfo}
                    onChange={(e) => handleChange('travelerInfo', e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    AI will tailor suggestions for your group
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={2}
                    placeholder="A magical trip with the little ones..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-white backdrop-blur-lg border border-slate-200 rounded-xl px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sunset-500/50 focus:border-sunset-500/50 transition-all duration-200 resize-none disabled:opacity-50"
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <GlassInput
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                      className={
                        errors.startDate
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : ''
                      }
                      disabled={isSubmitting}
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
                    )}
                  </div>

                  {/* End Date */}
                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <GlassInput
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleChange('endDate', e.target.value)}
                      className={
                        errors.endDate
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : ''
                      }
                      disabled={isSubmitting}
                    />
                    {errors.endDate && (
                      <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
                    )}
                  </div>
                </div>

                {/* Home Base Section (Collapsible) */}
                <div className="border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowHomeBase(!showHomeBase)}
                    className="flex items-center justify-between w-full text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                    disabled={isSubmitting}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>Home Base (Optional)</span>
                    </div>
                    {showHomeBase ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showHomeBase && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 mt-4">
                          {/* Home Base Name */}
                          <div>
                            <label
                              htmlFor="homeBaseName"
                              className="block text-sm font-medium text-slate-700 mb-1.5"
                            >
                              Name
                            </label>
                            <GlassInput
                              id="homeBaseName"
                              type="text"
                              placeholder="Hotel Grand Pacific"
                              value={formData.homeBaseName}
                              onChange={(e) => handleChange('homeBaseName', e.target.value)}
                              disabled={isSubmitting}
                            />
                          </div>

                          {/* Coordinates */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Latitude */}
                            <div>
                              <label
                                htmlFor="homeBaseLat"
                                className="block text-sm font-medium text-slate-700 mb-1.5"
                              >
                                Latitude
                              </label>
                              <GlassInput
                                id="homeBaseLat"
                                type="text"
                                placeholder="3.1390"
                                value={formData.homeBaseLat}
                                onChange={(e) => handleChange('homeBaseLat', e.target.value)}
                                className={
                                  errors.homeBaseLat
                                    ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                                    : ''
                                }
                                disabled={isSubmitting}
                              />
                              {errors.homeBaseLat && (
                                <p className="mt-1 text-xs text-red-600">{errors.homeBaseLat}</p>
                              )}
                            </div>

                            {/* Longitude */}
                            <div>
                              <label
                                htmlFor="homeBaseLng"
                                className="block text-sm font-medium text-slate-700 mb-1.5"
                              >
                                Longitude
                              </label>
                              <GlassInput
                                id="homeBaseLng"
                                type="text"
                                placeholder="101.6869"
                                value={formData.homeBaseLng}
                                onChange={(e) => handleChange('homeBaseLng', e.target.value)}
                                className={
                                  errors.homeBaseLng
                                    ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                                    : ''
                                }
                                disabled={isSubmitting}
                              />
                              {errors.homeBaseLng && (
                                <p className="mt-1 text-xs text-red-600">{errors.homeBaseLng}</p>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-500">
                            Tip: You can add a map picker integration later
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-sunset-500 to-ocean-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[44px]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating Trip...</span>
                      </div>
                    ) : (
                      'Update Trip'
                    )}
                  </button>
                </div>
              </form>
            </GlassPanel>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper functions
function isValidLatitude(lat: string): boolean {
  const num = parseFloat(lat);
  return !isNaN(num) && num >= -90 && num <= 90;
}

function isValidLongitude(lng: string): boolean {
  const num = parseFloat(lng);
  return !isNaN(num) && num >= -180 && num <= 180;
}
