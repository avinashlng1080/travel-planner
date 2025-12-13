import { useTripStore } from '../../stores/tripStore';

export default function PlanFilter() {
  const { travelPlans, visiblePlans, togglePlan } = useTripStore();

  return (
    <div className="bg-white rounded-lg p-4 shadow-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 font-['Outfit']">
          Travel Plans
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          Select which plans to display
        </p>
      </div>

      <div className="space-y-3">
        {travelPlans.map((plan) => {
          const isActive = visiblePlans.includes(plan.id);
          return (
            <button
              key={plan.id}
              onClick={() => togglePlan(plan.id)}
              className={`w-full p-4 rounded-lg transition-all duration-200 ${
                isActive ? 'bg-slate-100 ring-2' : 'bg-white hover:bg-slate-50'
              }`}
              style={isActive ? { boxShadow: `0 0 0 2px ${plan.color}` } : {}}
            >
              <div className="flex items-center gap-3">
                <div
                  className="text-2xl flex items-center justify-center w-10 h-10 rounded-lg"
                  style={{ backgroundColor: isActive ? `${plan.color}20` : 'transparent' }}
                >
                  {plan.id === 'plan-a' ? '🌅' : '🏃'}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-semibold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                      {plan.name}
                    </h4>
                    <span
                      className="px-2 py-0.5 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: isActive ? `${plan.color}30` : '#f1f5f9',
                        color: isActive ? plan.color : '#64748b',
                      }}
                    >
                      {plan.id === 'plan-a' ? 'Relaxed' : 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {plan.id === 'plan-a'
                      ? 'Main itinerary with planned activities'
                      : 'Indoor alternatives for rainy days'}
                  </p>
                </div>
                <div
                  className="w-12 h-6 rounded-full relative"
                  style={{ backgroundColor: isActive ? plan.color : '#cbd5e1' }}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200"
                    style={{ left: isActive ? '26px' : '2px' }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-600">
          Both plans can be active simultaneously.
        </p>
      </div>
    </div>
  );
}
