import { useTripStore } from '../../stores/tripStore';
import { MapPin, Star } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  'home-base': '#EC4899',
  'toddler-friendly': '#F472B6',
  'attraction': '#10B981',
  'shopping': '#8B5CF6',
  'restaurant': '#F59E0B',
  'nature': '#22C55E',
  'temple': '#EF4444',
  'playground': '#06B6D4',
  'medical': '#DC2626',
  'avoid': '#64748b',
};

export default function LocationList() {
  const { locations, visibleCategories, selectedLocation, selectLocation } = useTripStore();

  const visibleLocations = locations.filter(location =>
    visibleCategories.includes(location.category)
  );

  const sortedLocations = [...visibleLocations].sort(
    (a, b) => b.toddlerRating - a.toddlerRating
  );

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="p-4 sticky top-0 bg-white border-b border-slate-200 z-10">
        <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">
          Locations ({visibleLocations.length})
        </h2>
      </div>

      <div className="divide-y divide-slate-200">
        {sortedLocations.map((location) => {
          const isSelected = selectedLocation?.id === location.id;
          const color = CATEGORY_COLORS[location.category] || '#3B82F6';

          return (
            <button
              key={location.id}
              onClick={() => selectLocation(location)}
              className={`w-full text-left p-4 hover:bg-slate-100 transition-colors ${
                isSelected ? 'bg-slate-100 border-l-4' : ''
              }`}
              style={isSelected ? { borderLeftColor: color } : {}}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{location.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-600 capitalize">
                      {location.category.replace('-', ' ')}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-amber-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{location.toddlerRating}/5</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    <span>{location.distanceFromBase}</span>
                    <span>-</span>
                    <span>{location.drivingTime}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                    {location.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {visibleLocations.length === 0 && (
        <div className="flex items-center justify-center h-64 text-slate-500">
          <div className="text-center">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No locations match your filters</p>
          </div>
        </div>
      )}
    </div>
  );
}
