/**
 * WeatherFloatingPanel Component
 *
 * Floating panel wrapper for weather & flash flood alerts.
 * Follows the same pattern as AlertsPanel for consistency.
 *
 * Features:
 * - Draggable, minimizable, maximizable
 * - Glassmorphic styling
 * - Persistent position across sessions
 */

import { CloudRain } from 'lucide-react';
import { ResponsivePanelWrapper } from '../ui/ResponsivePanelWrapper';
import { WeatherPanel } from '../weather/WeatherPanel';

export function WeatherFloatingPanel() {
  return (
    <ResponsivePanelWrapper
      panelId="weather"
      title="Weather & Alerts"
      icon={CloudRain}
      defaultSize={{ width: 380, height: 520 }}
    >
      <WeatherPanel />
    </ResponsivePanelWrapper>
  );
}
