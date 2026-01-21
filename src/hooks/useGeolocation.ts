import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useCallback, useRef } from 'react';

import {
  userContextAtom,
  updateLocationAtom,
  setLocationPermissionAtom,
  toggleLocationTrackingAtom,
  type UserLocation,
} from '@/atoms/userContextAtoms';
import { calculateDistance } from '@/utils/geo';

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
              timestamp: position.timestamp,
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
    } catch (error) {
      console.error('[useGeolocation] Permission request failed:', error);
      setPermission('unavailable');
      return false;
    }
  }, [isSupported, enableHighAccuracy, maximumAge, timeout, setPermission, updateLocation]);

  // Stop tracking (defined first to avoid circular dependency)
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  }, [setTracking]);

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
          timestamp: position.timestamp,
        });
      },
      (error) => {
        console.error('[useGeolocation] Watch error:', error.code, error.message);
        if (error.code === error.PERMISSION_DENIED) {
          setPermission('denied');
          stopTracking();
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          console.warn('[useGeolocation] Position unavailable - GPS signal may be weak');
        } else if (error.code === error.TIMEOUT) {
          console.warn('[useGeolocation] Position request timed out');
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
    stopTracking,
  ]);

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
            timestamp: position.timestamp,
          };
          updateLocation(location);
          resolve(location);
        },
        (error) => {
          console.error('[useGeolocation] getCurrentPosition failed:', error.code, error.message);
          resolve(null);
        },
        { enableHighAccuracy, maximumAge, timeout }
      );
    });
  }, [isSupported, userContext.locationPermission, enableHighAccuracy, maximumAge, timeout, updateLocation]);

  // Calculate distance to a location (in km)
  const getDistanceTo = useCallback(
    (targetLat: number, targetLng: number): number | null => {
      if (!userContext.currentLocation) {
        return null;
      }

      return calculateDistance(
        userContext.currentLocation.lat,
        userContext.currentLocation.lng,
        targetLat,
        targetLng
      );
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
