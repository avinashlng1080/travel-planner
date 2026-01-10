import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, DollarSign, Car, Star, AlertTriangle, Lightbulb, ExternalLink, Sparkles } from 'lucide-react';
import { useState, useMemo } from 'react';

import { useWeather } from '../../hooks/useWeather';
import { AddToPlanModal } from '../ui/AddToPlanModal';
import { GlassBadge, GlassButton, GlassCard } from '../ui/GlassPanel';
import { WeatherCard } from '../weather';

import type { Location, DayPlan } from '../../data/tripData';

interface RightDetailPanelProps {
  location: Location | null;
  days: DayPlan[];
  selectedDayId: string | null;
  onClose: () => void;
  onAddToPlan: (planType: 'A' | 'B', details: {
    dayId: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) => void;
}

export function RightDetailPanel({ location, days, selectedDayId, onClose, onAddToPlan }: RightDetailPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState<'A' | 'B'>('A');

  // Get weather data (defaults to Kuala Lumpur)
  const { current: currentWeather, daily: weatherForecast, isLoading: weatherLoading } = useWeather();

  // Get today's forecast
  const todayForecast = useMemo(() => {
    if (!weatherForecast.length) {return null;}
    const today = new Date().toISOString().split('T')[0];
    return weatherForecast.find((f) => f.date === today) || weatherForecast[0];
  }, [weatherForecast]);

  if (!location) {return null;}

  // Check if this is an AI-suggested dynamic pin
  const isAISuggested = location.id.startsWith('dynamic-');

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
        key={location.id}
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 md:top-14 left-0 md:left-auto right-0 bottom-0 z-40 w-full md:w-96 bg-white/90 backdrop-blur-xl border-l border-slate-200/50 overflow-hidden flex flex-col safe-area-inset-top safe-area-inset-x safe-area-inset-bottom md:!pt-0"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xl p-4 border-b border-slate-200/50 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {isAISuggested && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200">
                    <Sparkles className="w-3 h-3" />
                    AI Suggested
                  </span>
                )}
                <GlassBadge color={categoryColor as any}>
                  {location.category.replace('-', ' ')}
                </GlassBadge>
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={`${location.id}-star-${i}`}
                      className={`w-3 h-3 ${i < location.toddlerRating ? 'fill-current' : 'opacity-30'}`}
                    />
                  ))}
                  <span className="text-xs text-slate-600 ml-1">Toddler</span>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">{location.name}</h2>
              <p className="text-sm text-slate-600">{location.city}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 md:p-2 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-lg transition-colors"
              aria-label="Close details"
            >
              <X className="w-6 h-6 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed">{location.description}</p>

          {/* Address */}
          {location.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-slate-600">{location.address}</p>
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
              <p className="text-xs text-slate-600">Duration</p>
              <p className="text-sm font-medium text-slate-900">{location.estimatedDuration}</p>
            </GlassCard>
            <GlassCard className="p-3" hover={false}>
              <DollarSign className="w-4 h-4 text-green-400 mb-1" />
              <p className="text-xs text-slate-600">Grab Cost</p>
              <p className="text-sm font-medium text-slate-900">{location.grabEstimate}</p>
            </GlassCard>
            <GlassCard className="p-3" hover={false}>
              <MapPin className="w-4 h-4 text-amber-400 mb-1" />
              <p className="text-xs text-slate-600">Distance</p>
              <p className="text-sm font-medium text-slate-900">{location.distanceFromBase}</p>
            </GlassCard>
            <GlassCard className="p-3" hover={false}>
              <Car className="w-4 h-4 text-purple-400 mb-1" />
              <p className="text-xs text-slate-600">Drive Time</p>
              <p className="text-sm font-medium text-slate-900">{location.drivingTime}</p>
            </GlassCard>
          </div>

          {/* Current Weather */}
          <WeatherCard
            current={currentWeather ?? undefined}
            forecast={todayForecast ?? undefined}
            isLoading={weatherLoading}
          />

          {/* Opening Hours & Fee */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Opening Hours</span>
              <span className="text-slate-900">{location.openingHours}</span>
            </div>
            {location.entranceFee && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Entrance Fee</span>
                <span className="text-slate-900">{location.entranceFee}</span>
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
                  <li key={`${location.id}-warning-${i}-${warning.slice(0, 20)}`} className="text-xs text-red-200/80 flex items-start gap-2">
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
                  <li key={`${location.id}-tip-${i}-${tip.slice(0, 20)}`} className="text-xs text-green-200/80 flex items-start gap-2">
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
              <h4 className="text-sm font-medium text-slate-600 mb-2">What to Bring</h4>
              <div className="flex flex-wrap gap-2">
                {location.whatToBring.map((item, i) => (
                  <GlassBadge key={`${location.id}-bring-${i}-${item}`} color="green">
                    {item}
                  </GlassBadge>
                ))}
              </div>
            </div>
          )}

          {/* Best Time to Visit */}
          {location.bestTimeToVisit.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-600 mb-2">Best Time to Visit</h4>
              <div className="flex flex-wrap gap-2">
                {location.bestTimeToVisit.map((time, i) => (
                  <GlassBadge key={`${location.id}-besttime-${i}-${time}`} color="cyan">
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
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl p-4 border-t border-slate-200/50 space-y-2">
          <GlassButton
            className="w-full"
            variant="success"
            onClick={() => {
              setSelectedPlanType('A');
              setModalOpen(true);
            }}
          >
            Add to Plan A
          </GlassButton>
          <GlassButton
            className="w-full"
            onClick={() => {
              setSelectedPlanType('B');
              setModalOpen(true);
            }}
          >
            Add to Plan B
          </GlassButton>
        </div>
      </motion.aside>

      {/* Add to Plan Modal */}
      <AddToPlanModal
        isOpen={modalOpen}
        locationName={location.name}
        planType={selectedPlanType}
        days={days}
        currentDayId={selectedDayId}
        onClose={() => { setModalOpen(false); }}
        onAdd={(details) => {
          onAddToPlan(selectedPlanType, details);
          setModalOpen(false);
        }}
      />
    </AnimatePresence>
  );
}
