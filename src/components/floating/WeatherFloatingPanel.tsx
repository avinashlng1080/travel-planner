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
import { FloatingPanel } from '../ui/FloatingPanel';
import { WeatherPanel } from '../weather/WeatherPanel';
import { useAtom, useSetAtom } from 'jotai';
import {
  panelsAtom,
  closePanelAtom,
  toggleMinimizeAtom,
  updatePositionAtom,
  bringToFrontAtom,
} from '../../atoms/floatingPanelAtoms';
import { useResponsivePanel } from '../../hooks/useResponsivePanel';

export function WeatherFloatingPanel() {
  const [panels] = useAtom(panelsAtom);
  const closePanel = useSetAtom(closePanelAtom);
  const toggleMinimize = useSetAtom(toggleMinimizeAtom);
  const updatePosition = useSetAtom(updatePositionAtom);
  const bringToFront = useSetAtom(bringToFrontAtom);
  const panel = panels.weather;
  const { width, height } = useResponsivePanel(380, 520);

  return (
    <FloatingPanel
      id="weather"
      title="Weather & Alerts"
      icon={CloudRain}
      isOpen={panel.isOpen}
      isMinimized={panel.isMinimized}
      position={panel.position}
      size={{ width, height }}
      zIndex={panel.zIndex}
      onClose={() => closePanel('weather')}
      onMinimize={() => toggleMinimize('weather')}
      onPositionChange={(pos) => updatePosition({ panelId: 'weather', position: pos })}
      onFocus={() => bringToFront('weather')}
    >
      <WeatherPanel />
    </FloatingPanel>
  );
}
