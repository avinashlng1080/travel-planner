import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Clock } from 'lucide-react';
import { GlassButton } from './GlassPanel';
import type { DayPlan, ScheduleItem } from '../../data/tripData';

interface AddToPlanModalProps {
  isOpen: boolean;
  locationName: string;
  planType: 'A' | 'B';
  days: DayPlan[];
  currentDayId: string | null;
  onClose: () => void;
  onAdd: (details: {
    dayId: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) => void;
}

export function AddToPlanModal({
  isOpen,
  locationName,
  planType,
  days,
  currentDayId,
  onClose,
  onAdd,
}: AddToPlanModalProps) {
  // Default to current day or first day
  const defaultDayId = currentDayId || days[0]?.id || '';
  const [selectedDayId, setSelectedDayId] = useState(defaultDayId);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [notes, setNotes] = useState('');

  // Get selected day's plan to suggest next time slot
  const selectedDay = useMemo(() => {
    return days.find(d => d.id === selectedDayId);
  }, [days, selectedDayId]);

  // Suggest next available time based on existing items
  useMemo(() => {
    if (!selectedDay) return;

    const items: ScheduleItem[] = planType === 'A' ? selectedDay.planA : selectedDay.planB;
    if (items.length === 0) {
      setStartTime('10:00');
      setEndTime('11:00');
      return;
    }

    // Find the last item's end time
    const lastItem = items[items.length - 1];
    if (lastItem?.endTime) {
      // Add 30 min buffer after last item
      const [hours, minutes] = lastItem.endTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes + 30;
      const newStartHours = Math.floor(startMinutes / 60);
      const newStartMins = startMinutes % 60;

      if (newStartHours < 20) { // Don't suggest times after 8 PM
        const newStart = `${String(newStartHours).padStart(2, '0')}:${String(newStartMins).padStart(2, '0')}`;
        const endMinutes = startMinutes + 60; // 1 hour duration
        const newEndHours = Math.floor(endMinutes / 60);
        const newEndMins = endMinutes % 60;
        const newEnd = `${String(newEndHours).padStart(2, '0')}:${String(newEndMins).padStart(2, '0')}`;

        setStartTime(newStart);
        setEndTime(newEnd);
      }
    }
  }, [selectedDay, planType]);

  const handleSubmit = () => {
    onAdd({
      dayId: selectedDayId,
      startTime,
      endTime,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  // Format day option label
  const formatDayLabel = (day: DayPlan) => {
    const date = new Date(day.date);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = date.getDate();
    return `${day.dayOfWeek}, ${month} ${dayNum} - ${day.title}`;
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-4 ${planType === 'A' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Add to Plan {planType}
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Location Name */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className={`p-2 rounded-lg ${planType === 'A' ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
                    <MapPin className={`w-5 h-5 ${planType === 'A' ? 'text-emerald-600' : 'text-indigo-600'}`} />
                  </div>
                  <span className="font-medium text-slate-900 truncate">{locationName}</span>
                </div>

                {/* Day Selector */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Calendar className="w-4 h-4" />
                    Day
                  </label>
                  <select
                    value={selectedDayId}
                    onChange={(e) => setSelectedDayId(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  >
                    {days.map((day) => (
                      <option key={day.id} value={day.id}>
                        {formatDayLabel(day)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Pickers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Clock className="w-4 h-4" />
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Clock className="w-4 h-4" />
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special notes for this activity..."
                    rows={2}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <GlassButton
                  className="flex-1"
                  onClick={onClose}
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  className="flex-1"
                  variant={planType === 'A' ? 'success' : 'primary'}
                  onClick={handleSubmit}
                >
                  Add to Plan {planType}
                </GlassButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
