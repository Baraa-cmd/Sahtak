import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Compass,
  Navigation,
  ExternalLink,
  Phone,
  MessageCircle,
  X,
  Clock,
  Timer,
  Car,
  Footprints,
  Loader2,
  Route,
  Crosshair,
  MousePointerClick,
  Check
} from 'lucide-react';
import {
  Pharmacy,
  Nurse,
  Hospital,
  UserLocation,
  MapStyleMode,
  MapLayerState,
  SelectedRouteTarget
} from '../types';
import {
  fetchRoadRoutes,
  MultiRouteResult,
  SingleRoute,
  TravelMode,
  formatDistanceArabic,
  formatDurationArabic
} from '../lib/routing';
import { formatArabicTime } from '../lib/initialData';

interface MapViewProps {
  userLocation: UserLocation;
  pharmacies: Pharmacy[];
  nurses: Nurse[];
  hospitals: Hospital[];
  selectedTarget: SelectedRouteTarget | null;
  onClearSelectedTarget: () => void;
  onSelectTarget: (target: SelectedRouteTarget) => void;
  isManualPickerActive?: boolean;
  onToggleManualPicker?: (active: boolean) => void;
  onSetUserLocation?: (lat: number, lng: number, name?: string) => void;
  onOpenLocationModal?: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  userLocation,
  pharmacies,
  nurses,
  hospitals,
  selectedTarget,
  onClearSelectedTarget,
  onSelectTarget,
  isManualPickerActive = false,
  onToggleManualPicker,
  onSetUserLocation,
  onOpenLocationModal
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routePolylinesRef = useRef<L.Layer[]>([]);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapStyle, setMapStyle] = useState<MapStyleMode>('default');
  const [layers, setLayers] = useState<MapLayerState>({
    pharmacies: true,
    nurses: true,
    hospitals: true
  });

  // Multi-route states
  const [isRouteDrawn, setIsRouteDrawn] = useState(false);
  const [availableRoutes, setAvailableRoutes] = useState<SingleRoute[]>([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0);
  const availableRoutesRef = useRef<SingleRoute[]>([]);
  const activeRouteIndexRef = useRef<number>(0);

  const [showPopup, setShowPopup] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distanceText: string;
    drivingDurationText: string;
    walkingDurationText: string;
    isRealRoad: boolean;
    routeLabel?: string;
  } | null>(null);

  const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const SATELLITE_TILE_URL =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  // Custom Markers
  const createPharmacyIcon = (isOnDuty: boolean) => {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
          ${
            isOnDuty
              ? '<div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: rgba(16, 185, 129, 0.4); animation: duty-pulse 2s infinite;"></div>'
              : ''
          }
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #059669; border: 2.5px solid #ffffff; box-shadow: 0 3px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
              <path d="m8.5 8.5 7 7"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  const createNurseIcon = (isOnDuty: boolean, isAvailable: boolean) => {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
          ${
            isOnDuty
              ? '<div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: rgba(2, 132, 199, 0.4); animation: duty-pulse 2s infinite;"></div>'
              : ''
          }
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 3px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
              <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
              <circle cx="20" cy="10" r="2"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  const createHospitalIcon = () => {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #dc2626; border: 2.5px solid #ffffff; box-shadow: 0 3px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 6v12"/>
              <path d="M6 12h12"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  const createUserIcon = () => {
    return L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(37, 99, 235, 0.35); animation: duty-pulse 1.8s infinite;"></div>
          <div style="width: 18px; height: 18px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userLocation.latitude, userLocation.longitude],
      zoom: 15,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileUrl = mapStyle === 'satellite' ? SATELLITE_TILE_URL : DEFAULT_TILE_URL;
    const tileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap & Esri',
      maxZoom: 19
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    markersLayerRef.current = markersGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer on Style Switch
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const newUrl = mapStyle === 'satellite' ? SATELLITE_TILE_URL : DEFAULT_TILE_URL;
    tileLayerRef.current.setUrl(newUrl);
  }, [mapStyle]);

  // Handle pin click: Show details FIRST, do not draw route immediately
  const handlePinClick = (target: SelectedRouteTarget) => {
    // Clear any previous polylines
    if (mapInstanceRef.current && routePolylinesRef.current.length > 0) {
      routePolylinesRef.current.forEach((polyline) => {
        mapInstanceRef.current?.removeLayer(polyline);
      });
      routePolylinesRef.current = [];
    }
    setIsRouteDrawn(false);
    setRouteInfo(null);
    setAvailableRoutes([]);
    availableRoutesRef.current = [];
    setActiveRouteIndex(0);
    activeRouteIndexRef.current = 0;
    setShowPopup(true);

    // Pan map to pin
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([target.latitude, target.longitude]);
    }

    onSelectTarget(target);
  };

  // Sync selectedTarget from props (e.g., from pharmacies list)
  useEffect(() => {
    if (selectedTarget) {
      setShowPopup(true);
      setIsRouteDrawn(false);
      if (mapInstanceRef.current && routePolylinesRef.current.length > 0) {
        routePolylinesRef.current.forEach((polyline) => {
          mapInstanceRef.current?.removeLayer(polyline);
        });
        routePolylinesRef.current = [];
      }
      setAvailableRoutes([]);
      availableRoutesRef.current = [];
      setActiveRouteIndex(0);
      activeRouteIndexRef.current = 0;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo([selectedTarget.latitude, selectedTarget.longitude]);
      }
    } else {
      setShowPopup(false);
      setIsRouteDrawn(false);
      if (mapInstanceRef.current && routePolylinesRef.current.length > 0) {
        routePolylinesRef.current.forEach((polyline) => {
          mapInstanceRef.current?.removeLayer(polyline);
        });
        routePolylinesRef.current = [];
      }
      setAvailableRoutes([]);
      availableRoutesRef.current = [];
    }
  }, [selectedTarget]);

  // Click on map to set location if manual picker mode is active
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isManualPickerActive && onSetUserLocation) {
        onSetUserLocation(e.latlng.lat, e.latlng.lng, 'موقع محدد بنقرة الخريطة 🎯');
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isManualPickerActive, onSetUserLocation]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // User marker - Draggable to allow pinpoint manual adjustment
    const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
      icon: createUserIcon(),
      zIndexOffset: 1000,
      draggable: true
    }).bindTooltip('📍 موقعك (يمكنك سحب هذا الدبوس لتعديل مكانك بدقة)', {
      direction: 'top',
      offset: [0, -14]
    });

    userMarker.on('dragend', (e) => {
      const pos = (e.target as L.Marker).getLatLng();
      if (onSetUserLocation) {
        onSetUserLocation(pos.lat, pos.lng, 'موقع محدد بالسحب 📍');
      }
    });

    markersGroup.addLayer(userMarker);

    // If auto detected location or location changes and no target is selected, gently pan map
    if (map && !selectedTarget) {
      map.panTo([userLocation.latitude, userLocation.longitude]);
    }

    // Pharmacies
    if (layers.pharmacies) {
      pharmacies.forEach((p) => {
        const marker = L.marker([p.latitude, p.longitude], {
          icon: createPharmacyIcon(p.isOnDuty)
        });
        marker.on('click', () => {
          handlePinClick({
            id: p.id,
            type: 'pharmacy',
            name: p.name,
            latitude: p.latitude,
            longitude: p.longitude,
            distanceKm: p.distanceKm,
            district: p.district
          });
        });
        markersGroup.addLayer(marker);
      });
    }

    // Nurses
    if (layers.nurses) {
      nurses.forEach((n) => {
        const marker = L.marker([n.latitude, n.longitude], {
          icon: createNurseIcon(n.isOnDuty, n.isAvailable)
        });
        marker.on('click', () => {
          handlePinClick({
            id: n.id,
            type: 'nurse',
            name: n.name,
            latitude: n.latitude,
            longitude: n.longitude,
            distanceKm: n.distanceKm,
            district: n.district
          });
        });
        markersGroup.addLayer(marker);
      });
    }

    // Hospitals
    if (layers.hospitals) {
      hospitals.forEach((h) => {
        const marker = L.marker([h.latitude, h.longitude], {
          icon: createHospitalIcon()
        });
        marker.on('click', () => {
          handlePinClick({
            id: h.id,
            type: 'hospital',
            name: h.name,
            latitude: h.latitude,
            longitude: h.longitude,
            distanceKm: h.distanceKm,
            district: h.district
          });
        });
        markersGroup.addLayer(marker);
      });
    }
  }, [pharmacies, nurses, hospitals, layers, userLocation]);

  // Helper to clear existing route polylines
  const clearRoutePolylines = () => {
    if (mapInstanceRef.current && routePolylinesRef.current.length > 0) {
      routePolylinesRef.current.forEach((polyline) => {
        mapInstanceRef.current?.removeLayer(polyline);
      });
    }
    routePolylinesRef.current = [];
  };

  // Render both routes on the Leaflet map:
  // - The active route in vibrant Blue (#2563eb) on top
  // - The inactive route in Slate Gray (#94a3b8) underneath
  // - Clicking the inactive gray route on the map switches it to Blue!
  const renderRoutePolylinesOnMap = (
    routesList: SingleRoute[],
    activeIdx: number,
    fitBounds = true
  ) => {
    if (!mapInstanceRef.current || routesList.length === 0) return;
    const map = mapInstanceRef.current;

    clearRoutePolylines();

    const allCoords: [number, number][] = [];

    // Order of drawing: draw inactive first so active is on top
    const renderOrder = routesList.map((_, i) => i).sort((a, b) => {
      if (a === activeIdx) return 1;
      if (b === activeIdx) return -1;
      return 0;
    });

    renderOrder.forEach((idx) => {
      const route = routesList[idx];
      if (!route || !route.coordinates || route.coordinates.length === 0) return;

      const isSelected = idx === activeIdx;
      // Blue (#2563eb) for the selected route; Gray (#94a3b8) for the unselected route
      const color = isSelected ? '#2563eb' : '#94a3b8';
      const weight = isSelected ? 7 : 5.5;
      const opacity = isSelected ? 0.95 : 0.75;

      // Transparent wide buffer for effortless tapping on touch screens and clicking
      const hitBuffer = L.polyline(route.coordinates, {
        color: '#000000',
        weight: 26,
        opacity: 0.0001,
        className: 'cursor-pointer'
      }).addTo(map);

      const polyline = L.polyline(route.coordinates, {
        color,
        weight,
        opacity,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: !isSelected && route.activeMode === 'walking' ? '6, 6' : undefined,
        className: isSelected
          ? 'cursor-pointer active-route-polyline'
          : 'cursor-pointer inactive-route-polyline'
      }).addTo(map);

      // Tooltip on the route line
      const tooltipContent = isSelected
        ? `<div class="text-right font-sans text-xs py-0.5">
             <div class="font-bold text-blue-700">✓ ${route.label} (المسار المختار)</div>
             <div class="text-[11px] text-slate-600">${formatDistanceArabic(route.distanceMeters)} - ${
            travelMode === 'driving'
              ? formatDurationArabic(route.drivingDurationSeconds)
              : formatDurationArabic(route.walkingDurationSeconds)
          }</div>
           </div>`
        : `<div class="text-right font-sans text-xs py-0.5">
             <div class="font-bold text-slate-700">🔄 ${route.label}</div>
             <div class="text-[11px] text-slate-600 font-semibold">${formatDistanceArabic(route.distanceMeters)} - اضغط هنا لاختياره بالأزرق</div>
           </div>`;

      polyline.bindTooltip(tooltipContent, {
        sticky: true,
        direction: 'top',
        opacity: 0.95
      });

      // Hover styling
      const handleMouseOver = () => {
        if (idx !== activeRouteIndexRef.current) {
          polyline.setStyle({ color: '#475569', weight: 6.5, opacity: 0.95 });
        }
      };
      const handleMouseOut = () => {
        if (idx !== activeRouteIndexRef.current) {
          polyline.setStyle({ color: '#94a3b8', weight: 5.5, opacity: 0.75 });
        }
      };

      polyline.on('mouseover', handleMouseOver);
      polyline.on('mouseout', handleMouseOut);
      hitBuffer.on('mouseover', handleMouseOver);
      hitBuffer.on('mouseout', handleMouseOut);

      // Interactive Click directly on map route: switches selection and turns line blue!
      const handleRouteClick = (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        handleSelectRoute(idx);
      };

      polyline.on('click', handleRouteClick);
      hitBuffer.on('click', handleRouteClick);

      // Mid-route interactive badge so the user clearly sees where to tap and which route is which
      const midIdx = Math.floor(route.coordinates.length / 2);
      const midCoord = route.coordinates[midIdx];
      if (midCoord && routesList.length > 1) {
        const badgeIcon = L.divIcon({
          className: 'route-badge-container',
          html: `<div class="px-2 py-0.5 rounded-full text-[11px] font-bold shadow-md cursor-pointer transition-all border border-white flex items-center gap-1 select-none whitespace-nowrap transform -translate-x-1/2 -translate-y-1/2 ${
            isSelected
              ? 'bg-blue-600 text-white ring-2 ring-blue-300'
              : 'bg-slate-700 hover:bg-slate-900 text-white ring-1 ring-slate-400'
          }">
            <span>${isSelected ? '✓ ' + route.label : route.label + ' (اضغط هنا)'}</span>
          </div>`,
          iconSize: [0, 0]
        });
        const badgeMarker = L.marker(midCoord, { icon: badgeIcon }).addTo(map);
        badgeMarker.on('click', handleRouteClick);
        routePolylinesRef.current.push(badgeMarker);
      }

      routePolylinesRef.current.push(polyline);
      routePolylinesRef.current.push(hitBuffer);
      route.coordinates.forEach((c) => allCoords.push(c));
    });

    if (fitBounds && allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 17
      });
    }
  };

  // Switch between the two routes
  const handleSelectRoute = (idx: number) => {
    setActiveRouteIndex(idx);
    activeRouteIndexRef.current = idx;
    const activeRoute = availableRoutesRef.current[idx];
    if (activeRoute) {
      setRouteInfo({
        distanceText: formatDistanceArabic(activeRoute.distanceMeters),
        drivingDurationText: formatDurationArabic(activeRoute.drivingDurationSeconds),
        walkingDurationText: formatDurationArabic(activeRoute.walkingDurationSeconds),
        isRealRoad: activeRoute.isRealRoad,
        routeLabel: activeRoute.label
      });
    }
    renderRoutePolylinesOnMap(availableRoutesRef.current, idx, false);
  };

  // Execute Real Road Routing with driving or walking mode (generates 2 routes, closest selected by default)
  const handleExecuteRoadRoute = (mode: TravelMode = travelMode) => {
    if (!selectedTarget || !mapInstanceRef.current) return;

    clearRoutePolylines();
    setTravelMode(mode);
    setIsCalculatingRoute(true);
    setIsRouteDrawn(true);
    // Hide popup after drawing as required
    setShowPopup(false);

    fetchRoadRoutes(
      userLocation.latitude,
      userLocation.longitude,
      selectedTarget.latitude,
      selectedTarget.longitude,
      mode
    )
      .then((result: MultiRouteResult) => {
        if (!mapInstanceRef.current) return;
        setIsCalculatingRoute(false);

        const routesList = result.routes;
        setAvailableRoutes(routesList);
        availableRoutesRef.current = routesList;

        // Default to the closest route (index 0)
        const defaultIdx = 0;
        setActiveRouteIndex(defaultIdx);
        activeRouteIndexRef.current = defaultIdx;

        const closestRoute = routesList[defaultIdx];
        if (closestRoute) {
          setRouteInfo({
            distanceText: formatDistanceArabic(closestRoute.distanceMeters),
            drivingDurationText: formatDurationArabic(closestRoute.drivingDurationSeconds),
            walkingDurationText: formatDurationArabic(closestRoute.walkingDurationSeconds),
            isRealRoad: closestRoute.isRealRoad,
            routeLabel: closestRoute.label
          });
        }

        renderRoutePolylinesOnMap(routesList, defaultIdx, true);
      })
      .catch((err) => {
        console.error('Failed to compute routes:', err);
        setIsCalculatingRoute(false);
      });
  };

  // Close details sheet and clear drawn route
  const handleCloseDetails = () => {
    clearRoutePolylines();
    setIsRouteDrawn(false);
    setRouteInfo(null);
    setAvailableRoutes([]);
    availableRoutesRef.current = [];
    setActiveRouteIndex(0);
    activeRouteIndexRef.current = 0;
    onClearSelectedTarget();
  };

  // Selected item details
  const selectedPharmacy =
    selectedTarget?.type === 'pharmacy'
      ? pharmacies.find((p) => p.id === selectedTarget.id)
      : null;

  const selectedNurse =
    selectedTarget?.type === 'nurse'
      ? nurses.find((n) => n.id === selectedTarget.id)
      : null;

  const selectedHospital =
    selectedTarget?.type === 'hospital'
      ? hospitals.find((h) => h.id === selectedTarget.id)
      : null;

  return (
    <div className="relative w-full h-[calc(100vh-125px)] flex flex-col overflow-hidden bg-slate-100">
      {/* SEPARATE DEDICATED TOP TOOLBAR - Placed outside the Leaflet container so the map can NEVER cover it! */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 z-30 shrink-0 space-y-1.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          {/* Map Style (Default vs Satellite) */}
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs font-bold">
            <button
              onClick={() => setMapStyle('default')}
              className={`px-3 py-1 rounded-md transition-all ${
                mapStyle === 'default'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              النمط العادي
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-3 py-1 rounded-md transition-all ${
                mapStyle === 'satellite'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              قمر صناعي 🛰️
            </button>
          </div>

          {/* Location Actions: Manual Picker + Re-center + Location Modal */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (onToggleManualPicker) {
                  onToggleManualPicker(!isManualPickerActive);
                }
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all border ${
                isManualPickerActive
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs ring-2 ring-emerald-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
              title="تحديد موقعي يدوياً على الخريطة بنقرة أو سحب"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isManualPickerActive ? 'text-white animate-spin' : 'text-emerald-700'}`} />
              <span>{isManualPickerActive ? 'وضع التحديد 🎯' : 'تحديد موقعي'}</span>
            </button>

            {/* Re-center Button */}
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo(
                    [userLocation.latitude, userLocation.longitude],
                    16
                  );
                }
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200"
              title="العودة لموقعي في دير حافر"
            >
              <Navigation className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>موقعي</span>
            </button>
          </div>
        </div>

        {/* Filter Layers Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() =>
              setLayers((prev) => ({ ...prev, pharmacies: !prev.pharmacies }))
            }
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
              layers.pharmacies
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            💊 الصيدليات ({pharmacies.length})
          </button>

          <button
            onClick={() =>
              setLayers((prev) => ({ ...prev, nurses: !prev.nurses }))
            }
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
              layers.nurses
                ? 'bg-sky-700 text-white'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            🩺 الممرضين ({nurses.length})
          </button>

          <button
            onClick={() =>
              setLayers((prev) => ({ ...prev, hospitals: !prev.hospitals }))
            }
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
              layers.hospitals
                ? 'bg-rose-700 text-white'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            🏥 المشافي والمستوصف ({hospitals.length})
          </button>
        </div>
      </div>

      {/* MANUAL PICKER INSTRUCTION BANNER */}
      {isManualPickerActive && (
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-3.5 py-2 z-20 shrink-0 shadow-md flex items-center justify-between gap-2 border-b border-emerald-600 animate-in fade-in slide-in-from-top duration-150">
          <div className="flex items-center gap-2 truncate">
            <Crosshair className="w-4 h-4 text-emerald-300 animate-spin shrink-0" />
            <div className="truncate">
              <span className="font-extrabold text-xs block leading-tight">
                انقر على مكانك في الخريطة 🎯
              </span>
              <span className="text-[10px] text-emerald-200 block leading-tight">
                أو اسحب الدبوس الأزرق إلى موقعك الدقيق
              </span>
            </div>
          </div>
          <button
            onClick={() => onToggleManualPicker?.(false)}
            className="px-3 py-1 bg-white text-emerald-900 rounded-xl text-xs font-black shrink-0 hover:bg-emerald-50 active:scale-95 shadow-xs transition-all"
          >
            حفظ الموقع ✓
          </button>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainerRef} className="flex-1 w-full relative z-10" />

      {/* PIN DETAILS MODAL/CARD: Shows details FIRST, with button to draw the route */}
      {selectedTarget && showPopup && (
        <div className="absolute bottom-20 left-3 right-3 z-40 max-w-md mx-auto animate-in fade-in slide-in-from-bottom duration-150">
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xl space-y-2.5 relative">
            {/* Close Button */}
            <button
              onClick={handleCloseDetails}
              className="absolute left-3 top-3 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header info */}
            <div className="pr-0 pl-6 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    selectedTarget.type === 'pharmacy'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedTarget.type === 'nurse'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedTarget.type === 'pharmacy'
                    ? 'صيدلية'
                    : selectedTarget.type === 'nurse'
                    ? 'ممرض منزلي'
                    : 'مركز صحي'}
                </span>

                {selectedPharmacy?.isOnDuty && (
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                    مناوبة ليلية 🌙
                  </span>
                )}

                {selectedNurse?.isOnDuty && (
                  <span className="text-[10px] font-black bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">
                    مناوب الآن ⚡
                  </span>
                )}
              </div>

              <h3 className="font-extrabold text-slate-900 text-sm">
                {selectedTarget.name}
              </h3>

              <p className="text-xs text-slate-500">{selectedTarget.district}</p>
            </div>

            {/* Pharmacy Timing with Arabic صباحاً / مساءً */}
            {selectedPharmacy && (
              <div className="text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatArabicTime(selectedPharmacy.dutyHours)}</span>
                </div>
                {selectedPharmacy.dutyEndTime && (
                  <div className="flex items-center gap-1 text-emerald-800 font-bold">
                    <Timer className="w-3.5 h-3.5" />
                    <span>حتى {formatArabicTime(selectedPharmacy.dutyEndTime)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Nurse Info */}
            {selectedNurse && (
              <p className="text-xs text-sky-900 font-semibold bg-sky-50 p-2 rounded-xl">
                {selectedNurse.title}
              </p>
            )}

            {/* Route Status if already drawn */}
            {isRouteDrawn && (
              <div className="bg-blue-50/70 rounded-xl p-2.5 border border-blue-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-blue-900">
                    {isCalculatingRoute ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                        <span>جاري حساب مسارات شوارع دير حافر...</span>
                      </>
                    ) : (
                      <>
                        {travelMode === 'driving' ? (
                          <Car className="w-3.5 h-3.5 text-blue-700" />
                        ) : (
                          <Footprints className="w-3.5 h-3.5 text-blue-700" />
                        )}
                        <span>المسار النشط:</span>
                        <span className="text-blue-900 font-black">
                          {availableRoutes[activeRouteIndex]?.label || routeInfo?.distanceText}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-black">
                    تم رسم المسارين
                  </span>
                </div>

                {/* Multi-route selection inside popup */}
                {availableRoutes.length > 1 && !isCalculatingRoute && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-blue-100">
                    {availableRoutes.map((r, idx) => {
                      const isSelected = idx === activeRouteIndex;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleSelectRoute(idx)}
                          className={`p-1.5 rounded-lg text-right transition-all border text-xs ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-semibold'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{r.label}</span>
                            {r.isShortest && (
                              <span
                                className={`text-[9px] px-1 rounded ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                الأقرب ⭐
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-[10px] flex items-center justify-between mt-0.5 ${
                              isSelected ? 'text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            <span>{formatDistanceArabic(r.distanceMeters)}</span>
                            <span>
                              {travelMode === 'driving'
                                ? formatDurationArabic(r.drivingDurationSeconds)
                                : formatDurationArabic(r.walkingDurationSeconds)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Travel Mode Selector in Popup */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 block">
                اختر وسيلة التوجه إلى الموقع:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTravelMode('driving')}
                  className={`py-1.5 px-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    travelMode === 'driving'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>بالسيارة 🚗</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTravelMode('walking')}
                  className={`py-1.5 px-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    travelMode === 'walking'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Footprints className="w-3.5 h-3.5" />
                  <span>مشياً على الأقدام 🚶‍♂️</span>
                </button>
              </div>
            </div>

            {/* Actions: Prominent Button to Draw Route + Contact Options */}
            <div className="space-y-1.5 pt-0.5">
              {/* BUTTON TO DRAW ROUTE: Only triggers when clicked */}
              {!isRouteDrawn && (
                <button
                  onClick={() => handleExecuteRoadRoute(travelMode)}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Route className="w-4 h-4" />
                  <span>
                    رسم المسار {travelMode === 'driving' ? 'بالسيارة 🚗' : 'مشياً على الأقدام 🚶‍♂️'}
                  </span>
                </button>
              )}

              <div className="flex items-center gap-2">
                {/* For Nurse: Phone & WhatsApp */}
                {selectedNurse && (
                  <>
                    <a
                      href={`tel:${selectedNurse.phone}`}
                      className="flex-1 bg-emerald-600 text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>اتصال</span>
                    </a>
                    <a
                      href={`https://wa.me/${selectedNurse.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-sky-700 text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>واتساب</span>
                    </a>
                  </>
                )}

                {/* For Hospital: Emergency Call */}
                {selectedHospital && (
                  <a
                    href={`tel:${selectedHospital.emergencyPhone}`}
                    className="flex-1 bg-rose-600 text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>اتصال بالطوارئ</span>
                  </a>
                )}

                {/* External Maps Navigation Link */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedTarget.latitude},${selectedTarget.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    selectedPharmacy
                      ? isRouteDrawn
                        ? 'w-full bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-800 text-white'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>فتح في خرائط الهاتف</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPACT FLOATING STRIP WHEN ROUTE IS ACTIVE (Popup is hidden as requested) */}
      {selectedTarget && isRouteDrawn && !showPopup && (
        <div className="absolute bottom-20 left-3 right-3 z-40 max-w-md mx-auto animate-in fade-in slide-in-from-bottom duration-150">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 px-3 border border-slate-200 shadow-lg space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 shrink-0">
                  {travelMode === 'driving' ? (
                    <Car className="w-4 h-4" />
                  ) : (
                    <Footprints className="w-4 h-4" />
                  )}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {selectedTarget.name}
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      {availableRoutes[activeRouteIndex]?.label || 'المسار الأقرب'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {travelMode === 'driving'
                      ? 'مسار السيارات بالشوارع 🚗'
                      : 'مسار المشاة والممرات والأزقة 🚶‍♂️'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setShowPopup(true)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                  title="عرض تفاصيل المكان"
                >
                  التفاصيل
                </button>

                <button
                  onClick={handleCloseDetails}
                  className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all"
                  title="إلغاء رسم المسار"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* TWO ROUTE SELECTOR BUTTONS */}
            {availableRoutes.length > 1 && (
              <div className="space-y-1 pt-0.5">
                <div className="grid grid-cols-2 gap-1.5">
                  {availableRoutes.map((route, idx) => {
                    const isSelected = idx === activeRouteIndex;
                    return (
                      <button
                        key={route.id}
                        type="button"
                        onClick={() => handleSelectRoute(idx)}
                        className={`p-2 rounded-xl text-right transition-all flex flex-col gap-0.5 border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-extrabold flex items-center gap-1.5 ${
                              isSelected ? 'text-white' : 'text-slate-800'
                            }`}
                          >
                            <span
                              className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
                                isSelected ? 'bg-white ring-2 ring-blue-200' : 'bg-slate-400'
                              }`}
                            />
                            {route.label}
                          </span>
                          {route.isShortest && (
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-black ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              الأقرب ⭐
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-[11px] flex items-center justify-between gap-1 font-semibold ${
                            isSelected ? 'text-blue-100' : 'text-slate-500'
                          }`}
                        >
                          <span>{formatDistanceArabic(route.distanceMeters)}</span>
                          <span>
                            {travelMode === 'driving'
                              ? formatDurationArabic(route.drivingDurationSeconds)
                              : formatDurationArabic(route.walkingDurationSeconds)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-center text-slate-500 font-medium">
                  💡 اضغط على المسار الرمادي بالخريطة مباشرة ليتحول إلى الأزرق
                </p>
              </div>
            )}

            {/* Quick Toggle for Car vs Walking with Times */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleExecuteRoadRoute('driving')}
                className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  travelMode === 'driving'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>بالسيارة:</span>
                <span
                  className={
                    travelMode === 'driving' ? 'text-emerald-100' : 'text-emerald-800 font-extrabold'
                  }
                >
                  {routeInfo?.drivingDurationText || '2 دقيقة'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleExecuteRoadRoute('walking')}
                className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  travelMode === 'walking'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>مشياً:</span>
                <span
                  className={
                    travelMode === 'walking' ? 'text-emerald-100' : 'text-emerald-800 font-extrabold'
                  }
                >
                  {routeInfo?.walkingDurationText || '8 دقائق'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
