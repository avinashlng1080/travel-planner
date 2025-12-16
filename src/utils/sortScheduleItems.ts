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
