import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Location } from '../../types';

const CATEGORY_COLORS: Record<string, string> = {
  'home-base': '#EC4899',
  'toddler-friendly': '#F472B6',
  attraction: '#10B981',
  shopping: '#8B5CF6',
  restaurant: '#F59E0B',
  nature: '#22C55E',
  temple: '#EF4444',
  playground: '#06B6D4',
  medical: '#DC2626',
  avoid: '#64748b',
};

interface CustomMarkerProps {
  location: Location;
  onClick: () => void;
}

export default function CustomMarker({ location, onClick }: CustomMarkerProps) {
  const color = CATEGORY_COLORS[location.category] || '#3B82F6';

  const customIcon = L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 12px;
          height: 12px;
          background-color: rgba(255,255,255,0.4);
          border-radius: 50%;
          margin: 4px 0 0 4px;
        "></div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });

  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={customIcon}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Popup>
        <div className="font-sans">
          <h3 className="font-semibold text-sm">{location.name}</h3>
          <p className="text-xs text-gray-600 mt-1">{location.city}</p>
        </div>
      </Popup>
    </Marker>
  );
}
