import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { ScheduleItem } from './ScheduleItem';
import type { ScheduleItem as ScheduleItemType, Location } from '../../data/tripData';

interface DraggableItemProps {
  item: ScheduleItemType;
  location?: Location;
}

export function DraggableItem({ item, location }: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${isDragging ? 'z-50' : 'z-0'}`}
    >
      <div
        {...attributes}
        {...listeners}
        className={`
          absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center
          cursor-grab active:cursor-grabbing
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          ${isDragging ? 'opacity-100' : ''}
        `}
      >
        <GripVertical className="w-5 h-5 text-slate-500" />
      </div>

      <div className="ml-8">
        <ScheduleItem
          item={item}
          locationName={location?.name}
          locationCategory={location?.category}
          location={location}
          isDragging={isDragging}
        />
      </div>
    </div>
  );
}
