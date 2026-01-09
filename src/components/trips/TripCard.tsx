import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Share2, Trash2, Calendar, Users, Crown, Edit, Eye, MessageSquare } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import type { Id } from '../../../convex/_generated/dataModel';

interface TripCardProps {
  trip: {
    _id: Id<'trips'>;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    coverImageUrl?: string;
    memberCount: number;
    role: 'owner' | 'editor' | 'commenter' | 'viewer';
  };
  onOpen: (tripId: Id<'trips'>) => void;
  onShare?: (tripId: Id<'trips'>) => void;
  onDelete?: (tripId: Id<'trips'>) => void;
}

export function TripCard({ trip, onOpen, onShare, onDelete }: TripCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current !== null && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  // Format date range nicely
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const endDay = endDate.getDate();
    const year = endDate.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  };

  // Get role badge details
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return { icon: Crown, color: 'sunset', label: 'Owner' };
      case 'editor':
        return { icon: Edit, color: 'blue', label: 'Editor' };
      case 'commenter':
        return { icon: MessageSquare, color: 'purple', label: 'Commenter' };
      case 'viewer':
        return { icon: Eye, color: 'slate', label: 'Viewer' };
      default:
        return { icon: Eye, color: 'slate', label: 'Viewer' };
    }
  };

  const roleBadge = getRoleBadge(trip.role);
  const RoleIcon = roleBadge.icon;

  // Generate gradient if no cover image
  const gradients = [
    'from-sunset-400 via-sunset-500 to-ocean-600',
    'from-pink-400 via-purple-500 to-blue-600',
    'from-green-400 via-emerald-500 to-teal-600',
    'from-amber-400 via-orange-500 to-red-600',
    'from-blue-400 via-cyan-500 to-teal-600',
  ];
  const gradientIndex = trip.name.charCodeAt(0) % gradients.length;

  return (
    <motion.div
      className="group relative w-full h-full min-h-[320px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <button
        onClick={() => { onOpen(trip._id); }}
        className="relative w-full h-full bg-white/95 backdrop-blur-xl border border-slate-200/50 hover:border-slate-300 rounded-2xl overflow-hidden transition-all duration-200 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-300/50 text-left"
        aria-label={`Open trip: ${trip.name}`}
      >
        {/* Cover Image or Gradient */}
        <div className="relative h-40 overflow-hidden">
          {trip.coverImageUrl ? (
            <img
              src={trip.coverImageUrl}
              alt={trip.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradients[gradientIndex]} transition-transform duration-300 group-hover:scale-110`}>
              <div className="absolute inset-0 bg-black/10" />
            </div>
          )}

          {/* Overlay gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

          {/* Role Badge - Top Left */}
          <div className="absolute top-3 left-3">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/95 backdrop-blur-sm border ${
              roleBadge.color === 'sunset' ? 'border-sunset-200 text-sunset-700' :
              roleBadge.color === 'blue' ? 'border-blue-200 text-blue-700' :
              roleBadge.color === 'purple' ? 'border-purple-200 text-purple-700' :
              'border-slate-200 text-slate-700'
            }`}>
              <RoleIcon className="w-3 h-3" />
              {roleBadge.label}
            </div>
          </div>

          {/* Member Count - Top Right with Avatar Stack */}
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-full px-2.5 py-1">
              <div className="flex -space-x-2">
                {[...Array(Math.min(3, trip.memberCount))].map((_, i) => (
                  <div
                    key={`member-avatar-${i}`}
                    className="w-5 h-5 rounded-full bg-gradient-to-br from-sunset-500 to-ocean-600 border-2 border-white flex items-center justify-center"
                  >
                    <Users className="w-2.5 h-2.5 text-white" />
                  </div>
                ))}
              </div>
              {trip.memberCount > 3 && (
                <span className="text-xs font-medium text-slate-600 ml-0.5">
                  +{trip.memberCount - 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Trip Name */}
          <h3 className="text-lg font-semibold text-slate-900 line-clamp-2 mb-2 group-hover:text-sunset-700 transition-colors">
            {trip.name}
          </h3>

          {/* Description */}
          {trip.description && (
            <p className="text-sm text-slate-600 line-clamp-2 mb-3">
              {trip.description}
            </p>
          )}

          {/* Date Range */}
          <div className="flex items-center gap-2 text-sm text-slate-600 mt-auto pt-3 border-t border-slate-100">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>
        </div>
      </button>

      {/* Three-dot menu - only for owners */}
      {(trip.role === 'owner' || onShare) && (
        <div className="absolute top-44 right-3 z-10" ref={menuRef}>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 bg-white/95 backdrop-blur-sm border border-slate-200 hover:border-slate-300 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Trip options"
          >
            <MoreVertical className="w-4 h-4 text-slate-600" />
          </motion.button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-xl shadow-xl overflow-hidden"
              >
                {onShare && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(trip._id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-slate-500" />
                    Share trip
                  </button>
                )}

                {trip.role === 'owner' && onDelete && (
                  <>
                    <div className="border-t border-slate-100" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete "${trip.name}"? This action cannot be undone.`)) {
                          onDelete(trip._id);
                        }
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete trip
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
