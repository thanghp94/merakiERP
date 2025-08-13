// GPS utility functions for location verification

/**
 * Calculate the distance between two GPS coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Check if a location is within the allowed radius of a facility
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param facilityLat Facility's latitude
 * @param facilityLon Facility's longitude
 * @param allowedRadius Allowed radius in meters
 * @returns Object with verification result and distance
 */
export function verifyLocation(
  userLat: number,
  userLon: number,
  facilityLat: number,
  facilityLon: number,
  allowedRadius: number
): { isValid: boolean; distance: number } {
  const distance = calculateDistance(userLat, userLon, facilityLat, facilityLon);
  return {
    isValid: distance <= allowedRadius,
    distance
  };
}

/**
 * Get user's current location using the browser's Geolocation API
 * @param options Geolocation options
 * @returns Promise with coordinates or error
 */
export function getCurrentLocation(
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  }
): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unknown error occurred';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      options
    );
  });
}

/**
 * Format distance for display
 * @param meters Distance in meters
 * @returns Formatted string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

/**
 * Get location status message
 * @param isVerified Whether location is verified
 * @param distance Distance in meters
 * @param allowedRadius Allowed radius in meters
 * @returns Status message
 */
export function getLocationStatusMessage(
  isVerified: boolean,
  distance: number,
  allowedRadius: number
): string {
  if (isVerified) {
    return `✅ Vị trí hợp lệ (${formatDistance(distance)} từ địa điểm làm việc)`;
  } else {
    return `❌ Vị trí không hợp lệ (${formatDistance(distance)} từ địa điểm làm việc, yêu cầu trong vòng ${formatDistance(allowedRadius)})`;
  }
}
