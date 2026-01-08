import { useAtom, useSetAtom } from 'jotai';
import { MapPin } from 'lucide-react';

import { panelsAtom, closePanelAtom, toggleMinimizeAtom, updatePositionAtom, bringToFrontAtom } from '../../atoms/floatingPanelAtoms';
import { selectedDayIdAtom } from '../../atoms/uiAtoms';
import { DAILY_PLANS } from '../../data/tripData';
import { DayPlan } from '../Itinerary/DayPlan';
import { FloatingPanel } from '../ui/FloatingPanel';

export function ItineraryPanel() {
  const [panels] = useAtom(panelsAtom);
  const closePanel = useSetAtom(closePanelAtom);
  const toggleMinimize = useSetAtom(toggleMinimizeAtom);
  const updatePosition = useSetAtom(updatePositionAtom);
  const bringToFront = useSetAtom(bringToFrontAtom);
  const [selectedDayId] = useAtom(selectedDayIdAtom);

  const panelState = panels.itinerary;

  // Find the selected day plan
  const selectedDayPlan = DAILY_PLANS.find((p) => p.id === selectedDayId);

  const handleReorder = (plan: 'A' | 'B', itemIds: string[]) => {
    console.log('Reorder:', plan, itemIds);
    // This is where you would update the store or backend with the new order
    // For now, just logging as specified in the requirements
  };

  return (
    <FloatingPanel
      id="itinerary"
      title="Day Itinerary"
      icon={MapPin}
      isOpen={panelState.isOpen}
      isMinimized={panelState.isMinimized}
      position={panelState.position}
      size={{ width: 450, height: 600 }}
      zIndex={panelState.zIndex}
      onClose={() => { closePanel('itinerary'); }}
      onMinimize={() => { toggleMinimize('itinerary'); }}
      onPositionChange={(pos) => { updatePosition({ panelId: 'itinerary', position: pos }); }}
      onFocus={() => { bringToFront('itinerary'); }}
    >
      <div className="p-6">
        {selectedDayPlan ? (
          <DayPlan dayPlan={selectedDayPlan} onReorder={handleReorder} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Day Selected
            </h3>
            <p className="text-sm text-slate-600 max-w-xs">
              Select a day from the map or days panel to view its itinerary
              with drag-and-drop reordering.
            </p>
          </div>
        )}
      </div>
    </FloatingPanel>
  );
}
