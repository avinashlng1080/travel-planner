/**
 * useScheduleReordering Hook
 *
 * Custom React hook for managing drag-and-drop reordering of schedule items.
 * Provides optimistic UI updates and seamless integration with Convex mutations.
 *
 * Features:
 * - Optimistic updates: UI responds immediately to drag operations
 * - Time-based ordering: Reset to chronological order by start time
 * - Manual ordering: Track when user has reordered items
 * - Error handling: Gracefully revert on failure
 * - Full TypeScript support with Convex Id types
 *
 * @param options.planId - The trip plan ID
 * @param options.dayDate - The day date (YYYY-MM-DD format)
 * @param options.scheduleItems - Array of schedule items for the day
 *
 * @returns {Object} Hook state and functions
 * - sortedItems: Schedule items in current order (optimistic or persisted)
 * - handleDragEnd: Callback for drag-and-drop completion
 * - resetToTimeOrder: Reset items to chronological order by start time
 * - isReordering: Whether a reorder mutation is in progress
 * - hasManualOrder: Whether items have been manually reordered
 *
 * @example
 * ```tsx
 * const {
 *   sortedItems,
 *   handleDragEnd,
 *   resetToTimeOrder,
 *   isReordering,
 *   hasManualOrder
 * } = useScheduleReordering({
 *   planId,
 *   dayDate: '2025-12-21',
 *   scheduleItems
 * });
 *
 * // Use with @dnd-kit
 * <DndContext onDragEnd={handleDragEnd}>
 *   {sortedItems.map(item => <ScheduleItem key={item._id} {...item} />)}
 * </DndContext>
 *
 * // Reset to time order
 * <button onClick={resetToTimeOrder}>Reset to time order</button>
 * ```
 */

import { useMutation } from 'convex/react';
import { useState, useCallback, useMemo, useEffect } from 'react';

import { api } from '../../convex/_generated/api';

import type { Id } from '../../convex/_generated/dataModel';

/**
 * Schedule item with location details (from getScheduleItems query)
 */
interface ScheduleItem {
  _id: Id<'tripScheduleItems'>;
  tripId: Id<'trips'>;
  planId: Id<'tripPlans'>;
  dayDate: string;
  locationId?: Id<'tripLocations'>;
  title: string;
  startTime: string;
  endTime: string;
  notes?: string;
  isFlexible: boolean;
  createdBy: Id<'users'>;
  updatedBy?: Id<'users'>;
  createdAt: number;
  updatedAt: number;
  order?: number;
  aiGenerated?: boolean;
  location?: {
    _id: Id<'tripLocations'>;
    name?: string;
    lat?: number;
    lng?: number;
    category?: string;
    description?: string;
    notes?: string;
    baseName?: string;
    baseCategory?: string;
  } | null;
}

/**
 * Hook options
 */
interface UseScheduleReorderingOptions {
  planId: Id<'tripPlans'> | null;
  dayDate: string | null;
  scheduleItems: ScheduleItem[] | undefined;
}

/**
 * Hook return type
 */
interface UseScheduleReorderingReturn {
  sortedItems: ScheduleItem[];
  handleDragEnd: (event: { active: { id: string }; over: { id: string } | null }) => void;
  resetToTimeOrder: () => void;
  isReordering: boolean;
  hasManualOrder: boolean;
}

/**
 * Sort items by start time (chronological order)
 */
function sortByTime(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => {
    // First compare by start time
    const timeCompare = a.startTime.localeCompare(b.startTime);
    if (timeCompare !== 0) {return timeCompare;}

    // If start times are equal, compare by order (undefined orders go last)
    return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
  });
}

/**
 * Sort items by order field (undefined orders go last)
 */
function sortByOrder(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
}

/**
 * Check if items have been manually reordered (order differs from time-based order)
 */
function checkHasManualOrder(items: ScheduleItem[]): boolean {
  if (items.length === 0) {return false;}

  const timeOrdered = sortByTime(items);
  const orderOrdered = sortByOrder(items);

  // Compare the sequences
  for (let i = 0; i < items.length; i++) {
    if (timeOrdered[i]._id !== orderOrdered[i]._id) {
      return true;
    }
  }

  return false;
}

/**
 * Custom hook for schedule item reordering with optimistic updates
 */
export function useScheduleReordering({
  planId,
  dayDate,
  scheduleItems,
}: UseScheduleReorderingOptions): UseScheduleReorderingReturn {
  // Optimistic state for reordered items
  const [optimisticItems, setOptimisticItems] = useState<ScheduleItem[] | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Convex mutation
  const reorderMutation = useMutation(api.tripScheduleItems.reorderScheduleItems);

  // Clear optimistic state when schedule items change from server
  useEffect(() => {
    setOptimisticItems(null);
  }, [scheduleItems]);

  // Compute sorted items (use optimistic if available, otherwise server data)
  const sortedItems = useMemo(() => {
    const items = optimisticItems ?? scheduleItems ?? [];
    return sortByOrder(items);
  }, [optimisticItems, scheduleItems]);

  // Check if items have manual ordering
  const hasManualOrder = useMemo(() => {
    return checkHasManualOrder(scheduleItems ?? []);
  }, [scheduleItems]);

  /**
   * Handle drag-and-drop end event
   */
  const handleDragEnd = useCallback(
    async (event: { active: { id: string }; over: { id: string } | null }) => {
      const { active, over } = event;

      // No-op if dropped outside or on itself
      if (!over || active.id === over.id) {
        return;
      }

      // Validate we have required data
      if (!planId || !dayDate || !scheduleItems || scheduleItems.length === 0) {
        console.error('Cannot reorder: missing planId, dayDate, or scheduleItems');
        return;
      }

      try {
        // Find indices
        const oldIndex = scheduleItems.findIndex(item => item._id === active.id);
        const newIndex = scheduleItems.findIndex(item => item._id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
          console.error('Cannot find item indices for reordering');
          return;
        }

        // Create optimistic reordered array
        const reordered = [...scheduleItems];
        const [movedItem] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, movedItem);

        // Update optimistic state immediately for smooth UI
        setOptimisticItems(reordered);
        setIsReordering(true);

        // Build array of IDs in new order
        const itemIds = reordered.map(item => item._id);

        // Persist to server
        await reorderMutation({
          planId,
          dayDate,
          itemIds,
        });

        // Clear optimistic state (server data will be used)
        setOptimisticItems(null);
      } catch (error) {
        console.error('Failed to reorder schedule items:', error);

        // Revert optimistic update on error
        setOptimisticItems(null);

        // Optionally show error toast/notification here
      } finally {
        setIsReordering(false);
      }
    },
    [planId, dayDate, scheduleItems, reorderMutation]
  );

  /**
   * Reset items to chronological order by start time
   */
  const resetToTimeOrder = useCallback(async () => {
    // Validate we have required data
    if (!planId || !dayDate || !scheduleItems || scheduleItems.length === 0) {
      console.error('Cannot reset order: missing planId, dayDate, or scheduleItems');
      return;
    }

    try {
      setIsReordering(true);

      // Sort by time
      const timeSorted = sortByTime(scheduleItems);

      // Update optimistic state
      setOptimisticItems(timeSorted);

      // Build array of IDs in time order
      const itemIds = timeSorted.map(item => item._id);

      // Persist to server
      await reorderMutation({
        planId,
        dayDate,
        itemIds,
      });

      // Clear optimistic state
      setOptimisticItems(null);
    } catch (error) {
      console.error('Failed to reset to time order:', error);

      // Revert optimistic update on error
      setOptimisticItems(null);
    } finally {
      setIsReordering(false);
    }
  }, [planId, dayDate, scheduleItems, reorderMutation]);

  return {
    sortedItems,
    handleDragEnd,
    resetToTimeOrder,
    isReordering,
    hasManualOrder,
  };
}
