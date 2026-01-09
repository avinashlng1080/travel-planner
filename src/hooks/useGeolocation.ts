import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useCallback, useRef } from 'react';

import {
  userContextAtom,
  updateLocationAtom,
  setLocationPermissionAtom,
  toggleLocationTrackingAtom,
  type UserLocation,
} from '@/atoms/userContextAtoms';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [userContext] = useAtom(userContextAtom);
  const updateLocation = useSetAtom(updateLocationAtom);
  const setPermission = useSetAtom(setLocationPermissionAtom);
  const setTracking = useSetAtom(toggleLocationTrackingAtom);

  const watchIdRef = useRef<number | null>(null);

  const {
    enableHighAccuracy = true,
    maximumAge = 30000, // 30 seconds
    timeout = 10000, // 10 seconds
  } = options;

  // Check if geolocation is available
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  // Request permission and start tracking
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setPermission('unavailable');
      return false;
    }

    try {
      // Check current permission state if available
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermission(result.state as 'granted' | 'denied' | 'prompt');

        if (result.state === 'denied') {
          return false;
        }
      }

      // Try to get position to trigger permission prompt
      return new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setPermission('granted');
            updateLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(position.timestamp),
            });
            resolve(true);
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              setPermission('denied');
            }
            resolve(false);
          },
          { enableHighAccuracy, maximumAge, timeout }
        );
      });
    } catch {
      setPermission('unavailable');
      return false;
    }
  }, [isSupported, enableHighAccuracy, maximumAge, timeout, setPermission, updateLocation]);

  // Start continuous tracking
  const startTracking = useCallback(() => {
    if (!isSupported || userContext.locationPermission !== 'granted') {
      return;
    }

    if (watchIdRef.current !== null) {
      return; // Already tracking
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        updateLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp),
        });
      },
      (error) => {
        console.error('[useGeolocation] Watch error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setPermission('denied');
          stopTracking();
        }
      },
      { enableHighAccuracy, maximumAge, timeout }
    );

    setTracking(true);
  }, [
    isSupported,
    userContext.locationPermission,
    enableHighAccuracy,
    maximumAge,
    timeout,
    updateLocation,
    setPermission,
    setTracking,
  ]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  }, [setTracking]);

  // Get current position once
  const getCurrentPosition = useCallback(async (): Promise<UserLocation | null> => {
    if (!isSupported || userContext.locationPermission !== 'granted') {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: UserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
          };
          updateLocation(location);
          resolve(location);
        },
        () => { resolve(null); },
        { enableHighAccuracy, maximumAge, timeout }
      );
    });
  }, [isSupported, userContext.locationPermission, enableHighAccuracy, maximumAge, timeout, updateLocation]);

  // Calculate distance to a location (in km)
  const getDistanceTo = useCallback(
    (targetLat: number, targetLng: number): number | null => {
      if (!userContext.currentLocation) {return null;}

      const R = 6371; // Earth's radius in km
      const dLat = toRad(targetLat - userContext.currentLocation.lat);
      const dLng = toRad(targetLng - userContext.currentLocation.lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(userContext.currentLocation.lat)) *
          Math.cos(toRad(targetLat)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    [userContext.currentLocation]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    isSupported,
    currentLocation: userContext.currentLocation,
    permission: userContext.locationPermission,
    isTracking: userContext.isTrackingLocation,
    requestPermission,
    startTracking,
    stopTracking,
    getCurrentPosition,
    getDistanceTo,
  };
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
