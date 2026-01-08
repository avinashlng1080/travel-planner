import { useMutation } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { api } from '../../../convex/_generated/api';
import { type Id } from '../../../convex/_generated/dataModel';
import { GlassPanel, GlassInput } from '../ui/GlassPanel';

export interface EditActivityModalProps {
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
  tripId: Id<'trips'>;
  planId: Id<'tripPlans'>;
  onSuccess?: () => void;
}

interface FormData {
  title: string;
  dayDate: string;
  startTime: string;
  endTime: string;
  notes: string;
  isFlexible: boolean;
}

interface FormErrors {
  title?: string;
  dayDate?: string;
  startTime?: string;
  endTime?: string;
  timeRange?: string;
}

export function EditActivityModal({
  isOpen,
  onClose,
  activity,
  onSuccess
}: EditActivityModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    dayDate: '',
    startTime: '09:00',
    endTime: '11:00',
    notes: '',
    isFlexible: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Convex mutation
  const updateScheduleItem = useMutation(api.tripScheduleItems.updateScheduleItem);

  // Pre-fill form data when activity changes
  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title,
        dayDate: activity.dayDate,
        startTime: activity.startTime,
        endTime: activity.endTime,
        notes: activity.notes || '',
        isFlexible: activity.isFlexible,
      });
    }
  }, [activity]);

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

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form after animation completes
      setTimeout(() => {
        setFormData({
          title: '',
          dayDate: '',
          startTime: '09:00',
          endTime: '11:00',
          notes: '',
          isFlexible: true,
        });
        setErrors({});
      }, 200);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required: Title
    if (!formData.title.trim()) {
      newErrors.title = 'Activity title is required';
    }

    // Required: Date
    if (!formData.dayDate) {
      newErrors.dayDate = 'Date is required';
    }

    // Required: Start Time
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    // Required: End Time
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    // Validation: End time must be after start time
    if (formData.startTime && formData.endTime) {
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      const [endHour, endMinute] = formData.endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      if (endMinutes <= startMinutes) {
        newErrors.timeRange = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activity || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateScheduleItem({
        itemId: activity._id,
        title: formData.title,
        startTime: formData.startTime,
        endTime: formData.endTime,
        notes: formData.notes || undefined,
        isFlexible: formData.isFlexible,
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Failed to update activity:', error);
      // TODO: Show error toast/notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Clear time range error when either time field changes
    if ((field === 'startTime' || field === 'endTime') && errors.timeRange) {
      setErrors(prev => ({ ...prev, timeRange: undefined }));
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
            aria-labelledby="edit-activity-title"
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
                <h2 id="edit-activity-title" className="text-xl font-semibold text-slate-900">
                  Edit Activity
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Update the details of this activity
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Activity Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Activity Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    ref={firstInputRef}
                    type="text"
                    placeholder="Visit Petronas Towers"
                    value={formData.title}
                    onChange={(e) => { handleChange('title', e.target.value); }}
                    className={`w-full bg-white backdrop-blur-lg border rounded-xl px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sunset-500/50 focus:border-sunset-500/50 transition-all duration-200 disabled:opacity-50 ${errors.title ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-200'}`}
                    disabled={isSubmitting}
                    aria-invalid={errors.title ? 'true' : 'false'}
                    aria-describedby={errors.title ? 'title-error' : undefined}
                  />
                  {errors.title && (
                    <p id="title-error" className="mt-1 text-xs text-red-600" role="alert">
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Date (Display Only) */}
                <div>
                  <label htmlFor="dayDate" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Date
                  </label>
                  <GlassInput
                    id="dayDate"
                    type="date"
                    value={formData.dayDate}
                    disabled
                    className="opacity-70 cursor-not-allowed"
                    aria-describedby="dayDate-help"
                  />
                  <p id="dayDate-help" className="mt-1 text-xs text-slate-500">
                    Cannot be changed when editing
                  </p>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Start Time */}
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <GlassInput
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => { handleChange('startTime', e.target.value); }}
                        className={errors.startTime || errors.timeRange ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''}
                        disabled={isSubmitting}
                        aria-invalid={errors.startTime || errors.timeRange ? 'true' : 'false'}
                        aria-describedby={errors.startTime ? 'startTime-error' : errors.timeRange ? 'timeRange-error' : undefined}
                      />
                      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                    </div>
                    {errors.startTime && (
                      <p id="startTime-error" className="mt-1 text-xs text-red-600" role="alert">
                        {errors.startTime}
                      </p>
                    )}
                  </div>

                  {/* End Time */}
                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-slate-700 mb-1.5">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <GlassInput
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => { handleChange('endTime', e.target.value); }}
                        className={errors.endTime || errors.timeRange ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''}
                        disabled={isSubmitting}
                        aria-invalid={errors.endTime || errors.timeRange ? 'true' : 'false'}
                        aria-describedby={errors.endTime ? 'endTime-error' : errors.timeRange ? 'timeRange-error' : undefined}
                      />
                      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                    </div>
                    {errors.endTime && (
                      <p id="endTime-error" className="mt-1 text-xs text-red-600" role="alert">
                        {errors.endTime}
                      </p>
                    )}
                  </div>
                </div>

                {/* Time Range Error */}
                {errors.timeRange && (
                  <p id="timeRange-error" className="text-xs text-red-600 -mt-2" role="alert">
                    {errors.timeRange}
                  </p>
                )}

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="Add any notes or details about this activity..."
                    value={formData.notes}
                    onChange={(e) => { handleChange('notes', e.target.value); }}
                    disabled={isSubmitting}
                    className="w-full bg-white backdrop-blur-lg border border-slate-200 rounded-xl px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sunset-500/50 focus:border-sunset-500/50 transition-all duration-200 resize-none disabled:opacity-50"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Optional details, tips, or reminders
                  </p>
                </div>

                {/* Flexible Checkbox */}
                <div className="flex items-start">
                  <input
                    id="isFlexible"
                    type="checkbox"
                    checked={formData.isFlexible}
                    onChange={(e) => { handleChange('isFlexible', e.target.checked); }}
                    disabled={isSubmitting}
                    className="mt-1 w-4 h-4 text-sunset-500 border-slate-300 rounded focus:ring-sunset-500 focus:ring-offset-0 disabled:opacity-50"
                  />
                  <label htmlFor="isFlexible" className="ml-3 block text-sm text-slate-700">
                    <span className="font-medium">Flexible timing</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      This activity can be rescheduled if needed
                    </p>
                  </label>
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
