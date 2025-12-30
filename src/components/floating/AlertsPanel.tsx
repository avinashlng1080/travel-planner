import { AlertTriangle } from 'lucide-react';
import { FloatingPanel } from '../ui/FloatingPanel';
import SafetyPanel from '../Safety/SafetyPanel';
import { useAtom, useSetAtom } from 'jotai';
import {
  panelsAtom,
  closePanelAtom,
  toggleMinimizeAtom,
  updatePositionAtom,
  bringToFrontAtom,
} from '../../atoms/floatingPanelAtoms';
import { useResponsivePanel } from '../../hooks/useResponsivePanel';

export function AlertsPanel() {
  const [panels] = useAtom(panelsAtom);
  const closePanel = useSetAtom(closePanelAtom);
  const toggleMinimize = useSetAtom(toggleMinimizeAtom);
  const updatePosition = useSetAtom(updatePositionAtom);
  const bringToFront = useSetAtom(bringToFrontAtom);
  const panel = panels.alerts;
  const { width, height } = useResponsivePanel(400, 450);

  return (
    <FloatingPanel
      id="alerts"
      title="Safety & Alerts"
      icon={AlertTriangle}
      isOpen={panel.isOpen}
      isMinimized={panel.isMinimized}
      position={panel.position}
      size={{ width, height }}
      zIndex={panel.zIndex}
      onClose={() => closePanel('alerts')}
      onMinimize={() => toggleMinimize('alerts')}
      onPositionChange={(pos) => updatePosition({ panelId: 'alerts', position: pos })}
      onFocus={() => bringToFront('alerts')}
    >
      <SafetyPanel />
    </FloatingPanel>
  );
}
