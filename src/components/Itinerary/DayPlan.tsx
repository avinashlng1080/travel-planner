import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Calendar, AlertCircle, Droplets } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';


import { DraggableItem } from './DraggableItem';
import { useWeather } from '../../hooks/useWeather';
import { WeatherIcon } from '../weather';

import type { DayPlan as DayPlanType, Location } from '../../data/tripData';

interface DayPlanProps {
  dayPlan: DayPlanType;
  locations?: Location[];
  onReorder?: (plan: 'A' | 'B', itemIds: string[]) => void;
  onActivityClick?: (activityId: string) => void;
}

export function DayPlan({ dayPlan, locations = [], onReorder, onActivityClick }: DayPlanProps) {
  const [selectedPlan, setSelectedPlan] = useState<'A' | 'B'>('A');
  const [localPlanA, setLocalPlanA] = useState(dayPlan.planA);
  const [localPlanB, setLocalPlanB] = useState(dayPlan.planB);

  // Sync local state with props when dayPlan changes
  useEffect(() => {
    setLocalPlanA(dayPlan.planA);
    setLocalPlanB(dayPlan.planB);
  }, [dayPlan.planA, dayPlan.planB]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const currentPlan = selectedPlan === 'A' ? localPlanA : localPlanB;

  // Sort items by order field (undefined orders go last)
  const sortedItems = useMemo(() => {
    const sorted = [...currentPlan].sort((a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
    );
    return sorted;
  }, [currentPlan, dayPlan.date, selectedPlan]);

  const itemIds = sortedItems.map((item) => item.id);

  // Handle drag-and-drop reordering
  const handleDragEnd = (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    const { active, over } = event;

    // No-op if dropped outside or on itself
    if (!over || active.id === over.id) {
      return;
    }

    // Find indices in the sorted items
    const oldIndex = sortedItems.findIndex(item => item.id === active.id);
    const newIndex = sortedItems.findIndex(item => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Create reordered array
    const reordered = [...sortedItems];
    const [movedItem] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, movedItem);

    // Update local state immediately for smooth UI
    const updatedPlan = reordered.map((item, index) => ({
      ...item,
      order: index,
    }));

    if (selectedPlan === 'A') {
      setLocalPlanA(updatedPlan);
    } else {
      setLocalPlanB(updatedPlan);
    }

    // Call the onReorder callback with the new item IDs in order
    if (onReorder) {
      onReorder(selectedPlan, updatedPlan.map(item => item.id));
    }
  };

  const getLocation = (locationId: string) => {
    return locations.find((loc) => loc.id === locationId);
  };

  // Get live weather data
  const { daily: weatherForecast } = useWeather();

  // Find weather forecast for this specific day
  const dayWeather = useMemo(() => {
    if (!weatherForecast.length) {return null;}
    return weatherForecast.find((f) => f.date === dayPlan.date) || null;
  }, [weatherForecast, dayPlan.date]);

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
          {dayWeather ? (
            <div className="flex items-center gap-2">
              <WeatherIcon condition={dayWeather.condition} size={18} />
              <span className="text-sm font-medium text-slate-700">
                {Math.round(dayWeather.tempMax)}°
              </span>
              {dayWeather.precipitationProbability > 20 && (
                <span className="flex items-center gap-1 text-sm text-blue-500">
                  <Droplets size={14} />
                  {Math.round(dayWeather.precipitationProbability)}%
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-slate-400">Loading weather...</span>
          )}
        </div>
        <h4 className="text-lg text-slate-600">{dayPlan.title}</h4>
      </div>

      {dayPlan.planB.length > 0 && (
        <div className="flex gap-2 mb-6" role="tablist" aria-label="Day plan options">
          <button
            id={`plan-a-tab-${dayPlan.date}`}
            role="tab"
            aria-selected={selectedPlan === 'A'}
            aria-controls={`plan-content-${dayPlan.date}`}
            onClick={() => { setSelectedPlan('A'); }}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
              selectedPlan === 'A'
                ? 'bg-green-600 text-white shadow-lg shadow-green-900/50'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Plan A - Main
          </button>
          <button
            id={`plan-b-tab-${dayPlan.date}`}
            role="tab"
            aria-selected={selectedPlan === 'B'}
            aria-controls={`plan-content-${dayPlan.date}`}
            onClick={() => { setSelectedPlan('B'); }}
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
          <div
            id={`plan-content-${dayPlan.date}`}
            role="tabpanel"
            aria-labelledby={`plan-${selectedPlan.toLowerCase()}-tab-${dayPlan.date}`}
            className="space-y-3"
          >
            {sortedItems.length > 0 ? (
              sortedItems.map((item) => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  location={getLocation(item.locationId)}
                  planType={selectedPlan}
                  onClick={() => onActivityClick?.(item.id)}
                />
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
