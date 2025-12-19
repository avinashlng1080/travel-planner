# Weather UI Components

Glassmorphic weather components following the project's design system.

## Components

### WeatherIcon
Maps weather conditions to Lucide icons with appropriate colors.

```tsx
import { WeatherIcon } from '@/components/weather';

<WeatherIcon condition="clear" size={24} />
<WeatherIcon condition="heavy-rain" size={32} />
```

### WeatherBadge
Compact inline badge for day headers showing weather at a glance.

```tsx
import { WeatherBadge } from '@/components/weather';

<WeatherBadge
  forecast={dailyForecast}
  showRainChance={true}
/>
// Displays: [☀️ 32° 💧20%]
```

### WeatherCard
Detailed weather card for RightDetailPanel with current conditions or forecast.

```tsx
import { WeatherCard } from '@/components/weather';

// Show current weather
<WeatherCard current={currentWeather} isLoading={false} />

// Or show forecast
<WeatherCard forecast={dailyForecast} />

// Loading state
<WeatherCard isLoading={true} />
```

### WeatherAlertBanner
Animated warning banner for monsoon/flash flood alerts.

```tsx
import { WeatherAlertBanner } from '@/components/weather';

<WeatherAlertBanner
  alert={{
    level: 'severe',
    title: 'Flash Flood Warning',
    message: 'Heavy rainfall expected in the next 24 hours',
    recommendation: 'Avoid low-lying areas and monitor local alerts',
    planBSuggestion: 'Switch to indoor activities at KLCC',
    affectedDays: ['Dec 25', 'Dec 26']
  }}
  onDismiss={() => console.log('Dismissed')}
/>
```

## Design System

All components follow the glassmorphic design pattern:
- `bg-white/80` - Semi-transparent white background
- `backdrop-blur-sm/lg/xl` - Blur effect
- `border border-slate-200/50` - Subtle border
- `rounded-full/xl` - Rounded corners
- Smooth animations with Framer Motion

## Color Palette

Weather conditions use semantic colors:
- Clear: `text-amber-500` (sunny yellow)
- Cloudy: `text-slate-400` (neutral gray)
- Rain: `text-blue-500` (water blue)
- Heavy Rain: `text-blue-600` (deep blue)
- Storm: `text-purple-500` (electric purple)
- Fog: `text-slate-400` (misty gray)

Alert severities:
- Low: Green gradient
- Moderate: Amber gradient
- High: Orange-to-red gradient
- Severe: Red gradient

## Integration Example

```tsx
import { useWeather } from '@/hooks/useWeather';
import { WeatherBadge, WeatherCard, WeatherAlertBanner } from '@/components/weather';

function DayView({ date }: { date: string }) {
  const { daily, flashFloodAlert } = useWeather();
  const dayForecast = daily.find(d => d.date === date);

  return (
    <div>
      {/* Day header with inline weather badge */}
      <div className="flex items-center gap-2">
        <h2>December 25, 2025</h2>
        {dayForecast && <WeatherBadge forecast={dayForecast} />}
      </div>

      {/* Flash flood alert banner */}
      {flashFloodAlert && (
        <WeatherAlertBanner alert={flashFloodAlert} />
      )}

      {/* Detailed weather card */}
      {dayForecast && (
        <WeatherCard forecast={dayForecast} />
      )}
    </div>
  );
}
```
