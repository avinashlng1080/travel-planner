import { useMutation } from 'convex/react';
import { X, Home, Camera, ShoppingBag, UtensilsCrossed, Trees, Church, Baby, Plus, MapPin, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { usePlacesAutocomplete } from '@/hooks/usePlacesAutocomplete';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';

import { api } from '../../../convex/_generated/api';

import type { Id } from '../../../convex/_generated/dataModel';

interface AddLocationDialogProps {
  tripId: Id<'trips'>;
  lat: number;
  lng: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORY_OPTIONS = [
  { value: 'attraction', label: 'Attraction', icon: Camera, color: '#10B981' },
  { value: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed, color: '#F59E0B' },
  { value: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#8B5CF6' },
  { value: 'nature', label: 'Nature', icon: Trees, color: '#22C55E' },
  { value: 'toddler-friendly', label: 'Toddler Friendly', icon: Baby, color: '#F472B6' },
  { value: 'temple', label: 'Temple', icon: Church, color: '#EF4444' },
  { value: 'home-base', label: 'Accommodation', icon: Home, color: '#EC4899' },
];

export function AddLocationDialog({ tripId, lat, lng, onClose, onSuccess }: AddLocationDialogProps) {
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('attraction');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Coordinates state (can be updated if user selects from autocomplete)
  const [currentLat, setCurrentLat] = useState(lat);
  const [currentLng, setCurrentLng] = useState(lng);
  const [_placeId, setPlaceId] = useState<string | undefined>();
  const [address, setAddress] = useState<string | undefined>();

  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [showPredictions, setShowPredictions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasSelectedPlace, setHasSelectedPlace] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const predictionsRef = useRef<HTMLDivElement>(null);

  // Hooks
  const addLocation = useMutation(api.tripLocations.addLocation);

  const {
    predictions,
    isLoading: isLoadingPredictions,
    error: placesError,
    search,
    getPlaceDetails,
    clearPredictions,
  } = usePlacesAutocomplete({
    componentRestrictions: { country: 'MY' }, // Malaysia
  });

  const {
    isLoading: isReverseGeocoding,
    error: geocodeError,
    reverseGeocode,
  } = useReverseGeocode();

  // Reverse geocode on mount to get initial location name
  useEffect(() => {
    const fetchLocationName = async () => {
      const result = await reverseGeocode(lat, lng);
      if (result && !name) {
        setName(result.name);
        setSearchQuery(result.name);
        setAddress(result.address);
        setPlaceId(result.placeId);
      }
    };

    fetchLocationName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Search for places as user types
  useEffect(() => {
    if (searchQuery.trim() && searchQuery !== name) {
      search(searchQuery);
      setShowPredictions(true);
    } else {
      clearPredictions();
      setShowPredictions(false);
    }
    setSelectedIndex(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Click outside predictions handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        predictionsRef.current &&
        !predictionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && predictionsRef.current) {
      const selectedElement = document.getElementById(`location-prediction-${selectedIndex}`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setName(value);
    // Reset selected place flag when user types
    if (hasSelectedPlace) {
      setHasSelectedPlace(false);
    }
  };

  const handleSelectPlace = async (selectedPlaceId: string) => {
    const details = await getPlaceDetails(selectedPlaceId);

    if (details) {
      setName(details.name);
      setSearchQuery(details.name);
      setCurrentLat(details.lat);
      setCurrentLng(details.lng);
      setPlaceId(details.placeId);
      setAddress(details.address);
      setHasSelectedPlace(true);
      setShowPredictions(false);
      setSelectedIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPredictions || predictions.length === 0) return;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await addLocation({
        tripId,
        name: name.trim(),
        lat: currentLat,
        lng: currentLng,
        category,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to add location:', error);
      setSubmitError('Failed to add location. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Add Location</h2>
              <p className="text-xs text-slate-600">
                {hasSelectedPlace ? address : `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Location Name with Autocomplete */}
          <div className="relative">
            <label htmlFor="location-name" className="block text-sm font-medium text-slate-700 mb-2">
              Location Name <span className="text-sunset-600">*</span>
            </label>
            <div className="relative">
              <input
                id="location-name"
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={showPredictions && predictions.length > 0}
                aria-autocomplete="list"
                aria-controls="location-predictions-list"
                aria-activedescendant={
                  selectedIndex >= 0 ? `location-prediction-${selectedIndex}` : undefined
                }
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (predictions.length > 0) {
                    setShowPredictions(true);
                  }
                }}
                placeholder={isReverseGeocoding ? 'Finding location...' : 'Search for a place or enter name'}
                className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunset-500 focus:border-transparent"
                required
                disabled={isSubmitting}
                autoComplete="off"
              />

              {/* Loading indicator */}
              {(isLoadingPredictions || isReverseGeocoding) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-sunset-500 rounded-full animate-spin" aria-label="Loading" />
                </div>
              )}

              {/* Check mark for selected place */}
              {hasSelectedPlace && !isLoadingPredictions && !isReverseGeocoding && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
              )}
            </div>

            {/* Predictions Dropdown */}
            {showPredictions && predictions.length > 0 && (
              <div
                id="location-predictions-list"
                ref={predictionsRef}
                role="listbox"
                className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto"
              >
                {predictions.map((prediction, index) => (
                  <button
                    key={prediction.placeId}
                    id={`location-prediction-${index}`}
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
            {placesError && (
              <p role="alert" className="mt-1 text-xs text-red-600">{placesError}</p>
            )}
            {geocodeError && (
              <p role="alert" className="mt-1 text-xs text-amber-600">{geocodeError}</p>
            )}

            {/* Selected location confirmation */}
            {hasSelectedPlace && address && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-green-900">
                      Location selected
                    </p>
                    <p className="text-xs text-green-700 mt-0.5 truncate">
                      {address}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = category === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategory(option.value)}
                    className={`
                      flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all min-h-[44px]
                      ${isSelected
                        ? 'border-sunset-400 bg-sunset-50 text-sunset-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-sunset-300 hover:bg-sunset-50/30'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" style={{ color: option.color }} />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="location-description" className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              id="location-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this location..."
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunset-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="location-notes" className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              id="location-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Personal notes, tips, or reminders..."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunset-500 focus:border-transparent resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 space-y-3">
          {/* Error message */}
          {submitError && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors min-h-[44px]"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-br from-sunset-500 to-ocean-600 hover:from-sunset-600 hover:to-ocean-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sunset-500/30 min-h-[44px]"
          >
            {isSubmitting ? 'Adding...' : 'Add Location'}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
