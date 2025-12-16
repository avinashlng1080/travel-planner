/**
 * ActivityDetailPanel Usage Example
 *
 * This example demonstrates how to integrate the ActivityDetailPanel
 * into the TripViewPage to display activity details when clicking
 * a schedule item.
 */

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { ActivityDetailPanel } from './ActivityDetailPanel';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

// Example integration in TripViewPage.tsx:

export function TripViewPageExample({ planId, userRole }: {
  planId: Id<'tripPlans'>;
  userRole: 'owner' | 'editor' | 'commenter' | 'viewer';
}) {
  // State for selected activity
  const [selectedActivityId, setSelectedActivityId] = useState<Id<'tripScheduleItems'> | null>(null);

  // Fetch all schedule items for the plan
  const scheduleItems = useQuery(api.tripScheduleItems.getScheduleItems, { planId });

  // Find the selected activity from the schedule items
  const selectedActivity = scheduleItems?.find(item => item._id === selectedActivityId) || null;

  // Location is already included in the schedule item response from Convex
  const location = selectedActivity?.location || undefined;

  // Delete mutation
  const deleteActivity = useMutation(api.tripScheduleItems.deleteScheduleItem);

  // Handle edit
  const handleEdit = () => {
    console.log('Edit activity:', selectedActivityId);
    // Open edit modal or navigate to edit page
    // For now, close the detail panel
    setSelectedActivityId(null);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedActivityId) return;

    try {
      await deleteActivity({ itemId: selectedActivityId });
      setSelectedActivityId(null);
      // Show success toast
      console.log('Activity deleted successfully');
    } catch (error) {
      console.error('Failed to delete activity:', error);
      // Show error toast
    }
  };

  return (
    <div>
      {/* Your existing schedule items list */}
      <div className="space-y-3">
        {/* Example schedule item card - modify your existing implementation */}
        <div
          className="p-4 bg-white/50 hover:bg-white/80 rounded-xl transition-colors cursor-pointer"
          onClick={() => {
            // When clicking a schedule item, set the selectedActivityId
            // setSelectedActivityId(item._id);
          }}
        >
          {/* Schedule item content */}
        </div>
      </div>

      {/* Activity Detail Panel */}
      <ActivityDetailPanel
        isOpen={!!selectedActivityId}
        onClose={() => setSelectedActivityId(null)}
        activity={selectedActivity || null}
        location={location ? {
          name: location.name,
          lat: location.lat,
          lng: location.lng,
          category: location.category,
        } : undefined}
        userRole={userRole}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

/**
 * Integration Steps:
 *
 * 1. In TripViewPage.tsx, add state for selected activity:
 *    const [selectedActivityId, setSelectedActivityId] = useState<Id<'tripScheduleItems'> | null>(null);
 *
 * 2. Find the selected activity from your existing scheduleItems query:
 *    const selectedActivity = scheduleItems?.find(item => item._id === selectedActivityId) || null;
 *    const location = selectedActivity?.location || undefined;
 *
 *    Note: The location data is already included in the scheduleItems response from Convex
 *
 * 3. Update the schedule item onClick handler (around line 425):
 *    onClick={() => setSelectedActivityId(item._id)}
 *
 * 4. Add the ActivityDetailPanel component before the closing tag:
 *    <ActivityDetailPanel
 *      isOpen={!!selectedActivityId}
 *      onClose={() => setSelectedActivityId(null)}
 *      activity={selectedActivity}
 *      location={location}
 *      userRole={userRole}
 *      onEdit={() => {
 *        // TODO: Open edit modal or handle edit
 *        setSelectedActivityId(null);
 *      }}
 *      onDelete={async () => {
 *        // Call delete mutation
 *        if (selectedActivityId) {
 *          await deleteActivity({ itemId: selectedActivityId });
 *          setSelectedActivityId(null);
 *        }
 *      }}
 *    />
 *
 * 5. Import the component:
 *    import { ActivityDetailPanel } from '../components/trips/ActivityDetailPanel';
 *
 * 6. Import the delete mutation:
 *    const deleteActivity = useMutation(api.tripScheduleItems.deleteScheduleItem);
 */
