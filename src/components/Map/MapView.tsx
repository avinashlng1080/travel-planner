import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTripStore } from '../../stores/tripStore';
import CustomMarker from './CustomMarker';

// Fix default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const HOME_BASE_COORDS: [number, number] = [3.1089, 101.7279];
const DEFAULT_ZOOM = 12;

function MapController() {
  const map = useMap();
  const selectedLocation = useTripStore(state => state.selectedLocation);

  useEffect(() => {
    if (selectedLocation) {
      map.flyTo([selectedLocation.lat, selectedLocation.lng], 15, {
        duration: 1
      });
    }
  }, [selectedLocation, map]);

  return null;
}

export default function MapView() {
  const { locations, visibleCategories, selectLocation } = useTripStore();

  const visibleLocations = locations.filter(location =>
    visibleCategories.includes(location.category)
  );

  return (
    <div className="h-full w-full">
      <MapContainer
        center={HOME_BASE_COORDS}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController />
        {visibleLocations.map((location) => (
          <CustomMarker
            key={location.id}
            location={location}
            onClick={() => selectLocation(location)}
          />
        ))}
      </MapContainer>
    </div>
  );
}
