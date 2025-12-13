import { AlertTriangle } from 'lucide-react';
import { FloatingPanel } from '../ui/FloatingPanel';
import SafetyPanel from '../Safety/SafetyPanel';
import { useFloatingPanelStore } from '../../stores/floatingPanelStore';

export function AlertsPanel() {
  const { panels, closePanel, toggleMinimize, updatePosition, bringToFront } = useFloatingPanelStore();
  const panel = panels.alerts;

  return (
    <FloatingPanel
      id="alerts"
      title="Safety & Alerts"
      icon={AlertTriangle}
      isOpen={panel.isOpen}
      isMinimized={panel.isMinimized}
      position={panel.position}
      size={{ width: 420, height: 550 }}
      zIndex={panel.zIndex}
      onClose={() => closePanel('alerts')}
      onMinimize={() => toggleMinimize('alerts')}
      onPositionChange={(pos) => updatePosition('alerts', pos)}
      onFocus={() => bringToFront('alerts')}
    >
      <SafetyPanel />
    </FloatingPanel>
  );
}
