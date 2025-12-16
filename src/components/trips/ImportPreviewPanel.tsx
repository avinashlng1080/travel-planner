import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Trash2,
  AlertTriangle,
  Lightbulb,
  MapPin,
  Clock,
  Calendar,
  Globe,
} from 'lucide-react';
import type {
  ParsedItinerary,
  ParsedLocation,
  ParsedActivity,
  ConfidenceLevel,
  LocationCategory,
} from '@/types/itinerary';
import { getTimezoneOptions, getTimezoneAbbr, getGMTOffset } from '@/utils/timezone';

interface ImportPreviewPanelProps {
  data: ParsedItinerary;
  selectedTimezone: string | null;
  onTimezoneChange: (timezone: string) => void;
  onUpdateLocation: (id: string, updates: Partial<ParsedLocation>) => void;
  onDeleteLocation: (id: string) => void;
  onUpdateActivity: (dayIndex: number, activityId: string, updates: Partial<ParsedActivity>) => void;
  onDeleteActivity: (dayIndex: number, activityId: string) => void;
}

// Category badge colors
const categoryColors: Record<LocationCategory, string> = {
  restaurant: 'bg-amber-100 text-amber-800',
  attraction: 'bg-emerald-100 text-emerald-800',
  shopping: 'bg-purple-100 text-purple-800',
  nature: 'bg-green-100 text-green-800',
  temple: 'bg-red-100 text-red-800',
  hotel: 'bg-blue-100 text-blue-800',
  transport: 'bg-slate-100 text-slate-800',
  medical: 'bg-rose-100 text-rose-800',
  playground: 'bg-cyan-100 text-cyan-800',
};

// Confidence badge component
function ConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  const colors = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-red-100 text-red-700',
  };

  const labels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low - verify',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[confidence]}`}>
      {labels[confidence]}
    </span>
  );
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function ImportPreviewPanel({
  data,
  selectedTimezone,
  onTimezoneChange,
  onDeleteLocation,
  onDeleteActivity,
}: ImportPreviewPanelProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(
    new Set(data.days.map((_, i) => i))
  );

  const timezoneOptions = getTimezoneOptions();

  const toggleDay = (index: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Calculate totals
  const totalLocations = data.locations.length;
  const totalActivities = data.days.reduce(
    (sum, day) => sum + day.activities.length,
    0
  );
  const totalDays = data.days.length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="flex items-center justify-center gap-6 p-4 bg-gradient-to-r from-sunset-50 to-ocean-50 rounded-xl">
        <div className="text-center">
          <div className="text-2xl font-bold text-sunset-600">{totalLocations}</div>
          <div className="text-xs text-slate-600">Locations</div>
        </div>
        <div className="w-px h-8 bg-slate-300" />
        <div className="text-center">
          <div className="text-2xl font-bold text-ocean-600">{totalActivities}</div>
          <div className="text-xs text-slate-600">Activities</div>
        </div>
        <div className="w-px h-8 bg-slate-300" />
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-700">{totalDays}</div>
          <div className="text-xs text-slate-600">Days</div>
        </div>
      </div>

      {/* Timezone Selector */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-indigo-600" />
          <span className="font-medium text-indigo-900">Timezone</span>
          {data.detectedGmtOffset && (
            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
              Detected: {data.detectedGmtOffset}
            </span>
          )}
        </div>
        <p className="text-sm text-indigo-700 mb-3">
          All times will be stored in this timezone. Change if needed.
        </p>
        <select
          value={selectedTimezone || ''}
          onChange={(e) => onTimezoneChange(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">Select timezone...</option>
          {timezoneOptions.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label} ({tz.offset})
            </option>
          ))}
        </select>
        {selectedTimezone && (
          <p className="mt-2 text-xs text-indigo-600">
            Times like "16:30" will be stored as {getTimezoneAbbr(selectedTimezone)} (GMT{getGMTOffset(selectedTimezone)})
          </p>
        )}
      </div>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">Warnings</span>
          </div>
          <ul className="text-sm text-yellow-700 space-y-1">
            {data.warnings.map((warning, i) => (
              <li key={`warning-${i}-${warning.slice(0, 30)}`} className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Suggestions</span>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            {data.suggestions.map((suggestion, i) => (
              <li key={`suggestion-${i}-${suggestion.slice(0, 30)}`} className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Locations Section */}
      <div>
        <h3 className="flex items-center gap-2 font-medium text-slate-900 mb-3">
          <MapPin className="w-4 h-4 text-sunset-500" />
          Locations ({totalLocations})
        </h3>
        <div className="space-y-2">
          {data.locations.map((location) => (
            <div
              key={location.id}
              className="flex items-center justify-between p-3 bg-white/70 border border-slate-200 rounded-lg hover:bg-white/90 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                    categoryColors[location.category] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {location.category}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {location.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ConfidenceBadge confidence={location.confidence} />
                <button
                  onClick={() => onDeleteLocation(location.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label={`Delete ${location.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Days Section */}
      <div>
        <h3 className="flex items-center gap-2 font-medium text-slate-900 mb-3">
          <Calendar className="w-4 h-4 text-ocean-500" />
          Schedule ({totalDays} days)
        </h3>
        <div className="space-y-2">
          {data.days.map((day, dayIndex) => (
            <div
              key={day.date}
              className="border border-slate-200 rounded-lg overflow-hidden"
            >
              {/* Day Header */}
              <button
                onClick={() => toggleDay(dayIndex)}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <span className="font-medium text-slate-900">
                  {formatDate(day.date)}
                  {day.title && (
                    <span className="text-slate-500 font-normal ml-2">
                      - {day.title}
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {day.activities.length} activities
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transform transition-transform ${
                      expandedDays.has(dayIndex) ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Activities */}
              <AnimatePresence>
                {expandedDays.has(dayIndex) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 space-y-2 bg-white">
                      {day.activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center gap-1 text-xs text-slate-600 whitespace-nowrap">
                              <Clock className="w-3 h-3" />
                              {activity.startTime} - {activity.endTime}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 truncate">
                                {activity.locationName}
                              </p>
                              {activity.notes && (
                                <p className="text-xs text-slate-500 truncate">
                                  {activity.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {activity.isFlexible && (
                              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                Flexible
                              </span>
                            )}
                            <button
                              onClick={() => onDeleteActivity(dayIndex, activity.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              aria-label={`Delete ${activity.locationName} activity`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {day.activities.length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-2">
                          No activities for this day
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
