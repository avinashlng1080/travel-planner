import { useMutation } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Car, Train, Bike, PersonStanding } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { usePlacesAutocomplete } from '@/hooks/usePlacesAutocomplete';

import { api } from '../../../convex/_generated/api';
import { type Id } from '../../../convex/_generated/dataModel';
import { GlassPanel } from '../ui/GlassPanel';

export interface AddDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: Id<'trips'>;
  onSuccess?: () => void;
}

type TravelMode = 'DRIVING' | 'TRANSIT' | 'BICYCLING' | 'WALKING';

interface FormData {
  name: string;
  lat: number | null;
  lng: number | null;
  placeId?: string;
  address?: string;
  category?: string;
  travelMode: TravelMode;
}

interface FormErrors {
  name?: string;
  location?: string;
}

const TRAVEL_MODES: {
  mode: TravelMode;
  icon: typeof Car;
  label: string;
}[] = [
  { mode: 'DRIVING', icon: Car, label: 'Drive' },
  { mode: 'TRANSIT', icon: Train, label: 'Transit' },
  { mode: 'BICYCLING', icon: Bike, label: 'Bike' },
  { mode: 'WALKING', icon: PersonStanding, label: 'Walk' },
];

const CATEGORIES = [
  { value: '', label: 'Select category (optional)' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'attraction', label: 'Attraction' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'nature', label: 'Nature' },
];

export default function AddDestinationModal({
  isOpen,
  onClose,
  tripId,
  onSuccess
}: AddDestinationModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    lat: null,
    lng: null,
    placeId: undefined,
    address: undefined,
    category: '',
    travelMode: 'DRIVING',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPredictions, setShowPredictions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const predictionsRef = useRef<HTMLDivElement>(null);

  // Places Autocomplete hook
  const {
    predictions,
    isLoading: isLoadingPredictions,
    error: placesError,
    search,
    getPlaceDetails,
    clearPredictions,
  } = usePlacesAutocomplete({});

  // Convex mutation
  const addDestination = useMutation(api.commuteDestinations.addDestination);

  // Focus trap: focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
      return () => { clearTimeout(timer); };
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
    return () => { document.removeEventListener('keydown', handleEscape); };
  }, [isOpen]);

  // Click outside predictions handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        predictionsRef.current &&
        !predictionsRef.current.contains(e.target as Node)
      ) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  // Search for places as user types
  useEffect(() => {
    if (searchQuery.trim()) {
      search(searchQuery);
      setShowPredictions(true);
    } else {
      clearPredictions();
      setShowPredictions(false);
    }
    setSelectedIndex(-1); // Reset selection when search changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && predictionsRef.current) {
      const selectedElement = document.getElementById(`prediction-${selectedIndex}`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form after animation completes
      setTimeout(() => {
        setFormData({
          name: '',
          lat: null,
          lng: null,
          placeId: undefined,
          address: undefined,
          category: '',
          travelMode: 'DRIVING',
        });
        setErrors({});
        setSearchQuery('');
        clearPredictions();
        setShowPredictions(false);
      }, 200);
    }
  };

  const handleSelectPlace = async (placeId: string) => {
    const details = await getPlaceDetails(placeId);

    if (details) {
      setFormData(prev => ({
        ...prev,
        name: details.name,
        lat: details.lat,
        lng: details.lng,
        placeId: details.placeId,
        address: details.address,
      }));
      setSearchQuery(details.name);
      setShowPredictions(false);
      setSelectedIndex(-1);

      // Clear location error if it exists
      if (errors.location) {
        setErrors(prev => ({ ...prev, location: undefined }));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPredictions || predictions.length === 0) {return;}

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < predictions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < predictions.length) {
          handleSelectPlace(predictions[selectedIndex].placeId);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowPredictions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required: Name
    if (!formData.name.trim()) {
      newErrors.name = 'Destination name is required';
    }

    // Required: Valid location (lat/lng)
    if (formData.lat === null || formData.lng === null) {
      newErrors.location = 'Please select a valid location from the dropdown';
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
      await addDestination({
        tripId,
        name: formData.name,
        lat: formData.lat!,
        lng: formData.lng!,
        placeId: formData.placeId,
        address: formData.address,
        category: formData.category || undefined,
        travelMode: formData.travelMode,
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Failed to add destination:', error);
      // TODO: Show error toast/notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setFormData(prev => ({
      ...prev,
      name: value,
      lat: null,
      lng: null,
      placeId: undefined,
      address: undefined,
    }));

    // Clear name error when user starts typing
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  const handleTravelModeChange = (mode: TravelMode) => {
    setFormData(prev => ({ ...prev, travelMode: mode }));
  };

  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
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
            aria-labelledby="add-destination-title"
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
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h2 id="add-destination-title" className="text-xl font-semibold text-slate-900">
                  Add Commute Destination
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Add a new destination to calculate commute times
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Location Search with Autocomplete */}
                <div className="relative">
                  <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="location"
                    ref={firstInputRef}
                    type="text"
                    role="combobox"
                    aria-expanded={showPredictions && predictions.length > 0}
                    aria-autocomplete="list"
                    aria-controls="predictions-list"
                    aria-activedescendant={
                      selectedIndex >= 0 ? `prediction-${selectedIndex}` : undefined
                    }
                    placeholder="Search for a place..."
                    value={searchQuery}
                    onChange={(e) => { handleSearchChange(e.target.value); }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (predictions.length > 0) {
                        setShowPredictions(true);
                      }
                    }}
                    className={`w-full bg-white backdrop-blur-lg border rounded-xl px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sunset-500/50 focus:border-sunset-500/50 transition-all duration-200 disabled:opacity-50 ${errors.name || errors.location ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-200'}`}
                    disabled={isSubmitting}
                    autoComplete="off"
                  />

                  {/* Loading indicator */}
                  {isLoadingPredictions && (
                    <div className="absolute right-3 top-[42px] pointer-events-none">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-sunset-500 rounded-full animate-spin" aria-label="Loading" />
                    </div>
                  )}

                  {/* Predictions Dropdown */}
                  {showPredictions && predictions.length > 0 && (
                    <div
                      id="predictions-list"
                      ref={predictionsRef}
                      role="listbox"
                      className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto"
                    >
                      {predictions.map((prediction, index) => (
                        <button
                          key={prediction.placeId}
                          id={`prediction-${index}`}
                          type="button"
                          role="option"
                          aria-selected={index === selectedIndex}
                          onClick={() => handleSelectPlace(prediction.placeId)}
                          className={`w-full text-left px-4 py-3 transition-colors border-b border-slate-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl min-h-[44px] ${
                            index === selectedIndex
                              ? 'bg-sunset-50 border-sunset-200'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {prediction.mainText}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {prediction.secondaryText}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Error messages */}
                  {errors.name && (
                    <p role="alert" className="mt-1 text-xs text-red-600">{errors.name}</p>
                  )}
                  {errors.location && (
                    <p role="alert" className="mt-1 text-xs text-red-600">{errors.location}</p>
                  )}
                  {placesError && (
                    <p role="alert" className="mt-1 text-xs text-red-600">{placesError}</p>
                  )}

                  {/* Selected location confirmation */}
                  {formData.lat !== null && formData.lng !== null && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-green-900">
                            Location selected
                          </p>
                          {formData.address && (
                            <p className="text-xs text-green-700 mt-0.5 truncate">
                              {formData.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Travel Mode Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Travel Mode
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {TRAVEL_MODES.map(({ mode, icon: Icon, label }) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => { handleTravelModeChange(mode); }}
                        disabled={isSubmitting}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 disabled:opacity-50 min-h-[76px] ${
                          formData.travelMode === mode
                            ? 'bg-sunset-50 border-sunset-500 text-sunset-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                        aria-label={`Select ${label} mode`}
                        aria-pressed={formData.travelMode === mode}
                      >
                        <Icon className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Picker */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => { handleCategoryChange(e.target.value); }}
                    disabled={isSubmitting}
                    className="w-full bg-white backdrop-blur-lg border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sunset-500/50 focus:border-sunset-500/50 transition-all duration-200 disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%225%22%20viewBox%3D%220%200%2010%205%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M0%200l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_5px] bg-[position:calc(100%-12px)_center] bg-no-repeat pr-10"
                  >
                    {CATEGORIES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Optional: Helps organize your destinations
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
                        <span>Adding Destination...</span>
                      </div>
                    ) : (
                      'Add Destination'
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
