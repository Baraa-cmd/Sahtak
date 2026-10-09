import { UserLocation } from '../types';
import { DAYR_HAFIR_DEFAULT } from './initialData';

export interface LocationDetectionResult {
  latitude: number;
  longitude: number;
  districtName: string;
  source: 'gps' | 'ip' | 'default';
  accuracy?: number;
}

// Reverse geocode coordinates to an Arabic street / neighborhood name
export async function reverseGeocodeArabic(lat: number, lng: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar&zoom=16`,
      {
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.street || addr.pedestrian || addr.neighbourhood || addr.suburb || addr.quarter;
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state;
        
        if (street && city) {
          return `${city} - ${street}`;
        }
        if (city) {
          return `${city}`;
        }
        if (data.display_name) {
          const parts = data.display_name.split(',');
          return parts.slice(0, 2).join(' - ').trim();
        }
      }
    }
  } catch {
    // Fail silently, return coordinates or standard label
  }
  return '';
}

// Automatic IP Geolocation (Zero-permission fallback)
export async function detectLocationViaIP(): Promise<LocationDetectionResult | null> {
  // Service 1: ipwho.is (fast, CORS friendly, no API key needed)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const cityName = data.city || data.region || data.country || '';
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          districtName: cityName ? `${cityName} (عبر مزود الإنترنت)` : 'موقعك التقريبي (IP)',
          source: 'ip'
        };
      }
    }
  } catch {
    // Try service 2
  }

  // Service 2: BigDataCloud client reverse geocode
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=ar', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const cityName = data.city || data.locality || data.principalSubdivision || data.countryName || '';
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          districtName: cityName ? `${cityName} (عبر مزود الإنترنت)` : 'موقعك التقريبي (IP)',
          source: 'ip'
        };
      }
    }
  } catch {
    // Try service 3
  }

  // Service 3: FreeIPAPI
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const cityName = data.cityName || data.regionName || data.countryName || '';
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          districtName: cityName ? `${cityName} (عبر مزود الإنترنت)` : 'موقعك التقريبي (IP)',
          source: 'ip'
        };
      }
    }
  } catch {
    // All IP services exhausted
  }

  return null;
}

// Request Browser Geolocation (GPS / Wi-Fi) with promise
export function getBrowserGeolocation(highAccuracy = true, timeout = 7000): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation not supported'));
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: highAccuracy,
        timeout,
        maximumAge: 10000
      }
    );
  });
}

/**
 * Main Automatic Detection Pipeline:
 * Always attempts to get the user's real location with zero manual steps.
 * 1. Triggers GPS and IP simultaneously.
 * 2. If GPS responds quickly, uses GPS (highest accuracy).
 * 3. If GPS is slow or blocked, uses IP location immediately so the app is NOT stuck.
 * 4. Enhances the label with Arabic street/city name.
 */
export async function detectRealLocationAutomatically(
  onUpdate?: (loc: UserLocation) => void
): Promise<UserLocation> {
  let hasResolvedGPS = false;

  // Background promise for IP detection
  const ipPromise = detectLocationViaIP().catch(() => null);

  // Try GPS with high accuracy
  try {
    const pos = await getBrowserGeolocation(true, 5000);
    hasResolvedGPS = true;
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    // Get Arabic neighborhood or city name
    const friendlyName = await reverseGeocodeArabic(lat, lng);
    const result: UserLocation = {
      latitude: lat,
      longitude: lng,
      districtName: friendlyName || 'موقعك الفعلي المباشر (GPS)',
      isAuto: true,
      source: 'gps'
    };
    if (onUpdate) onUpdate(result);
    return result;
  } catch {
    // High accuracy failed or timed out, try low accuracy network GPS quickly
    try {
      const pos = await getBrowserGeolocation(false, 3000);
      hasResolvedGPS = true;
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const friendlyName = await reverseGeocodeArabic(lat, lng);
      const result: UserLocation = {
        latitude: lat,
        longitude: lng,
        districtName: friendlyName || 'موقعك الفعلي (شبكة الهاتف)',
        isAuto: true,
        source: 'gps'
      };
      if (onUpdate) onUpdate(result);
      return result;
    } catch {
      // Both GPS attempts failed/denied
    }
  }

  // If GPS didn't resolve, use IP result
  if (!hasResolvedGPS) {
    const ipRes = await ipPromise;
    if (ipRes) {
      // Try reverse geocode for a better Arabic district name
      const friendlyName = await reverseGeocodeArabic(ipRes.latitude, ipRes.longitude);
      const result: UserLocation = {
        latitude: ipRes.latitude,
        longitude: ipRes.longitude,
        districtName: friendlyName || ipRes.districtName,
        isAuto: true,
        source: 'ip'
      };
      if (onUpdate) onUpdate(result);
      return result;
    }
  }

  // Ultimate fallback if no internet or all fail: Default Dayr Hafir
  const fallback: UserLocation = {
    latitude: DAYR_HAFIR_DEFAULT.latitude,
    longitude: DAYR_HAFIR_DEFAULT.longitude,
    districtName: DAYR_HAFIR_DEFAULT.districtName,
    isAuto: false,
    source: 'default'
  };
  if (onUpdate) onUpdate(fallback);
  return fallback;
}
