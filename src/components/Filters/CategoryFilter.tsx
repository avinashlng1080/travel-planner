import { useTripStore, CATEGORY_CONFIG } from '../../stores/tripStore';

export default function CategoryFilter() {
  const { visibleCategories, toggleCategory, setAllCategories } = useTripStore();

  const allSelected = Object.keys(CATEGORY_CONFIG).every(cat => visibleCategories.includes(cat));
  const noneSelected = visibleCategories.length === 0;

  return (
    <div className="bg-white rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 font-['Outfit']">
          Filter by Category
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setAllCategories(true)}
            disabled={allSelected}
            className="px-3 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 text-slate-900 hover:bg-slate-200"
          >
            All
          </button>
          <button
            onClick={() => setAllCategories(false)}
            disabled={noneSelected}
            className="px-3 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 text-slate-900 hover:bg-slate-200"
          >
            None
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(CATEGORY_CONFIG).map(([key, { label, color }]) => {
          const isSelected = visibleCategories.includes(key);
          return (
            <label
              key={key}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                isSelected ? 'bg-slate-100' : 'bg-white hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleCategory(key)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'border-transparent' : 'border-slate-300'
                }`}
                style={{ backgroundColor: isSelected ? color : 'transparent' }}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                {label}
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-600">
          {visibleCategories.length} of {Object.keys(CATEGORY_CONFIG).length} categories visible
        </p>
      </div>
    </div>
  );
}
