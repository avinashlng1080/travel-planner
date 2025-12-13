import { useState } from 'react';
import { ChevronDown, ChevronRight, Menu, X, Calendar } from 'lucide-react';
import { useTripStore, CATEGORY_CONFIG } from '../../stores/tripStore';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [plansExpanded, setPlansExpanded] = useState(true);
  const [daysExpanded, setDaysExpanded] = useState(true);

  const {
    dayPlans,
    travelPlans,
    selectedDay,
    visibleCategories,
    visiblePlans,
    selectDay,
    toggleCategory,
    togglePlan,
    setAllCategories,
  } = useTripStore();

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-white">
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold">Menu</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-slate-100 rounded-lg"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Day Selector */}
        <section>
          <button
            onClick={() => setDaysExpanded(!daysExpanded)}
            className="w-full flex items-center justify-between text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 hover:text-slate-900"
          >
            <span className="flex items-center gap-2">
              <Calendar size={16} />
              Daily Plans
            </span>
            {daysExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {daysExpanded && (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {dayPlans.map((day) => (
                <button
                  key={day.id}
                  onClick={() => selectDay(day.id === selectedDay ? null : day.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedDay === day.id
                      ? 'bg-pink-500 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <div className="font-medium text-sm">{day.dayOfWeek}</div>
                  <div className="text-xs opacity-80">{day.date}</div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Category Filters */}
        <section>
          <button
            onClick={() => setCategoriesExpanded(!categoriesExpanded)}
            className="w-full flex items-center justify-between text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 hover:text-slate-900"
          >
            <span>Categories</span>
            {categoriesExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {categoriesExpanded && (
            <>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setAllCategories(true)}
                  className="text-xs px-2 py-1 bg-white hover:bg-slate-100 rounded"
                >
                  All
                </button>
                <button
                  onClick={() => setAllCategories(false)}
                  className="text-xs px-2 py-1 bg-white hover:bg-slate-100 rounded"
                >
                  None
                </button>
              </div>
              <div className="space-y-1">
                {Object.entries(CATEGORY_CONFIG).map(([key, { label, color }]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visibleCategories.includes(key)}
                      onChange={() => toggleCategory(key)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: color }}
                    />
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-slate-600">{label}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Plan Filters */}
        <section>
          <button
            onClick={() => setPlansExpanded(!plansExpanded)}
            className="w-full flex items-center justify-between text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 hover:text-slate-900"
          >
            <span>Travel Plans</span>
            {plansExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {plansExpanded && (
            <div className="space-y-1">
              {travelPlans.map((plan) => (
                <label
                  key={plan.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={visiblePlans.includes(plan.id)}
                    onChange={() => togglePlan(plan.id)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: plan.color }}
                  />
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: plan.color }}
                  />
                  <span className="text-sm text-slate-600">{plan.name}</span>
                </label>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-20 left-4 z-40 p-3 bg-white rounded-lg shadow-lg"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-72 border-r border-slate-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
