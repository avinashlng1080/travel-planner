import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import type { DayPlan as DayPlanType, ScheduleItem as ScheduleItemType, Location } from '../../data/tripData';
import { PlanColumn } from './PlanColumn';
import { ScheduleItem } from './ScheduleItem';

interface PlanBuilderProps {
  dayPlan: DayPlanType;
  locations?: Location[];
}

export function PlanBuilder({ dayPlan, locations = [] }: PlanBuilderProps) {
  // Local state for optimistic updates
  const [planAItems, setPlanAItems] = useState<ScheduleItemType[]>(dayPlan.planA);
  const [planBItems, setPlanBItems] = useState<ScheduleItemType[]>(dayPlan.planB);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeContainer, setActiveContainer] = useState<'A' | 'B' | null>(null);

  // Sync local state with props when dayPlan changes
  useEffect(() => {
    setPlanAItems(dayPlan.planA);
    setPlanBItems(dayPlan.planB);
  }, [dayPlan.planA, dayPlan.planB]);

  // Sensors for drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 12 },
    })
  );

  // Find which container an item is in
  const findContainer = useCallback(
    (id: UniqueIdentifier): 'A' | 'B' | null => {
      if (planAItems.some((item) => item.id === id)) return 'A';
      if (planBItems.some((item) => item.id === id)) return 'B';
      // Check if it's a droppable container ID
      if (id === 'droppable-A') return 'A';
      if (id === 'droppable-B') return 'B';
      return null;
    },
    [planAItems, planBItems]
  );

  // Get active item for overlay
  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return [...planAItems, ...planBItems].find((item) => item.id === activeId);
  }, [activeId, planAItems, planBItems]);

  // Get location for an item
  const getLocation = (locationId: string) => {
    return locations.find((loc) => loc.id === locationId);
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    const container = findContainer(active.id);
    setActiveContainer(container);
  };

  // Handle drag over (for cross-container)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    let overContainer = findContainer(over.id);

    // If over a droppable zone, get its container
    if (over.id === 'droppable-A') overContainer = 'A';
    if (over.id === 'droppable-B') overContainer = 'B';

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Moving between containers - optimistic update
    const activeItems = activeContainer === 'A' ? planAItems : planBItems;
    const overItems = overContainer === 'A' ? planAItems : planBItems;

    const activeIndex = activeItems.findIndex((item) => item.id === active.id);
    const overIndex = overItems.findIndex((item) => item.id === over.id);

    const movedItem = activeItems[activeIndex];
    if (!movedItem) return;

    // Determine insert position
    let newIndex = overIndex >= 0 ? overIndex : overItems.length;

    // Update local state
    if (activeContainer === 'A') {
      setPlanAItems((items) => items.filter((item) => item.id !== active.id));
      setPlanBItems((items) => [
        ...items.slice(0, newIndex),
        movedItem,
        ...items.slice(newIndex),
      ]);
    } else {
      setPlanBItems((items) => items.filter((item) => item.id !== active.id));
      setPlanAItems((items) => [
        ...items.slice(0, newIndex),
        movedItem,
        ...items.slice(newIndex),
      ]);
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveContainer(null);

    if (!over) return;

    const activeContainer = findContainer(active.id);
    let overContainer = findContainer(over.id);

    // If over a droppable zone
    if (over.id === 'droppable-A') overContainer = 'A';
    if (over.id === 'droppable-B') overContainer = 'B';

    if (!activeContainer || !overContainer) return;

    // Reordering within same container
    if (activeContainer === overContainer) {
      const items = overContainer === 'A' ? planAItems : planBItems;
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex !== newIndex && newIndex >= 0) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        if (overContainer === 'A') {
          setPlanAItems(reordered);
        } else {
          setPlanBItems(reordered);
        }
      }
    }

    // Note: Cross-container moves already handled in handleDragOver
    // Here we would persist to Convex if we had real IDs
    // For now, local state is the source of truth
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 h-full min-h-[400px]">
        <PlanColumn
          planType="A"
          items={planAItems}
          locations={locations}
          isOver={activeContainer === 'B'}
        />
        <PlanColumn
          planType="B"
          items={planBItems}
          locations={locations}
          isOver={activeContainer === 'A'}
        />
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeItem ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1.02, opacity: 1 }}
            className="shadow-2xl rounded-xl"
          >
            <ScheduleItem
              item={activeItem}
              locationName={getLocation(activeItem.locationId)?.name}
              locationCategory={getLocation(activeItem.locationId)?.category}
              location={getLocation(activeItem.locationId)}
              isDragging
            />
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
