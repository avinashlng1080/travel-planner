import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Settings as SettingsIcon, Home, MapPin, Info } from 'lucide-react';

import { HOME_BASE, LOCATIONS, type Location } from '../../data/tripData';
import { ResponsivePanelWrapper } from '../ui/ResponsivePanelWrapper';

// Atom to store user's selected home base
export const homeBaseAtom = atomWithStorage<Location>('malaysia-trip-home-base', HOME_BASE);

function SettingsPanelContent() {
  const [homeBase, setHomeBase] = useAtom(homeBaseAtom);

  // Filter locations that could serve as home base (home-base category or toddler-friendly with high rating)
  const possibleHomeBases = LOCATIONS.filter(
    (loc) =>
      loc.category === 'home-base' ||
      (loc.category === 'toddler-friendly' && loc.toddlerRating >= 4) ||
      loc.category === 'shopping' // Hotels in malls
  );

  return (
    <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Home Base Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-sunset-600" />
              <h3 className="text-base font-semibold text-slate-900">Home Base Location</h3>
            </div>

            <div className="bg-ocean-50/50 border border-ocean-200/50 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-ocean-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-ocean-900">
                  <p className="font-medium mb-1">Your home base is the central marker on the map.</p>
                  <p className="text-ocean-700">It appears prominently to help you navigate and plan routes from your accommodation.</p>
                </div>
              </div>
            </div>

            {/* Current Home Base Display */}
            <div className="bg-gradient-to-br from-sunset-50 to-ocean-50 border-2 border-sunset-300 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sunset-700 uppercase tracking-wide mb-1">Current Home Base</p>
                  <h4 className="text-base font-bold text-slate-900 mb-1">{homeBase.name}</h4>
                  <p className="text-sm text-slate-600 mb-2">{homeBase.address || homeBase.city}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{homeBase.lat.toFixed(4)}, {homeBase.lng.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Selection */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">Select a different home base:</p>
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {possibleHomeBases.map((location) => {
                  const isSelected = location.id === homeBase.id;

                  return (
                    <button
                      key={location.id}
                      onClick={() => { setHomeBase(location); }}
                      className={`
                        w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                        ${isSelected
                          ? 'bg-gradient-to-br from-sunset-50 to-ocean-50 border-sunset-400 shadow-lg shadow-sunset-500/20'
                          : 'bg-white/60 border-slate-200 hover:border-sunset-300 hover:bg-sunset-50/30'
                        }
                      `}
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`
                            w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                            ${isSelected
                              ? 'bg-gradient-to-br from-sunset-500 to-ocean-600 shadow-md'
                              : 'bg-slate-100'
                            }
                          `}
                        >
                          {location.category === 'home-base' ? (
                            <Home className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                          ) : (
                            <MapPin className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-sm font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-800'}`}>
                              {location.name}
                            </h4>
                            {isSelected && (
                              <span className="text-xs font-medium text-sunset-600 bg-sunset-100 px-2 py-0.5 rounded-full">
                                Active
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                            {location.description}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="capitalize">{location.category.replace('-', ' ')}</span>
                            <span>•</span>
                            <span>{location.city}</span>
                            {location.toddlerRating && (
                              <>
                                <span>•</span>
                                <span>⭐ {location.toddlerRating}/5</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Future Settings Sections */}
          <section className="pt-6 border-t border-slate-200/50">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Home className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">More settings coming soon...</p>
            </div>
          </section>
        </div>
    </div>
  );
}

export function SettingsPanel() {
  return (
    <ResponsivePanelWrapper
      panelId="settings"
      title="Settings"
      icon={SettingsIcon}
      defaultSize={{ width: 480, height: 600 }}
    >
      <SettingsPanelContent />
    </ResponsivePanelWrapper>
  );
}
