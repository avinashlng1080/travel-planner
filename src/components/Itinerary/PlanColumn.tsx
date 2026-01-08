import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { DraggableItem } from './DraggableItem';

import type { ScheduleItem as ScheduleItemType, Location } from '../../data/tripData';

interface PlanColumnProps {
  planType: 'A' | 'B';
  items: ScheduleItemType[];
  locations: Location[];
  isOver?: boolean;
}

const PLAN_STYLES = {
  A: {
    header: 'from-green-500 to-emerald-500',
    headerText: 'Plan A',
    subText: 'Main Itinerary',
    border: 'border-green-500/30',
    dropZone: 'border-green-400 bg-green-50/50',
    badge: 'bg-green-100 text-green-700',
  },
  B: {
    header: 'from-blue-500 to-cyan-500',
    headerText: 'Plan B',
    subText: 'Alternative',
    border: 'border-blue-500/30',
    dropZone: 'border-blue-400 bg-blue-50/50',
    badge: 'bg-blue-100 text-blue-700',
  },
};

export function PlanColumn({ planType, items, locations, isOver }: PlanColumnProps) {
  const styles = PLAN_STYLES[planType];
  const itemIds = items.map((item) => item.id);

  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id: `droppable-${planType}`,
    data: { planType },
  });

  const getLocation = (locationId: string) => {
    return locations.find((loc) => loc.id === locationId);
  };

  const showDropIndicator = isOver || isDroppableOver;

  return (
    <div className="flex flex-col h-full min-w-0 flex-1">
      {/* Header */}
      <div className={`bg-gradient-to-r ${styles.header} px-3 py-2 rounded-t-xl`}>
        <h3 className="text-sm font-semibold text-white">{styles.headerText}</h3>
        <p className="text-[10px] text-white/80">{styles.subText}</p>
      </div>

      {/* Items Container */}
      <motion.div
        ref={setNodeRef}
        animate={{
          borderColor: showDropIndicator ? (planType === 'A' ? 'rgba(16, 185, 129, 1)' : 'rgba(59, 130, 246, 1)') : 'rgba(226, 232, 240, 1)',
          backgroundColor: showDropIndicator ? (planType === 'A' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(59, 130, 246, 0.05)') : 'rgba(255, 255, 255, 0)',
        }}
        transition={{
          duration: 0.15,
          ease: 'easeInOut',
          borderColor: { duration: 0.15 },
          backgroundColor: { duration: 0.15 }
        }}
        className={`
          flex-1 p-2 rounded-b-xl border-2 border-t-0
          ${showDropIndicator ? 'border-dashed' : 'border-slate-200'}
          overflow-y-auto min-h-[300px] md:min-h-[200px]
        `}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.length > 0 ? (
              items.map((item) => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  location={getLocation(item.locationId)}
                  planType={planType}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`
                  flex flex-col items-center justify-center py-8
                  border-2 border-dashed rounded-xl
                  ${showDropIndicator ? styles.dropZone : 'border-slate-200 bg-slate-50/50'}
                  transition-colors duration-200
                `}
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2
                  ${showDropIndicator ? styles.badge : 'bg-slate-100'}
                `}>
                  <Plus className={`w-5 h-5 ${showDropIndicator ? '' : 'text-slate-400'}`} />
                </div>
                <p className="text-xs text-slate-500 text-center px-4">
                  {showDropIndicator
                    ? 'Drop activity here'
                    : 'Drag activities here'}
                </p>
              </motion.div>
            )}
          </div>
        </SortableContext>

        {/* Drop zone at bottom when has items */}
        {items.length > 0 && showDropIndicator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`
              mt-2 py-4 border-2 border-dashed rounded-xl
              flex items-center justify-center
              ${styles.dropZone}
            `}
          >
            <p className="text-xs text-slate-500">Drop here to add</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
