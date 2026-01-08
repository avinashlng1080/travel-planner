import { useAtom, useSetAtom } from 'jotai';
import { Lightbulb, Sun, Cloud, Clock, MapPin, Info, Zap , type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';

import { panelsAtom, closePanelAtom, toggleMinimizeAtom, updatePositionAtom, bringToFrontAtom } from '../../atoms/floatingPanelAtoms';
import { selectedDayIdAtom, selectedLocationAtom } from '../../atoms/uiAtoms';
import { DAILY_PLANS, LOCATIONS } from '../../data/tripData';
import { useResponsivePanel } from '../../hooks/useResponsivePanel';
import { FloatingPanel } from '../ui/FloatingPanel';

interface Suggestion {
  id: string;
  type: 'weather' | 'time' | 'nearby' | 'tip';
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; locationId?: string };
}

export function SuggestionsPanel() {
  const [panels] = useAtom(panelsAtom);
  const closePanel = useSetAtom(closePanelAtom);
  const toggleMinimize = useSetAtom(toggleMinimizeAtom);
  const updatePosition = useSetAtom(updatePositionAtom);
  const bringToFront = useSetAtom(bringToFrontAtom);
  const [selectedDayId] = useAtom(selectedDayIdAtom);
  const [selectedLocation] = useAtom(selectedLocationAtom);
  const { width, height } = useResponsivePanel(380, 450);

  const panelState = panels.suggestions;

  // Generate dynamic suggestions based on context
  const suggestions = useMemo<Suggestion[]>(() => {
    const result: Suggestion[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Find selected day plan
    const selectedDay = selectedDayId
      ? DAILY_PLANS.find((p) => p.id === selectedDayId)
      : null;

    // Weather-based suggestions
    if (selectedDay) {
      if (selectedDay.weatherConsideration === 'outdoor-heavy') {
        result.push({
          id: 'weather-outdoor',
          type: 'weather',
          icon: Sun,
          title: 'Great day for outdoors!',
          description: `${selectedDay.title} has outdoor-heavy activities planned. Make sure to bring sunscreen, hats, and plenty of water.`,
        });
      } else if (selectedDay.weatherConsideration === 'indoor-heavy') {
        result.push({
          id: 'weather-indoor',
          type: 'weather',
          icon: Cloud,
          title: 'Indoor-friendly day',
          description: `${selectedDay.title} focuses on indoor activities. Perfect for rainy weather or when the toddler needs AC breaks.`,
        });
      } else {
        result.push({
          id: 'weather-mixed',
          type: 'weather',
          icon: Sun,
          title: 'Balanced day ahead',
          description: `${selectedDay.title} has a mix of indoor and outdoor activities. Be prepared for both!`,
        });
      }
    }

    // Time-based suggestions (nap time reminders)
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Morning nap reminder (9:30 AM - 10:30 AM)
    if (currentTimeInMinutes >= 570 && currentTimeInMinutes <= 630) {
      result.push({
        id: 'time-morning-nap',
        type: 'time',
        icon: Clock,
        title: 'Morning nap time approaching',
        description:
          'Toddler usually naps around 10:00 AM for 1 hour. Consider planning indoor or home-based activities.',
      });
    }

    // Afternoon nap reminder (2:30 PM - 3:30 PM)
    if (currentTimeInMinutes >= 870 && currentTimeInMinutes <= 930) {
      result.push({
        id: 'time-afternoon-nap',
        type: 'time',
        icon: Clock,
        title: 'Afternoon nap time approaching',
        description:
          'Toddler usually has a quick 30-minute nap around 3:00 PM. Light activities recommended.',
      });
    }

    // Early morning suggestion (5:00 AM - 8:00 AM)
    if (currentHour >= 5 && currentHour < 8) {
      result.push({
        id: 'time-early-bird',
        type: 'time',
        icon: Sun,
        title: 'Perfect time for Batu Caves!',
        description:
          'Early morning is the best time to visit Batu Caves - cooler temperatures and fewer crowds. Beat the heat!',
      });
    }

    // Evening suggestion (6:00 PM - 8:00 PM)
    if (currentHour >= 18 && currentHour < 20) {
      result.push({
        id: 'time-evening',
        type: 'time',
        icon: MapPin,
        title: 'Great time for KLCC Park',
        description:
          'Evening is perfect for KLCC Park. Enjoy the fountain show at 8pm, 9pm, and 10pm with stunning views of Petronas Towers!',
      });
    }

    // Nearby locations based on selected location
    if (selectedLocation) {
      const nearbyLocations = LOCATIONS.filter(
        (loc) =>
          loc.id !== selectedLocation.id &&
          loc.city === selectedLocation.city &&
          loc.category !== 'home-base' &&
          loc.category !== 'medical' &&
          loc.toddlerRating >= 4
      ).slice(0, 2);

      nearbyLocations.forEach((loc) => {
        result.push({
          id: `nearby-${loc.id}`,
          type: 'nearby',
          icon: MapPin,
          title: `Nearby: ${loc.name}`,
          description: `${loc.description.slice(0, 100)}... ${
            loc.toddlerRating === 5 ? 'Highly recommended for toddlers!' : ''
          }`,
          action: {
            label: 'View details',
            locationId: loc.id,
          },
        });
      });
    }

    // General tips based on context
    if (selectedDay && selectedDay.notes.length > 0) {
      // Pick a random important note
      const importantNotes = selectedDay.notes.filter(
        (note) =>
          note.toLowerCase().includes('important') ||
          note.toLowerCase().includes('must') ||
          note.toLowerCase().includes('warning')
      );

      if (importantNotes.length > 0) {
        result.push({
          id: 'tip-day-note',
          type: 'tip',
          icon: Zap,
          title: 'Important reminder',
          description: importantNotes[0],
        });
      }
    }

    // Hardcoded helpful tips
    const hardcodedTips: Suggestion[] = [
      {
        id: 'tip-hydration',
        type: 'tip',
        icon: Info,
        title: 'Stay hydrated!',
        description:
          "Malaysia is hot and humid (24-32°C). Carry water bottles and take AC breaks. Toddler's comfort is priority!",
      },
      {
        id: 'tip-grab',
        type: 'tip',
        icon: Info,
        title: 'Use Grab for transport',
        description:
          'Avoid taxis without meters. Grab is reliable, safe, and shows upfront pricing. Most trips around KL are RM 12-25.',
      },
      {
        id: 'tip-monkeys',
        type: 'tip',
        icon: Zap,
        title: 'Beware of monkeys',
        description:
          'At Batu Caves and some parks, monkeys can be aggressive. Hide food, drinks, and secure phones and bags!',
      },
      {
        id: 'tip-baby-carrier',
        type: 'tip',
        icon: Info,
        title: 'Baby carrier essential',
        description:
          'Aquaria KLCC is NOT stroller-friendly. Bring a baby carrier! Also helpful at Batu Caves and nature trails.',
      },
    ];

    // Add 1-2 random hardcoded tips if we don't have many suggestions
    if (result.length < 4) {
      const availableTips = hardcodedTips.filter(
        (tip) => !result.some((r) => r.id === tip.id)
      );
      const randomTips = availableTips
        .sort(() => Math.random() - 0.5)
        .slice(0, 5 - result.length);
      result.push(...randomTips);
    }

    return result;
  }, [selectedDayId, selectedLocation]);

  const getSuggestionColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'weather':
        return 'from-yellow-500 to-orange-500';
      case 'time':
        return 'from-blue-500 to-cyan-500';
      case 'nearby':
        return 'from-green-500 to-emerald-500';
      case 'tip':
        return 'from-sunset-500 to-ocean-600';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <FloatingPanel
      id="suggestions"
      title="Smart Suggestions"
      icon={Lightbulb}
      isOpen={panelState.isOpen}
      isMinimized={panelState.isMinimized}
      position={panelState.position}
      size={{ width, height }}
      zIndex={panelState.zIndex}
      onClose={() => { closePanel('suggestions'); }}
      onMinimize={() => { toggleMinimize('suggestions'); }}
      onPositionChange={(pos) => { updatePosition({ panelId: 'suggestions', position: pos }); }}
      onFocus={() => { bringToFront('suggestions'); }}
    >
      <div className="p-5">
        {suggestions.length > 0 ? (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="group relative bg-gradient-to-br from-white to-slate-50 border border-slate-200/50 rounded-xl p-4 hover:shadow-md hover:border-slate-300/50 transition-all duration-200"
              >
                {/* Icon Badge */}
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${getSuggestionColor(
                      suggestion.type
                    )} rounded-lg flex items-center justify-center shadow-lg`}
                  >
                    <suggestion.icon className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">
                      {suggestion.title}
                    </h4>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {suggestion.description}
                    </p>

                    {/* Action Button */}
                    {suggestion.action && (
                      <button
                        onClick={() => {
                          // Handle action - could trigger location selection
                          console.log('Action clicked:', suggestion.action);
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ocean-600 hover:text-ocean-700 transition-colors"
                      >
                        {suggestion.action.label}
                        <span className="text-xs md:text-[10px]">→</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Type Badge */}
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider bg-slate-100 text-slate-600">
                    {suggestion.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Lightbulb className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Suggestions Yet
            </h3>
            <p className="text-sm text-slate-600 max-w-xs">
              Select a day or location to get contextual suggestions based on
              weather, time, and nearby attractions.
            </p>
          </div>
        )}
      </div>
    </FloatingPanel>
  );
}
