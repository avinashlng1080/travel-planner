import { useState } from 'react';
import { CheckSquare } from 'lucide-react';
import { FloatingPanel } from '../ui/FloatingPanel';
import { ChecklistPanel } from '../checklist/ChecklistPanel';
import { useAtom, useSetAtom } from 'jotai';
import {
  panelsAtom,
  closePanelAtom,
  toggleMinimizeAtom,
  updatePositionAtom,
  bringToFrontAtom,
} from '../../atoms/floatingPanelAtoms';
import { FileText, Heart, Briefcase, Package } from 'lucide-react';
import { useResponsivePanel } from '../../hooks/useResponsivePanel';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface ChecklistCategory {
  id: 'visa' | 'health' | 'documents' | 'packing';
  name: string;
  icon: React.ElementType;
  color: string;
  items: ChecklistItem[];
}

const DEFAULT_CHECKLISTS: ChecklistCategory[] = [
  {
    id: 'visa',
    name: 'Visa & Entry',
    icon: FileText,
    color: '#8B5CF6',
    items: [
      { id: 'v1', text: 'Valid passport (6+ months validity)', checked: false },
      { id: 'v2', text: 'Malaysia visa requirements checked', checked: false },
      { id: 'v3', text: 'Return flight tickets booked', checked: false },
      { id: 'v4', text: 'Hotel booking confirmations saved', checked: false },
    ],
  },
  {
    id: 'health',
    name: 'Health & Vaccinations',
    icon: Heart,
    color: '#EF4444',
    items: [
      { id: 'h1', text: 'Travel insurance purchased', checked: false },
      { id: 'h2', text: 'Toddler medications packed', checked: false },
      { id: 'h3', text: 'Mosquito repellent (20%+ DEET)', checked: false },
      { id: 'h4', text: 'Sunscreen SPF 50+', checked: false },
      { id: 'h5', text: 'First aid kit prepared', checked: false },
    ],
  },
  {
    id: 'documents',
    name: 'Documents',
    icon: Briefcase,
    color: '#3B82F6',
    items: [
      { id: 'd1', text: 'Passport copies (physical + digital)', checked: false },
      { id: 'd2', text: 'Emergency contact numbers saved', checked: false },
      { id: 'd3', text: 'Hotel addresses in local language', checked: false },
      { id: 'd4', text: 'Credit cards ready + bank notified', checked: false },
    ],
  },
  {
    id: 'packing',
    name: 'Packing',
    icon: Package,
    color: '#10B981',
    items: [
      { id: 'p1', text: 'Baby carrier (for Batu Caves)', checked: false },
      { id: 'p2', text: 'Stroller for malls', checked: false },
      { id: 'p3', text: 'Warm clothes for Cameron Highlands', checked: false },
      { id: 'p4', text: 'Modest clothing for temples', checked: false },
      { id: 'p5', text: 'Swim gear for KLCC wading pool', checked: false },
    ],
  },
];

export function ChecklistFloatingPanel() {
  const [panels] = useAtom(panelsAtom);
  const closePanel = useSetAtom(closePanelAtom);
  const toggleMinimize = useSetAtom(toggleMinimizeAtom);
  const updatePosition = useSetAtom(updatePositionAtom);
  const bringToFront = useSetAtom(bringToFrontAtom);
  const panel = panels.checklist;
  const { width, height } = useResponsivePanel(400, 500);

  // Manage checklist state internally
  const [checklists, setChecklists] = useState<ChecklistCategory[]>(DEFAULT_CHECKLISTS);

  const handleToggleItem = (categoryId: string, itemId: string) => {
    setChecklists((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: category.items.map((item) =>
                item.id === itemId ? { ...item, checked: !item.checked } : item
              ),
            }
          : category
      )
    );
  };

  const handleAddItem = (categoryId: string, text: string) => {
    setChecklists((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: [
                ...category.items,
                {
                  id: `${categoryId}-${Date.now()}`,
                  text,
                  checked: false,
                },
              ],
            }
          : category
      )
    );
  };

  return (
    <FloatingPanel
      id="checklist"
      title="Travel Checklist"
      icon={CheckSquare}
      isOpen={panel.isOpen}
      isMinimized={panel.isMinimized}
      position={panel.position}
      size={{ width, height }}
      zIndex={panel.zIndex}
      onClose={() => closePanel('checklist')}
      onMinimize={() => toggleMinimize('checklist')}
      onPositionChange={(pos) => updatePosition({ panelId: 'checklist', position: pos })}
      onFocus={() => bringToFront('checklist')}
    >
      <ChecklistPanel
        checklists={checklists}
        onToggleItem={handleToggleItem}
        onAddItem={handleAddItem}
      />
    </FloatingPanel>
  );
}
