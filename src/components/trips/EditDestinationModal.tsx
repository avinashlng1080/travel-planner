import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, MapPin, Car, Bus, Bike, Footprints } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { GlassPanel, GlassInput } from '../ui/GlassPanel';
import { usePlacesAutocomplete } from '../../hooks/usePlacesAutocomplete';

export interface EditDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: Id<'trips'>;
  destination: {
    _id: Id<'commuteDestinations'>;
    name: string;
    address?: string;
    lat: number;
    lng: number;
    category?: string;
    travelMode: 'DRIVING' | 'TRANSIT' | 'BICYCLING' | 'WALKING';
  } | null;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
  category: string;
  travelMode: 'DRIVING' | 'TRANSIT' | 'BICYCLING' | 'WALKING';
}

interface FormErrors {
  name?: string;
  location?: string;
}

type TravelMode = 'DRIVING' | 'TRANSIT' | 'BICYCLING' | 'WALKING';

const TRAVEL_MODES: Array<{
  mode: TravelMode;
  icon: typeof Car;
  label: string;
  description: string;
}> = [
  {
    mode: 'DRIVING',
    icon: Car,
    label: 'Drive',
    description: 'By car or taxi',
  },
  {
    mode: 'TRANSIT',
    icon: Bus,
    label: 'Transit',
    description: 'Public transport',
  },
  {
    mode: 'BICYCLING',
    icon: Bike,
    label: 'Bike',
    description: 'Cycling route',
  },
  {
    mode: 'WALKING',
    icon: Footprints,
    label: 'Walk',
    description: 'On foot',
  },
];

export default function EditDestinationModal({
  isOpen,
  onClose,
  tripId: _tripId,
  destination,
  onSuccess,
}: EditDestinationModalProps) {
  // Note: _tripId is available for future use (e.g., access control validation)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    lat: 0,
    lng: 0,
    placeId: undefined,
    category: '',
    travelMode: 'DRIVING',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPredictions, setShowPredictions] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Convex mutation
  const updateDestination = useMutation(api.commuteDestinations.updateDestination);

  // Places Autocomplete
  const { predictions, isLoading, search, getPlaceDetails, clearPredictions } = usePlacesAutocomplete({
    componentRestrictions: { country: 'my' }, // Malaysia
  });

  // Pre-fill form data when destination changes
  useEffect(() => {
    if (destination) {
      setFormData({
        name: destination.name,
        address: destination.address || '',
        lat: destination.lat,
        lng: destination.lng,
        placeId: undefined,
        category: destination.category || '',
        travelMode: destination.travelMode,
      });
      setSearchQuery(destination.address || destination.name);
    }
  }, [destination]);

  // Focus trap: focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
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
      // Reset form after animation completes
      setTimeout(() => {
        setFormData({
          name: '',
          address: '',
          lat: 0,
          lng: 0,
          placeId: undefined,
          category: '',
          travelMode: 'DRIVING',
        });
        setErrors({});
        setSearchQuery('');
        setShowPredictions(false);
        clearPredictions();
      }, 200);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required: Name/Address
    if (!formData.name.trim() && !formData.address.trim()) {
      newErrors.name = 'Destination name or address is required';
    }

    // Required: Valid coordinates
    if (formData.lat === 0 && formData.lng === 0) {
      newErrors.location = 'Please select a location from the suggestions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!destination || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Only send changed fields
      const updates: {
        name?: string;
        address?: string;
        lat?: number;
        lng?: number;
        category?: string;
        travelMode?: TravelMode;
      } = {};

      if (formData.name !== destination.name) {
        updates.name = formData.name;
      }
      if (formData.address !== (destination.address || '')) {
        updates.address = formData.address;
      }
      if (formData.lat !== destination.lat) {
        updates.lat = formData.lat;
      }
      if (formData.lng !== destination.lng) {
        updates.lng = formData.lng;
      }
      if (formData.category !== (destination.category || '')) {
        updates.category = formData.category;
      }
      if (formData.travelMode !== destination.travelMode) {
        updates.travelMode = formData.travelMode;
      }

      // Only call mutation if there are actual changes
      if (Object.keys(updates).length > 0) {
        await updateDestination({
          destinationId: destination._id,
          ...updates,
        });
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Failed to update destination:', error);
      // TODO: Show error toast/notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    search(value);
    setShowPredictions(true);

    // Clear location error when user starts typing
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: undefined }));
    }
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  const handlePlaceSelect = async (placeId: string, description: string) => {
    const details = await getPlaceDetails(placeId);

    if (details) {
      setFormData(prev => ({
        ...prev,
        name: details.name,
        address: details.address,
        lat: details.lat,
        lng: details.lng,
        placeId: details.placeId,
      }));
      setSearchQuery(description);
      setShowPredictions(false);
      clearPredictions();

      // Clear errors
      setErrors({});
    }
  };

  const handleTravelModeChange = (mode: TravelMode) => {
    setFormData(prev => ({ ...prev, travelMode: mode }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
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
            aria-labelledby="edit-destination-title"
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
                  <Save className="w-6 h-6 text-white" />
                </div>
                <h2 id="edit-destination-title" className="text-xl font-semibold text-slate-900">
                  Edit Destination
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Update the destination details
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Location Search with Autocomplete */}
                <div className="relative">
                  <label htmlFor="location-search" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="location-search"
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search for a place..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => setShowPredictions(true)}
                      className={`w-full bg-white backdrop-blur-lg border rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sunset-500/50 focus:border-sunset-500/50 transition-all duration-200 disabled:opacity-50 ${
                        errors.name || errors.location
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-slate-200'
                      }`}
                      disabled={isSubmitting}
                      aria-invalid={errors.name || errors.location ? 'true' : 'false'}
                      aria-describedby={errors.name ? 'name-error' : errors.location ? 'location-error' : undefined}
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden="true" />
                  </div>

                  {/* Predictions Dropdown */}
                  {showPredictions && predictions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl max-h-60 overflow-y-auto">
                      {predictions.map((prediction) => (
                        <button
                          key={prediction.placeId}
                          type="button"
                          onClick={() => handlePlaceSelect(prediction.placeId, prediction.description)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl min-h-[44px]"
                        >
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {prediction.mainText}
                              </p>
                              {prediction.secondaryText && (
                                <p className="text-xs text-slate-500 truncate">
                                  {prediction.secondaryText}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Loading State */}
                  {isLoading && (
                    <p className="mt-1 text-xs text-slate-500">
                      Searching...
                    </p>
                  )}

                  {/* Errors */}
                  {errors.name && (
                    <p id="name-error" className="mt-1 text-xs text-red-600" role="alert">
                      {errors.name}
                    </p>
                  )}
                  {errors.location && (
                    <p id="location-error" className="mt-1 text-xs text-red-600" role="alert">
                      {errors.location}
                    </p>
                  )}

                  {/* Current Selection */}
                  {formData.lat !== 0 && formData.lng !== 0 && (
                    <p className="mt-1 text-xs text-green-600">
                      Selected: {formData.name || formData.address}
                    </p>
                  )}
                </div>

                {/* Travel Mode Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Travel Mode <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {TRAVEL_MODES.map(({ mode, icon: Icon, label, description }) => {
                      const isSelected = formData.travelMode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => handleTravelModeChange(mode)}
                          disabled={isSubmitting}
                          className={`
                            flex flex-col items-center justify-center
                            p-3 rounded-xl border-2 transition-all duration-200
                            min-h-[80px] min-w-[44px]
                            ${
                              isSelected
                                ? 'border-sunset-500 bg-sunset-50 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                          `}
                          aria-pressed={isSelected}
                          aria-label={`${label}: ${description}`}
                        >
                          <Icon
                            className={`w-6 h-6 mb-1.5 ${
                              isSelected ? 'text-sunset-600' : 'text-slate-500'
                            }`}
                            aria-hidden="true"
                          />
                          <span
                            className={`text-xs font-medium ${
                              isSelected ? 'text-sunset-700' : 'text-slate-600'
                            }`}
                          >
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Choose how you'll travel to this destination
                  </p>
                </div>

                {/* Category (Optional) */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Category <span className="text-slate-400">(Optional)</span>
                  </label>
                  <GlassInput
                    id="category"
                    type="text"
                    placeholder="e.g., Restaurant, Shopping, Attraction"
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Tag this destination for easier organization
                  </p>
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
                        <span>Saving Changes...</span>
                      </div>
                    ) : (
                      'Save Changes'
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
