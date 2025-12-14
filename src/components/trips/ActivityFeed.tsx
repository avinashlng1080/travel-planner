import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ArrowRight,
  MapPin,
  Calendar,
  MessageSquare,
  CheckCircle,
  UserPlus,
  FileText,
  Plus,
  Edit,
  Trash,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Avatar } from '../ui/Avatar';
import { GlassPanel, GlassButton } from '../ui/GlassPanel';

interface ActivityFeedProps {
  tripId: Id<'trips'>;
  limit?: number;
  compact?: boolean;
}

// Action type mappings for readable text
const ACTION_LABELS: Record<string, string> = {
  created_trip: 'created this trip',
  updated_trip: 'updated trip details',
  invited_member: 'invited a new member',
  joined_trip: 'joined the trip',
  created_plan: 'created a new plan',
  updated_plan: 'updated a plan',
  added_activity: 'added an activity',
  updated_activity: 'updated an activity',
  deleted_activity: 'removed an activity',
  added_comment: 'added a comment',
  resolved_comment: 'resolved a comment',
};

// Action type icon mappings
const ACTION_ICONS: Record<string, typeof Clock> = {
  created_trip: FileText,
  updated_trip: Edit,
  invited_member: UserPlus,
  joined_trip: UserPlus,
  created_plan: Plus,
  updated_plan: Edit,
  added_activity: MapPin,
  updated_activity: Edit,
  deleted_activity: Trash,
  added_comment: MessageSquare,
  resolved_comment: CheckCircle,
};

// Action type color mappings
const ACTION_COLORS: Record<string, string> = {
  created_trip: 'text-sunset-600 bg-sunset-50',
  updated_trip: 'text-blue-600 bg-blue-50',
  invited_member: 'text-purple-600 bg-purple-50',
  joined_trip: 'text-green-600 bg-green-50',
  created_plan: 'text-ocean-600 bg-ocean-50',
  updated_plan: 'text-blue-600 bg-blue-50',
  added_activity: 'text-green-600 bg-green-50',
  updated_activity: 'text-blue-600 bg-blue-50',
  deleted_activity: 'text-red-600 bg-red-50',
  added_comment: 'text-amber-600 bg-amber-50',
  resolved_comment: 'text-green-600 bg-green-50',
};

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffInMs = now - timestamp;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}

/**
 * Activity item component
 */
function ActivityItem({
  activity,
  isFirst,
}: {
  activity: any;
  isFirst: boolean;
}) {
  const Icon = ACTION_ICONS[activity.action] || Clock;
  const colorClass = ACTION_COLORS[activity.action] || 'text-slate-600 bg-slate-50';

  // Extract action description from formattedMessage or fallback to ACTION_LABELS
  const actionDescription =
    activity.formattedMessage || ACTION_LABELS[activity.action] || 'performed an action';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="relative flex items-start gap-3"
    >
      {/* Timeline Line */}
      {!isFirst && (
        <div className="absolute left-4 top-0 w-0.5 h-full -translate-y-full bg-gradient-to-b from-slate-200 to-transparent" />
      )}

      {/* Icon */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass} relative z-10`}
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {activity.user && (
              <>
                <Avatar
                  name={activity.user.name}
                  imageUrl={activity.user.avatarUrl}
                  size="sm"
                  className="w-6 h-6"
                />
                <span className="font-medium text-slate-900 text-sm">
                  {activity.user.name}
                </span>
              </>
            )}
            <span className="text-sm text-slate-600">{actionDescription}</span>
          </div>

          {/* Timestamp */}
          <time className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0">
            {formatRelativeTime(activity.createdAt)}
          </time>
        </div>

        {/* Optional metadata display */}
        {activity.metadata?.description && (
          <p className="text-sm text-slate-500 mt-1 ml-8">
            {activity.metadata.description}
          </p>
        )}

        {/* Link to affected item if applicable */}
        {activity.targetId && activity.targetType && (
          <button
            onClick={() => {
              // Navigate to affected item - implement navigation logic as needed
              console.log('Navigate to:', activity.targetType, activity.targetId);
            }}
            className="inline-flex items-center gap-1 text-xs text-ocean-600 hover:text-ocean-700 mt-1 ml-8 group"
          >
            <span>View {activity.targetType}</span>
            <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ compact }: { compact: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`text-center ${compact ? 'py-6' : 'py-12'}`}
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
        <Clock className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-slate-600 font-medium">No activity yet</p>
      <p className="text-sm text-slate-500 mt-1">
        Activity will appear here as you and your team collaborate
      </p>
    </motion.div>
  );
}

/**
 * Loading skeleton component
 */
function LoadingSkeleton({ compact }: { compact: boolean }) {
  const count = compact ? 3 : 8;

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ActivityFeed component - Shows recent collaboration activity on a trip
 */
export function ActivityFeed({ tripId, limit = 50, compact = false }: ActivityFeedProps) {
  // Fetch activity data
  const activities = useQuery(api.tripActivity.getRecentActivity, {
    tripId,
    limit: compact ? 5 : limit,
  });

  // Determine display limit based on compact mode
  const displayLimit = useMemo(() => {
    if (!compact) return limit;
    return 5;
  }, [compact, limit]);

  // Filter activities to display limit
  const displayedActivities = useMemo(() => {
    if (!activities) return [];
    return activities.slice(0, displayLimit);
  }, [activities, displayLimit]);

  const hasMoreActivities = activities && activities.length > displayLimit;

  // Loading state
  if (activities === undefined) {
    return (
      <GlassPanel className={compact ? 'p-4' : 'p-6'}>
        <LoadingSkeleton compact={compact} />
      </GlassPanel>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <GlassPanel className={compact ? 'p-4' : 'p-6'}>
        <EmptyState compact={compact} />
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className={compact ? 'p-4' : 'p-6'}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Activity Feed</h2>
          </div>
          <span className="text-sm text-slate-500">
            {activities.length} {activities.length === 1 ? 'event' : 'events'}
          </span>
        </div>
      )}

      {/* Activity List */}
      <div className={`space-y-4 ${compact ? 'max-h-[400px] overflow-y-auto' : ''}`}>
        <AnimatePresence mode="popLayout">
          {displayedActivities.map((activity, index) => (
            <ActivityItem
              key={activity._id}
              activity={activity}
              isFirst={index === 0}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* View All Link (Compact Mode) */}
      {compact && hasMoreActivities && (
        <div className="mt-4 pt-4 border-t border-slate-200/50">
          <GlassButton
            variant="default"
            size="sm"
            className="w-full"
            onClick={() => {
              // Navigate to full activity page - implement navigation logic as needed
              console.log('Navigate to full activity page');
            }}
          >
            <span>View all activity</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </GlassButton>
        </div>
      )}

      {/* Load More (Full Mode) */}
      {!compact && hasMoreActivities && (
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Showing {displayLimit} of {activities.length} events
          </p>
        </div>
      )}
    </GlassPanel>
  );
}
