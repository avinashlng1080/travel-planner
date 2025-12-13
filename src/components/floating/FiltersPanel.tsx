import { Filter } from 'lucide-react';
import { FloatingPanel } from '../ui/FloatingPanel';
import { useFloatingPanelStore } from '../../stores/floatingPanelStore';
import { useUIStore } from '../../stores/uiStore';

interface Category {
  id: string;
  name: string;
  color: string;
}

const categories: Category[] = [
  { id: 'home-base', name: 'Home Base', color: '#EC4899' },
  { id: 'toddler-friendly', name: 'Toddler Friendly', color: '#F472B6' },
  { id: 'attraction', name: 'Attraction', color: '#10B981' },
  { id: 'shopping', name: 'Shopping', color: '#8B5CF6' },
  { id: 'restaurant', name: 'Restaurant', color: '#F59E0B' },
  { id: 'nature', name: 'Nature', color: '#22C55E' },
  { id: 'temple', name: 'Temple', color: '#EF4444' },
  { id: 'playground', name: 'Playground', color: '#06B6D4' },
  { id: 'medical', name: 'Medical', color: '#DC2626' },
];

export function FiltersPanel() {
  const { panels, closePanel, toggleMinimize, updatePosition, bringToFront } = useFloatingPanelStore();
  const { visibleCategories, toggleCategory, setAllCategories } = useUIStore();

  const panelState = panels.filters;

  const handleShowAll = () => {
    setAllCategories(categories.map(cat => cat.id));
  };

  const handleHideAll = () => {
    setAllCategories([]);
  };

  return (
    <FloatingPanel
      id="filters"
      title="Category Filters"
      icon={Filter}
      isOpen={panelState.isOpen}
      isMinimized={panelState.isMinimized}
      position={panelState.position}
      size={{ width: 300, height: 400 }}
      zIndex={panelState.zIndex}
      onClose={() => closePanel('filters')}
      onMinimize={() => toggleMinimize('filters')}
      onPositionChange={(pos) => updatePosition('filters', pos)}
      onFocus={() => bringToFront('filters')}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Quick Actions */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleShowAll}
            className="flex-1 px-3 py-2 text-xs font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Show All
          </button>
          <button
            onClick={handleHideAll}
            className="flex-1 px-3 py-2 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200"
          >
            Hide All
          </button>
        </div>

        {/* Category List */}
        <div className="space-y-1 flex-1 overflow-y-auto">
          {categories.map((cat) => {
            const isVisible = visibleCategories.includes(cat.id);

            return (
              <label
                key={cat.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => toggleCategory(cat.id)}
                  className="w-4 h-4 rounded border-slate-300 bg-white text-pink-500 focus:ring-pink-500/50 focus:ring-2 cursor-pointer transition-all"
                />
                <span
                  className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className={`text-sm font-medium flex-1 ${isVisible ? 'text-slate-900' : 'text-slate-400'}`}>
                  {cat.name}
                </span>
              </label>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-600 text-center">
            {visibleCategories.length} of {categories.length} categories visible
          </p>
        </div>
      </div>
    </FloatingPanel>
  );
}
