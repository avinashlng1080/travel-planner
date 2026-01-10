import { useAtom, useSetAtom } from 'jotai';

import { FloatingPanel } from './FloatingPanel';
import { MobileModal } from './MobileModal';
import {
  panelsAtom,
  activeMobileModalAtom,
  closePanelAtom,
  toggleMinimizeAtom,
  updatePositionAtom,
  bringToFrontAtom,
  type PanelId,
} from '../../atoms/floatingPanelAtoms';
import { useIsMobile } from '../../hooks/useIsMobile';

import type { LucideIcon } from 'lucide-react';

interface ResponsivePanelWrapperProps {
  panelId: PanelId;
  title: string;
  icon: LucideIcon;
  defaultSize: { width: number; height: number };
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive wrapper that conditionally renders:
 * - MobileModal on mobile (< 768px)
 * - FloatingPanel on desktop (>= 768px)
 *
 * Maintains consistent state management across both modes
 */
export function ResponsivePanelWrapper({
  panelId,
  title,
  icon,
  defaultSize,
  children,
  className,
}: ResponsivePanelWrapperProps) {
  const [panels] = useAtom(panelsAtom);
  const [activeMobileModal] = useAtom(activeMobileModalAtom);
  const closePanel = useSetAtom(closePanelAtom);
  const toggleMinimize = useSetAtom(toggleMinimizeAtom);
  const updatePosition = useSetAtom(updatePositionAtom);
  const bringToFront = useSetAtom(bringToFrontAtom);
  const isMobile = useIsMobile();

  const panelState = panels[panelId];

  // Panel not open - don't render anything
  if (!panelState.isOpen) {return null;}

  // Mobile: Render as full-screen modal (only if this is the active modal)
  if (isMobile) {
    if (activeMobileModal !== panelId) {return null;}

    return (
      <MobileModal
        title={title}
        icon={icon}
        isOpen
        onClose={() => { closePanel(panelId); }}
      >
        {children}
      </MobileModal>
    );
  }

  // Desktop: Render as floating panel (existing behavior)
  return (
    <FloatingPanel
      id={panelId}
      title={title}
      icon={icon}
      isOpen={panelState.isOpen}
      isMinimized={panelState.isMinimized}
      position={panelState.position}
      size={defaultSize}
      zIndex={panelState.zIndex}
      onClose={() => { closePanel(panelId); }}
      onMinimize={() => { toggleMinimize(panelId); }}
      onPositionChange={(pos) => { updatePosition({ panelId, position: pos }); }}
      onFocus={() => { bringToFront(panelId); }}
      className={className}
    >
      {children}
    </FloatingPanel>
  );
}
