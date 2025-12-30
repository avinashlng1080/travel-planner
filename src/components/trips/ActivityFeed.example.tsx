import { ActivityFeed } from './ActivityFeed';
import { Id } from '../../../convex/_generated/dataModel';

/**
 * Example: Activity Feed in Sidebar (Compact Mode)
 *
 * Use this in a sidebar or panel where space is limited.
 * Shows the 5 most recent activities with a "View all" link.
 */
export function ActivityFeedSidebarExample() {
  // In a real app, you would get this from a route parameter or context
  const tripId = 'j973kd8s3m5n6p7q8r9s0t1u2v3w4x5y' as Id<'trips'>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900">Trip Overview</h2>

      {/* Compact Activity Feed */}
      <ActivityFeed tripId={tripId} compact={true} />
    </div>
  );
}

/**
 * Example: Full Activity Feed Page
 *
 * Use this for a dedicated activity page showing all events.
 * Shows up to 50 activities by default.
 */
export function ActivityFeedFullPageExample() {
  const tripId = 'j973kd8s3m5n6p7q8r9s0t1u2v3w4x5y' as Id<'trips'>; // Replace with actual trip ID

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Activity</h1>
        <p className="text-slate-600 mt-2">See what's happening with your trip planning</p>
      </div>

      {/* Full Activity Feed */}
      <ActivityFeed tripId={tripId} compact={false} limit={100} />
    </div>
  );
}

/**
 * Example: Activity Feed in a Tab
 *
 * Use this within a tabbed interface.
 */
export function ActivityFeedTabExample() {
  const tripId = 'j973kd8s3m5n6p7q8r9s0t1u2v3w4x5y' as Id<'trips'>; // Replace with actual trip ID

  return (
    <div className="space-y-4">
      {/* Tab Navigation would go here */}

      <ActivityFeed tripId={tripId} compact={false} limit={30} />
    </div>
  );
}

/**
 * Example: Multiple Activity Feeds
 *
 * Show activity feeds for multiple trips side by side.
 */
export function MultipleActivityFeedsExample() {
  const tripId1 = 'j973kd8s3m5n6p7q8r9s0t1u2v3w4x5y' as Id<'trips'>;
  const tripId2 = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6' as Id<'trips'>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Malaysia Trip</h2>
        <ActivityFeed tripId={tripId1} compact={true} />
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Japan Trip</h2>
        <ActivityFeed tripId={tripId2} compact={true} />
      </div>
    </div>
  );
}

/**
 * Example: Activity Feed with Custom Limit
 *
 * Control how many activities to show.
 */
export function ActivityFeedCustomLimitExample() {
  const tripId = 'j973kd8s3m5n6p7q8r9s0t1u2v3w4x5y' as Id<'trips'>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Recent Activity (Last 10)</h2>

      <ActivityFeed tripId={tripId} compact={false} limit={10} />
    </div>
  );
}
