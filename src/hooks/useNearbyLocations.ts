import { useAtom } from 'jotai';
import { useMemo } from 'react';

import { userContextAtom } from '@/atoms/userContextAtoms';
import { LOCATIONS, type Location } from '@/data/tripData';

interface NearbyLocation extends Location {
  distanceKm: number;
  walkingMinutes: number;
}

export function useNearbyLocations(maxDistanceKm = 5): NearbyLocation[] {
  const [userContext] = useAtom(userContextAtom);

  return useMemo(() => {
    if (!userContext.currentLocation) {
      return [];
    }

    const { lat: userLat, lng: userLng } = userContext.currentLocation;

    return LOCATIONS.map((location) => {
      const distanceKm = calculateDistance(userLat, userLng, location.lat, location.lng);
      const walkingMinutes = Math.round(distanceKm * 12); // ~5 km/h walking

      return {
        ...location,
        distanceKm,
        walkingMinutes,
      };
    })
      .filter((loc) => loc.distanceKm <= maxDistanceKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userContext.currentLocation, maxDistanceKm]);
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Filter locations based on user context
export function useContextAwareLocations(): NearbyLocation[] {
  const nearbyLocations = useNearbyLocations(10);
  const [userContext] = useAtom(userContextAtom);

  return useMemo(() => {
    let filtered = nearbyLocations;

    // Filter by energy level
    if (userContext.energyLevel === 'low') {
      filtered = filtered.filter((loc) => loc.isIndoor);
    }

    // Filter by toddler mood
    if (
      userContext.toddlerMood === 'fussy' ||
      userContext.toddlerMood === 'tired'
    ) {
      filtered = filtered.filter(
        (loc) => loc.toddlerRating >= 4 || loc.category === 'home-base'
      );
    }

    // Filter by health status
    if (userContext.healthStatus !== 'good') {
      // Prioritize locations near medical facilities
      filtered = filtered.filter((loc) => loc.isIndoor || loc.category === 'medical');
    }

    return filtered;
  }, [nearbyLocations, userContext]);
}
