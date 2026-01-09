import { useMutation } from 'convex/react';
import { X, Home, Camera, ShoppingBag, UtensilsCrossed, Trees, Church, Baby, Plus } from 'lucide-react';
import { useState } from 'react';

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
  const [name, setName] = useState('');
  const [category, setCategory] = useState('attraction');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addLocation = useMutation(api.tripLocations.addLocation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {return;}

    setIsSubmitting(true);
    try {
      await addLocation({
        tripId,
        name: name.trim(),
        lat,
        lng,
        category,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to add location:', error);
      alert('Failed to add location. Please try again.');
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
                {lat.toFixed(4)}, {lng.toFixed(4)}
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
          {/* Name */}
          <div>
            <label htmlFor="location-name" className="block text-sm font-medium text-slate-700 mb-2">
              Location Name <span className="text-sunset-600">*</span>
            </label>
            <input
              id="location-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); }}
              placeholder="e.g., Batu Caves, KLCC Park"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunset-500 focus:border-transparent"
              required
              autoFocus
            />
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
                    onClick={() => { setCategory(option.value); }}
                    className={`
                      flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all
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
              onChange={(e) => { setDescription(e.target.value); }}
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
              onChange={(e) => { setNotes(e.target.value); }}
              placeholder="Personal notes, tips, or reminders..."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunset-500 focus:border-transparent resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-br from-sunset-500 to-ocean-600 hover:from-sunset-600 hover:to-ocean-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sunset-500/30"
          >
            {isSubmitting ? 'Adding...' : 'Add Location'}
          </button>
        </div>
      </div>
    </div>
  );
}
