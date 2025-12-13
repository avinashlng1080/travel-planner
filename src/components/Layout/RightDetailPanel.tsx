import { X, MapPin, Clock, DollarSign, Car, Star, AlertTriangle, Lightbulb, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassBadge, GlassButton, GlassCard } from '../ui/GlassPanel';
import type { Location } from '../../data/tripData';

interface RightDetailPanelProps {
  location: Location | null;
  onClose: () => void;
  onAddToPlan: (planType: 'A' | 'B') => void;
}

export function RightDetailPanel({ location, onClose, onAddToPlan }: RightDetailPanelProps) {
  if (!location) return null;

  const categoryColors: Record<string, string> = {
    'home-base': 'pink',
    'toddler-friendly': 'pink',
    attraction: 'green',
    shopping: 'purple',
    restaurant: 'amber',
    nature: 'green',
    temple: 'red',
    playground: 'cyan',
    medical: 'red',
    avoid: 'slate',
  };

  const categoryColor = categoryColors[location.category] || 'slate';

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-14 right-0 bottom-0 z-40 w-96 bg-slate-900/90 backdrop-blur-xl border-l border-slate-700/50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl p-4 border-b border-slate-700/50 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <GlassBadge color={categoryColor as any}>
                  {location.category.replace('-', ' ')}
                </GlassBadge>
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < location.toddlerRating ? 'fill-current' : 'opacity-30'}`}
                    />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">Toddler</span>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-white">{location.name}</h2>
              <p className="text-sm text-slate-400">{location.city}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Description */}
          <p className="text-sm text-slate-300 leading-relaxed">{location.description}</p>

          {/* Address */}
          {location.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-slate-300">{location.address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 mt-1"
                >
                  Open in Google Maps
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <GlassCard className="p-3" hover={false}>
              <Clock className="w-4 h-4 text-cyan-400 mb-1" />
              <p className="text-xs text-slate-400">Duration</p>
              <p className="text-sm font-medium text-white">{location.estimatedDuration}</p>
            </GlassCard>
            <GlassCard className="p-3" hover={false}>
              <DollarSign className="w-4 h-4 text-green-400 mb-1" />
              <p className="text-xs text-slate-400">Grab Cost</p>
              <p className="text-sm font-medium text-white">{location.grabEstimate}</p>
            </GlassCard>
            <GlassCard className="p-3" hover={false}>
              <MapPin className="w-4 h-4 text-amber-400 mb-1" />
              <p className="text-xs text-slate-400">Distance</p>
              <p className="text-sm font-medium text-white">{location.distanceFromBase}</p>
            </GlassCard>
            <GlassCard className="p-3" hover={false}>
              <Car className="w-4 h-4 text-purple-400 mb-1" />
              <p className="text-xs text-slate-400">Drive Time</p>
              <p className="text-sm font-medium text-white">{location.drivingTime}</p>
            </GlassCard>
          </div>

          {/* Opening Hours & Fee */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Opening Hours</span>
              <span className="text-white">{location.openingHours}</span>
            </div>
            {location.entranceFee && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Entrance Fee</span>
                <span className="text-white">{location.entranceFee}</span>
              </div>
            )}
          </div>

          {/* Dress Code Warning */}
          {location.dressCode && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Dress Code</span>
              </div>
              <p className="text-xs text-amber-200/80">{location.dressCode}</p>
            </div>
          )}

          {/* Warnings */}
          {location.warnings.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Warnings</span>
              </div>
              <ul className="space-y-1">
                {location.warnings.map((warning, i) => (
                  <li key={i} className="text-xs text-red-200/80 flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          {location.tips.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <Lightbulb className="w-4 h-4" />
                <span className="text-sm font-medium">Tips</span>
              </div>
              <ul className="space-y-1">
                {location.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-green-200/80 flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What to Bring */}
          {location.whatToBring.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">What to Bring</h4>
              <div className="flex flex-wrap gap-2">
                {location.whatToBring.map((item, i) => (
                  <GlassBadge key={i} color="green">
                    {item}
                  </GlassBadge>
                ))}
              </div>
            </div>
          )}

          {/* Best Time to Visit */}
          {location.bestTimeToVisit.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Best Time to Visit</h4>
              <div className="flex flex-wrap gap-2">
                {location.bestTimeToVisit.map((time, i) => (
                  <GlassBadge key={i} color="cyan">
                    {time}
                  </GlassBadge>
                ))}
              </div>
            </div>
          )}

          {/* Environment Badge */}
          <div className="flex items-center gap-2">
            <GlassBadge color={location.isIndoor ? 'blue' : 'green'}>
              {location.isIndoor ? 'Indoor' : 'Outdoor'}
            </GlassBadge>
            {location.bookingRequired && (
              <GlassBadge color="amber">Booking Required</GlassBadge>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl p-4 border-t border-slate-700/50 space-y-2">
          <GlassButton className="w-full" variant="success" onClick={() => onAddToPlan('A')}>
            Add to Plan A
          </GlassButton>
          <GlassButton className="w-full" onClick={() => onAddToPlan('B')}>
            Add to Plan B
          </GlassButton>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
