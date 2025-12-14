import { useState } from 'react';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Calendar, CloudRain, Sun, AlertCircle } from 'lucide-react';
import { LOCATIONS } from '../../data/tripData';
import type { DayPlan as DayPlanType } from '../../data/tripData';
import { DraggableItem } from './DraggableItem';

interface DayPlanProps {
  dayPlan: DayPlanType;
  onReorder?: (plan: 'A' | 'B', itemIds: string[]) => void;
}

export function DayPlan({ dayPlan, onReorder }: DayPlanProps) {
  const [selectedPlan, setSelectedPlan] = useState<'A' | 'B'>('A');
  const [localPlanA, setLocalPlanA] = useState(dayPlan.planA);
  const [localPlanB, setLocalPlanB] = useState(dayPlan.planB);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const currentPlan = selectedPlan === 'A' ? localPlanA : localPlanB;
  const itemIds = currentPlan.map((item) => item.id);

  const getLocation = (locationId: string) => {
    return LOCATIONS.find((loc) => loc.id === locationId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const plan = selectedPlan === 'A' ? localPlanA : localPlanB;
      const oldIndex = plan.findIndex((item) => item.id === active.id);
      const newIndex = plan.findIndex((item) => item.id === over.id);

      const reordered = arrayMove(plan, oldIndex, newIndex);

      if (selectedPlan === 'A') {
        setLocalPlanA(reordered);
      } else {
        setLocalPlanB(reordered);
      }

      if (onReorder) {
        onReorder(selectedPlan, reordered.map((item) => item.id));
      }
    }
  };

  const weatherIcon = dayPlan.weatherConsideration === 'outdoor-heavy' ? (
    <Sun className="w-4 h-4" />
  ) : dayPlan.weatherConsideration === 'indoor-heavy' ? (
    <CloudRain className="w-4 h-4" />
  ) : (
    <Sun className="w-4 h-4" />
  );

  const weatherColor =
    dayPlan.weatherConsideration === 'outdoor-heavy'
      ? 'text-amber-500'
      : dayPlan.weatherConsideration === 'indoor-heavy'
      ? 'text-blue-500'
      : 'text-slate-500';

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-sunset-500" />
            <h3 className="text-xl font-semibold text-slate-900">
              {dayPlan.dayOfWeek}, {new Date(dayPlan.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </h3>
          </div>
          <div className={`flex items-center gap-2 ${weatherColor}`}>
            {weatherIcon}
            <span className="text-sm capitalize">
              {dayPlan.weatherConsideration.replace('-', ' ')}
            </span>
          </div>
        </div>
        <h4 className="text-lg text-slate-600">{dayPlan.title}</h4>
      </div>

      {dayPlan.planB.length > 0 && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedPlan('A')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
              selectedPlan === 'A'
                ? 'bg-green-600 text-white shadow-lg shadow-green-900/50'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Plan A - Main
          </button>
          <button
            onClick={() => setSelectedPlan('B')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
              selectedPlan === 'B'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Plan B - Alternative
          </button>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {currentPlan.length > 0 ? (
              currentPlan.map((item) => (
                <DraggableItem key={item.id} item={item} location={getLocation(item.locationId)} />
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                No activities planned for this option
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {dayPlan.notes.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
            <h5 className="text-sm font-medium text-cyan-500">Important Notes</h5>
          </div>
          <ul className="space-y-1.5 text-sm text-slate-600">
            {dayPlan.notes.map((note, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-cyan-600 mt-1">-</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
