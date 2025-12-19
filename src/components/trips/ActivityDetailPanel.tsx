import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map as GoogleMapComponent, AdvancedMarker } from '@vis.gl/react-google-maps';
import {
  X,
  Clock,
  MapPin,
  Edit2,
  Trash2,
  AlertTriangle,
  FileText,
  Tag,
} from 'lucide-react';
import { GlassPanel, GlassButton, GlassBadge } from '../ui/GlassPanel';
import type { Id } from '../../../convex/_generated/dataModel';

interface ActivityDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activity: {
    _id: Id<'tripScheduleItems'>;
    title: string;
    dayDate: string;
    startTime: string;
    endTime: string;
    notes?: string;
    isFlexible: boolean;
    locationId?: Id<'tripLocations'>;
  } | null;
  location?: {
    name: string;
    lat: number;
    lng: number;
    category?: string;
  };
  userRole: 'owner' | 'editor' | 'commenter' | 'viewer';
  onEdit?: () => void;
  onDelete?: () => void;
}

// Category badge colors
const categoryColors: Record<string, string> = {
  restaurant: 'bg-amber-100 text-amber-800 border-amber-200',
  attraction: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  shopping: 'bg-purple-100 text-purple-800 border-purple-200',
  nature: 'bg-green-100 text-green-800 border-green-200',
  temple: 'bg-red-100 text-red-800 border-red-200',
  hotel: 'bg-blue-100 text-blue-800 border-blue-200',
  transport: 'bg-slate-100 text-slate-800 border-slate-200',
  medical: 'bg-rose-100 text-rose-800 border-rose-200',
  playground: 'bg-cyan-100 text-cyan-800 border-cyan-200',
};

export function ActivityDetailPanel({
  isOpen,
  onClose,
  activity,
  location,
  userRole,
  onEdit,
  onDelete,
}: ActivityDetailPanelProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_ID;

  if (!mapId) {
    console.warn(
      '[ActivityDetailPanel] VITE_GOOGLE_MAPS_ID is not set. ' +
      'AdvancedMarker requires a Map ID. See: https://console.cloud.google.com/google/maps-apis/studio/maps'
    );
  }

  if (!activity) return null;

  const canEdit = userRole === 'owner' || userRole === 'editor';

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate duration
  const calculateDuration = (start: string, end: string) => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const diffMinutes = endMinutes - startMinutes;

    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    }
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] z-50 flex flex-col bg-gradient-to-br from-slate-50 via-white to-sunset-50/30 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-detail-title"
          >
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-slate-200/50 bg-white/95 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2
                    id="activity-detail-title"
                    className="text-xl font-semibold text-slate-900 truncate"
                  >
                    {activity.title}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {formatDate(activity.dayDate)}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Close panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Time Section */}
                <GlassPanel className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-sunset-600" />
                    <span className="text-sm font-medium text-slate-900">Time</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Start</span>
                      <span className="text-sm font-medium text-slate-900">
                        {activity.startTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">End</span>
                      <span className="text-sm font-medium text-slate-900">
                        {activity.endTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-sm text-slate-600">Duration</span>
                      <span className="text-sm font-semibold text-ocean-600">
                        {calculateDuration(activity.startTime, activity.endTime)}
                      </span>
                    </div>
                  </div>
                  {activity.isFlexible && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <GlassBadge color="amber" className="w-full justify-center">
                        <Tag className="w-3 h-3 mr-1" />
                        Flexible Timing
                      </GlassBadge>
                    </div>
                  )}
                </GlassPanel>

                {/* Location Section */}
                {location && (
                  <GlassPanel className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-sunset-600" />
                      <span className="text-sm font-medium text-slate-900">Location</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-slate-900">{location.name}</h4>
                        {location.category && (
                          <span
                            className={`inline-block mt-2 text-xs px-2 py-1 rounded-full border ${
                              categoryColors[location.category] ||
                              'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {location.category}
                          </span>
                        )}
                      </div>

                      {/* Mini Map - Google Maps */}
                      <div className="h-40 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        <GoogleMapComponent
                          defaultCenter={{ lat: location.lat, lng: location.lng }}
                          defaultZoom={14}
                          mapId={mapId}
                          gestureHandling="none"
                          disableDefaultUI={true}
                          zoomControl={false}
                          mapTypeControl={false}
                          fullscreenControl={false}
                          streetViewControl={false}
                          style={{ width: '100%', height: '100%' }}
                        >
                          <AdvancedMarker position={{ lat: location.lat, lng: location.lng }}>
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: '#F97316',
                                borderRadius: '50%',
                                border: '3px solid white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                              }}
                            />
                          </AdvancedMarker>
                        </GoogleMapComponent>
                      </div>

                      <div className="text-xs text-slate-500">
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </div>
                    </div>
                  </GlassPanel>
                )}

                {/* Notes Section */}
                {activity.notes && (
                  <GlassPanel className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-sunset-600" />
                      <span className="text-sm font-medium text-slate-900">Notes</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {activity.notes}
                    </p>
                  </GlassPanel>
                )}

                {/* Empty state for notes */}
                {!activity.notes && canEdit && (
                  <GlassPanel className="p-4 border-dashed">
                    <p className="text-sm text-slate-500 text-center">
                      No notes added yet
                    </p>
                  </GlassPanel>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            {canEdit && (
              <div className="flex-shrink-0 p-4 border-t border-slate-200/50 bg-white/95 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  {onEdit && (
                    <GlassButton
                      variant="default"
                      className="flex-1"
                      onClick={onEdit}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Activity
                    </GlassButton>
                  )}
                  {onDelete && (
                    <GlassButton
                      variant="danger"
                      className="px-4"
                      onClick={() => setShowDeleteConfirm(true)}
                      aria-label="Delete activity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </GlassButton>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setShowDeleteConfirm(false)}
            />

            {/* Confirmation Dialog */}
            <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <GlassPanel className="max-w-sm w-full p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        Delete Activity?
                      </h3>
                      <p className="text-sm text-slate-600">
                        Are you sure you want to delete "{activity.title}"? This action
                        cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <GlassButton
                      variant="default"
                      className="flex-1"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </GlassButton>
                    <GlassButton
                      variant="danger"
                      className="flex-1"
                      onClick={handleDelete}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </GlassButton>
                  </div>
                </GlassPanel>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
