import type { ScheduleItem as ScheduleItemType } from '../data/tripData';

/**
 * Sort schedule items by their order property
 * Items without an order property will be placed at the end
 */
export function sortScheduleItems(items: ScheduleItemType[]): ScheduleItemType[] {
  return [...items].sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
}

/**
 * Sort schedule items by their start time (chronological order)
 * This is used for route visualization to ensure logical travel progression
 * without backtracking caused by manual reordering
 */
export function sortScheduleItemsForRoute(items: ScheduleItemType[]): ScheduleItemType[] {
  return [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));
}
