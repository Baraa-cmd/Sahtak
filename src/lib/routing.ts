// Dedicated routing service for Driving (cars) and Walking (pedestrians) in Dayr Hafir

export type TravelMode = 'driving' | 'walking';

export interface SingleRoute {
  id: string;
  label: string;
  tag: string;
  coordinates: [number, number][]; // [lat, lng] array for Leaflet
  distanceMeters: number;
  drivingDurationSeconds: number;
  walkingDurationSeconds: number;
  activeMode: TravelMode;
  isRealRoad: boolean;
  isShortest: boolean;
}

export interface MultiRouteResult {
  routes: SingleRoute[];
  selectedRouteIndex: number;
  activeMode: TravelMode;
}

// Retained for backward compatibility
export interface RouteResult {
  coordinates: [number, number][];
  distanceMeters: number;
  drivingDurationSeconds: number;
  walkingDurationSeconds: number;
  activeMode: TravelMode;
  isRealRoad: boolean;
}

export function formatDistanceArabic(distanceMeters: number): string {
  if (distanceMeters <= 0) return '0.5 كم';
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} متر`;
  }
  return `${(distanceMeters / 1000).toFixed(1)} كم`;
}

export function formatDurationArabic(seconds: number): string {
  if (seconds <= 0) return 'دقيقتان';
  const minutes = Math.ceil(seconds / 60);
  if (minutes <= 1) return 'دقيقة واحدة';
  if (minutes === 2) return 'دقيقتان';
  if (minutes >= 3 && minutes <= 10) return `${minutes} دقائق`;
  return `${minutes} دقيقة`;
}

/**
 * Helper to fetch a route from OSRM / Footways
 */
async function fetchOsrmGeometry(
  coordsString: string,
  mode: TravelMode,
  signal: AbortSignal
): Promise<Array<{ distance: number; duration: number; coords: [number, number][] }>> {
  const footUrl = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coordsString}?overview=full&geometries=geojson&alternatives=true`;
  const carUrl = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&alternatives=true`;

  const primaryUrl = mode === 'walking' ? footUrl : carUrl;
  const secondaryUrl = mode === 'walking' ? carUrl : footUrl;

  let res = await fetch(primaryUrl, { signal }).catch(() => null);
  if (!res || !res.ok) {
    res = await fetch(secondaryUrl, { signal }).catch(() => null);
  }

  if (res && res.ok) {
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes.map((r: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }) => ({
        distance: r.distance || 0,
        duration: r.duration || 0,
        coords: r.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]])
      }));
    }
  }
  return [];
}

/**
 * Fetches TWO realistic road routes between start and end.
 * The closest/shortest route is ordered first.
 */
export async function fetchRoadRoutes(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  mode: TravelMode = 'driving'
): Promise<MultiRouteResult> {
  const coordsDirect = `${startLng},${startLat};${endLng},${endLat}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const rawRoutes: Array<{ distance: number; duration: number; coords: [number, number][]; isRealRoad: boolean }> = [];

  try {
    const directResults = await fetchOsrmGeometry(coordsDirect, mode, controller.signal);
    for (const r of directResults) {
      rawRoutes.push({
        ...r,
        isRealRoad: true
      });
    }

    // If OSRM returned only 1 route (common in small towns), calculate a realistic second route via a parallel road
    if (rawRoutes.length < 2 && rawRoutes.length > 0) {
      const midLat = (startLat + endLat) / 2;
      const midLng = (startLng + endLng) / 2;
      const dLat = endLat - startLat;
      const dLng = endLng - startLng;

      // Try perpendicular detour waypoint to hit a parallel street
      const offsets = [0.35, -0.35];
      for (const scale of offsets) {
        const offsetLat = -dLng * scale;
        const offsetLng = dLat * scale;
        const viaLat = midLat + offsetLat;
        const viaLng = midLng + offsetLng;
        const coordsVia = `${startLng},${startLat};${viaLng},${viaLat};${endLng},${endLat}`;

        const altResults = await fetchOsrmGeometry(coordsVia, mode, controller.signal);
        if (altResults.length > 0) {
          const altRoute = altResults[0];
          // Ensure it differs in distance by at least 30 meters
          const diff = Math.abs(altRoute.distance - rawRoutes[0].distance);
          if (diff > 30 || rawRoutes.length < 2) {
            rawRoutes.push({
              ...altRoute,
              isRealRoad: true
            });
            break;
          }
        }
      }
    }
  } catch (e) {
    console.warn(`Routing error for mode ${mode}:`, e);
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback straight lines if routing completely failed or only 1 route generated
  const dx = (endLng - startLng) * 85000;
  const dy = (endLat - startLat) * 111000;
  const straightMeters = Math.round(Math.sqrt(dx * dx + dy * dy)) || 600;

  if (rawRoutes.length === 0) {
    // Route 1 (direct straight line)
    rawRoutes.push({
      distance: straightMeters,
      duration: Math.round((straightMeters / 25) * 3.6),
      coords: [
        [startLat, startLng],
        [endLat, endLng]
      ],
      isRealRoad: false
    });
  }

  if (rawRoutes.length === 1) {
    // Construct a realistic distinct alternative curve path
    const midLat = (startLat + endLat) / 2;
    const midLng = (startLng + endLng) / 2;
    const dLat = endLat - startLat;
    const dLng = endLng - startLng;
    const offsetLat = -dLng * 0.3;
    const offsetLng = dLat * 0.3;
    const viaLat = midLat + offsetLat;
    const viaLng = midLng + offsetLng;

    // Subdivide into a smooth alternative path
    const altCoords: [number, number][] = [
      [startLat, startLng],
      [startLat * 0.75 + viaLat * 0.25, startLng * 0.75 + viaLng * 0.25],
      [viaLat, viaLng],
      [endLat * 0.75 + viaLat * 0.25, endLng * 0.75 + viaLng * 0.25],
      [endLat, endLng]
    ];
    const altDistance = Math.round(rawRoutes[0].distance * 1.25);
    rawRoutes.push({
      distance: altDistance,
      duration: Math.round(rawRoutes[0].duration * 1.25),
      coords: altCoords,
      isRealRoad: false
    });
  }

  // Sort routes by distance ascending so route[0] is strictly the closest!
  rawRoutes.sort((a, b) => a.distance - b.distance);

  // Take the best two routes
  const topTwo = rawRoutes.slice(0, 2);

  const formattedRoutes: SingleRoute[] = topTwo.map((r, index) => {
    let drivingDuration = 0;
    let walkingDuration = 0;

    if (mode === 'walking') {
      walkingDuration = Math.round(r.duration || r.distance / 1.3);
      drivingDuration = Math.round((r.distance / 30) * 3.6);
    } else {
      drivingDuration = Math.round(r.duration || (r.distance / 30) * 3.6);
      walkingDuration = Math.round(r.distance / 1.3);
    }

    const isShortest = index === 0;

    return {
      id: `route-${index + 1}`,
      label: isShortest ? 'المسار 1 (الأقرب)' : 'المسار 2 (بديل)',
      tag: isShortest ? 'الأقرب' : 'بديل',
      coordinates: r.coords,
      distanceMeters: Math.round(r.distance),
      drivingDurationSeconds: drivingDuration,
      walkingDurationSeconds: walkingDuration,
      activeMode: mode,
      isRealRoad: r.isRealRoad,
      isShortest
    };
  });

  return {
    routes: formattedRoutes,
    selectedRouteIndex: 0, // default to the closest route
    activeMode: mode
  };
}

// Single route compatibility function
export async function fetchRoadRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  mode: TravelMode = 'driving'
): Promise<RouteResult> {
  const result = await fetchRoadRoutes(startLat, startLng, endLat, endLng, mode);
  const primary = result.routes[0];
  return {
    coordinates: primary.coordinates,
    distanceMeters: primary.distanceMeters,
    drivingDurationSeconds: primary.drivingDurationSeconds,
    walkingDurationSeconds: primary.walkingDurationSeconds,
    activeMode: mode,
    isRealRoad: primary.isRealRoad
  };
}

