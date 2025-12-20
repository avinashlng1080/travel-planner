import { useAtom, useSetAtom } from 'jotai';
import { AlertTriangle } from 'lucide-react';

import { panelsAtom, closePanelAtom, toggleMinimizeAtom, updatePositionAtom, bringToFrontAtom } from '../../atoms/floatingPanelAtoms';
import { useResponsivePanel } from '../../hooks/useResponsivePanel';
import SafetyPanel from '../Safety/SafetyPanel';
import { FloatingPanel } from '../ui/FloatingPanel';

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
      onClose={() => { closePanel('alerts'); }}
      onMinimize={() => { toggleMinimize('alerts'); }}
      onPositionChange={(pos) => { updatePosition({ panelId: 'alerts', position: pos }); }}
      onFocus={() => { bringToFront('alerts'); }}
    >
      <SafetyPanel />
    </FloatingPanel>
  );
}
