import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { X, BellRing } from 'lucide-react';
import {
  Pharmacy,
  Nurse,
  Hospital,
  UserLocation,
  ActiveTab,
  SelectedRouteTarget,
  CommunityReport,
  AppUser,
  AuthSession
} from './types';
import {
  INITIAL_PHARMACIES,
  INITIAL_NURSES,
  INITIAL_HOSPITALS,
  DAYR_HAFIR_DEFAULT,
  calculateDistanceKm,
  PresetDistrict
} from './lib/initialData';
import {
  detectRealLocationAutomatically
} from './lib/locationDetector';
import {
  subscribeToPharmacies,
  subscribeToNurses,
  subscribeToHospitals,
  subscribeToUsers,
  seedInitialDataIfEmpty
} from './lib/firebase';
import { offlineStorage, DEFAULT_ADMIN_USER } from './lib/offlineStorage';
import { notificationService } from './lib/notifications';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { PharmaciesView } from './components/PharmaciesView';
import { NursesView } from './components/NursesView';
import { HospitalsView } from './components/HospitalsView';
import { MapView } from './components/MapView';
import { AuthModal } from './components/AuthModal';
import { LocationModal } from './components/LocationModal';
import { CommunityReportModal } from './components/CommunityReportModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('pharmacies');

  // User Location (Centered in Dayr Hafir or restored from cache)
  const [userLocation, setUserLocation] = useState<UserLocation>(() => {
    const cached = offlineStorage.getUserLocation();
    if (cached && typeof cached.latitude === 'number' && typeof cached.longitude === 'number') {
      return cached;
    }
    return {
      latitude: DAYR_HAFIR_DEFAULT.latitude,
      longitude: DAYR_HAFIR_DEFAULT.longitude,
      districtName: DAYR_HAFIR_DEFAULT.districtName,
      isAuto: false,
      source: 'default'
    };
  });
  const [isLocating, setIsLocating] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Auth & Roles State
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    return offlineStorage.getAuthSession();
  });
  const [users, setUsers] = useState<AppUser[]>(() => {
    return offlineStorage.getUsers() || [DEFAULT_ADMIN_USER];
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Network Online/Offline state
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Notifications state
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    notificationService.getPermission() === 'granted'
  );

  // Provider Modal state
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);

  // Community Reporting state
  const [communityModalTarget, setCommunityModalTarget] = useState<{
    id: string;
    name: string;
    type: 'pharmacy' | 'nurse' | 'hospital';
    district?: string;
    currentPhone?: string;
    isOnDuty?: boolean;
  } | null>(null);
  const [communityToast, setCommunityToast] = useState<string | null>(null);

  // Duty Alert Toast state & refs for tracking on-duty changes
  const [dutyToast, setDutyToast] = useState<{
    id: string;
    title: string;
    pharmacyName: string;
    district?: string;
    dutyEndTime?: string;
  } | null>(null);
  const isInitialPharmaciesLoadRef = useRef(true);
  const previousOnDutyPharmaciesRef = useRef<Map<string, boolean>>(new Map());

  // Selected Target for direct map routing
  const [selectedRouteTarget, setSelectedRouteTarget] = useState<SelectedRouteTarget | null>(null);

  // Data states
  const [rawPharmacies, setRawPharmacies] = useState<Pharmacy[]>(() => {
    return offlineStorage.getPharmacies() || INITIAL_PHARMACIES;
  });

  const [rawNurses, setRawNurses] = useState<Nurse[]>(() => {
    return offlineStorage.getNurses() || INITIAL_NURSES;
  });

  const [rawHospitals, setRawHospitals] = useState<Hospital[]>(() => {
    return offlineStorage.getHospitals() || INITIAL_HOSPITALS;
  });

  // Track online / offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Choose preset district in Dayr Hafir
  const handleSelectPresetDistrict = useCallback((preset: PresetDistrict) => {
    const newLoc: UserLocation = {
      latitude: preset.latitude,
      longitude: preset.longitude,
      districtName: `دير حافر - ${preset.name}`,
      isAuto: false,
      source: 'preset'
    };
    setUserLocation(newLoc);
    offlineStorage.saveUserLocation(newLoc);
  }, []);

  const [detectionNotice, setDetectionNotice] = useState<string | null>(null);

  // Automatic multi-tier location detector (GPS + IP Fallback + Arabic Reverse Geocode)
  const handleDetectLocation = useCallback(async () => {
    setIsLocating(true);
    setDetectionNotice('جاري تحديد موقعك الفعلي تلقائياً...');
    try {
      const detected = await detectRealLocationAutomatically((interim) => {
        setUserLocation(interim);
        offlineStorage.saveUserLocation(interim);
      });
      setUserLocation(detected);
      offlineStorage.saveUserLocation(detected);
      if (detected.source === 'gps') {
        setDetectionNotice(`📍 تم تحديد موقعك الدقيق عبر GPS: ${detected.districtName}`);
      } else if (detected.source === 'ip') {
        setDetectionNotice(`🌐 تم تحديد موقعك تلقائياً عبر الشبكة: ${detected.districtName}`);
      } else {
        setDetectionNotice(`📍 الموقع الافتراضي: ${detected.districtName}`);
      }
      setTimeout(() => setDetectionNotice(null), 5000);
    } catch (err) {
      console.warn('Auto location detection error:', err);
      setDetectionNotice(null);
    } finally {
      setIsLocating(false);
    }
  }, []);

  // Run automatic location detection immediately on initial mount
  useEffect(() => {
    handleDetectLocation();
  }, [handleDetectLocation]);

  // Continuous background GPS watcher (silently locks to high accuracy when available)
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation((current) => {
          // If within 15 meters, skip update to avoid unnecessary re-renders
          if (
            current.source === 'gps' &&
            Math.abs(current.latitude - latitude) < 0.00015 &&
            Math.abs(current.longitude - longitude) < 0.00015
          ) {
            return current;
          }
          const updated: UserLocation = {
            latitude,
            longitude,
            districtName: current.source === 'gps' && current.districtName ? current.districtName : 'موقعك الفعلي المباشر (GPS)',
            isAuto: true,
            source: 'gps'
          };
          offlineStorage.saveUserLocation(updated);
          return updated;
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000 }
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Seed and subscribe to Firebase Firestore
  useEffect(() => {
    seedInitialDataIfEmpty();

    const unsubPharmacies = subscribeToPharmacies((data) => {
      if (isInitialPharmaciesLoadRef.current) {
        // Initialize reference map on first load without triggering alerts
        isInitialPharmaciesLoadRef.current = false;
        const initialMap = new Map<string, boolean>();
        data.forEach((p) => {
          initialMap.set(p.id, !!p.isOnDuty);
        });
        previousOnDutyPharmaciesRef.current = initialMap;
        setRawPharmacies(data);
        return;
      }

      // Check for any pharmacy that became on-duty (e.g. updated by admin/manager)
      const prevMap = previousOnDutyPharmaciesRef.current;
      const newlyOnDutyList = data.filter((p) => {
        const wasOnDuty = prevMap.get(p.id) ?? false;
        return p.isOnDuty && !wasOnDuty;
      });

      // Update map for future real-time diffing
      const updatedMap = new Map<string, boolean>();
      data.forEach((p) => {
        updatedMap.set(p.id, !!p.isOnDuty);
      });
      previousOnDutyPharmaciesRef.current = updatedMap;

      // Broadcast push notifications and banner to users
      newlyOnDutyList.forEach((p) => {
        const cleanName = notificationService.formatPharmacyName(p.name);

        // Send Web/PWA Push Notification: "تناوب الليلة : صيدلية كذا"
        notificationService.sendDutyNotification(p.name, p.dutyEndTime, p.district);

        setDutyToast({
          id: p.id,
          title: `تناوب الليلة : ${cleanName}`,
          pharmacyName: cleanName,
          district: p.district,
          dutyEndTime: p.dutyEndTime
        });

        setTimeout(() => {
          setDutyToast((current) => (current?.id === p.id ? null : current));
        }, 7000);
      });

      setRawPharmacies(data);
    });

    const unsubNurses = subscribeToNurses((data) => {
      setRawNurses(data);
    });

    const unsubHospitals = subscribeToHospitals((data) => {
      setRawHospitals(data);
    });

    const unsubUsers = subscribeToUsers((data) => {
      setUsers(data);
    });

    return () => {
      unsubPharmacies();
      unsubNurses();
      unsubHospitals();
      unsubUsers();
    };
  }, []);

  // Request notifications permission
  const handleRequestNotifications = async () => {
    const perm = await notificationService.requestPermission();
    const granted = perm === 'granted';
    setNotificationsEnabled(granted);
    if (granted) {
      notificationService.sendNotification('منصة صحتك - دير حافر 🩺', {
        body: 'تم تفعيل التنبيهات اللحظية للمناوبات والطوارئ بنجاح.'
      });
    }
  };

  // Compute live distances for all items
  const pharmaciesWithDistance = useMemo(() => {
    return rawPharmacies.map((p) => ({
      ...p,
      distanceKm: calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        p.latitude,
        p.longitude
      )
    }));
  }, [rawPharmacies, userLocation]);

  const nursesWithDistance = useMemo(() => {
    return rawNurses.map((n) => ({
      ...n,
      distanceKm: calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        n.latitude,
        n.longitude
      )
    }));
  }, [rawNurses, userLocation]);

  const hospitalsWithDistance = useMemo(() => {
    return rawHospitals.map((h) => ({
      ...h,
      distanceKm: calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        h.latitude,
        h.longitude
      )
    }));
  }, [rawHospitals, userLocation]);

  // Handle selecting a target for route drawing on map
  const handleSelectOnMap = (target: SelectedRouteTarget) => {
    setSelectedRouteTarget(target);
    setActiveTab('map');
  };

  // Quick SOS Action (110)
  const handleEmergencySOS = () => {
    window.location.href = 'tel:110';
  };

  // Open Community Report modal for an entity
  const handleOpenCommunityReport = useCallback(
    (target: {
      id: string;
      name: string;
      type: 'pharmacy' | 'nurse' | 'hospital';
      district?: string;
      currentPhone?: string;
      isOnDuty?: boolean;
    }) => {
      setCommunityModalTarget(target);
    },
    []
  );

  // Submit community report and update state/cache
  const handleSubmitCommunityReport = useCallback(
    (report: CommunityReport, autoUpdateDuty?: boolean | null) => {
      offlineStorage.saveCommunityReport(report);

      if (report.targetType === 'pharmacy') {
        setRawPharmacies((prev) => {
          const updated = prev.map((p) => {
            if (p.id === report.targetId) {
              return {
                ...p,
                isOnDuty:
                  autoUpdateDuty !== null && autoUpdateDuty !== undefined
                    ? autoUpdateDuty
                    : p.isOnDuty,
                isOpen: autoUpdateDuty === true ? true : p.isOpen,
                communityVerifiedAt: new Date().toISOString()
              };
            }
            return p;
          });
          offlineStorage.savePharmacies(updated);
          return updated;
        });
      } else if (report.targetType === 'nurse') {
        setRawNurses((prev) => {
          const updated = prev.map((n) => {
            if (n.id === report.targetId) {
              return {
                ...n,
                isOnDuty:
                  autoUpdateDuty !== null && autoUpdateDuty !== undefined
                    ? autoUpdateDuty
                    : n.isOnDuty,
                phone: report.suggestedPhone ? report.suggestedPhone : n.phone,
                communityVerifiedAt: new Date().toISOString()
              };
            }
            return n;
          });
          offlineStorage.saveNurses(updated);
          return updated;
        });
      } else if (report.targetType === 'hospital') {
        setRawHospitals((prev) => {
          const updated = prev.map((h) => {
            if (h.id === report.targetId) {
              return {
                ...h,
                emergencyPhone: report.suggestedPhone
                  ? report.suggestedPhone
                  : h.emergencyPhone,
                communityVerifiedAt: new Date().toISOString()
              };
            }
            return h;
          });
          offlineStorage.saveHospitals(updated);
          return updated;
        });
      }

      setCommunityToast(
        `تم تسجيل وتوثيق تحديثك حول ${report.targetName} بنجاح! شكراً لمساهمتك في خدمة أهالي دير حافر 🌟`
      );
      setTimeout(() => setCommunityToast(null), 5000);
    },
    []
  );

  // Counts of on-duty items
  const onDutyPharmaciesCount = useMemo(
    () => rawPharmacies.filter((p) => p.isOnDuty).length,
    [rawPharmacies]
  );
  const onDutyNursesCount = useMemo(
    () => rawNurses.filter((n) => n.isOnDuty).length,
    [rawNurses]
  );

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center selection:bg-emerald-500 selection:text-white">
      {/* Mobile-First Shell */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen shadow-xl flex flex-col relative overflow-x-hidden">
        {/* Sticky Header */}
        <Header
          userLocation={userLocation}
          isLocating={isLocating}
          onRefreshLocation={handleDetectLocation}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          isOnline={isOnline}
          notificationsEnabled={notificationsEnabled}
          onRequestNotifications={handleRequestNotifications}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          session={authSession}
          onEmergencySOS={handleEmergencySOS}
        />

        {/* Automatic Location Notification Toast */}
        {detectionNotice && (
          <div className="bg-emerald-800 text-white text-xs px-3.5 py-1.5 flex items-center justify-between shadow-sm animate-fadeIn z-30 shrink-0">
            <span className="truncate font-medium">{detectionNotice}</span>
            <button
              onClick={() => setDetectionNotice(null)}
              className="text-emerald-200 hover:text-white mr-2 text-base font-bold leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Real-time Duty Push Notification In-App Toast: "تناوب الليلة : صيدلية كذا" */}
        {dutyToast && (
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white text-xs px-4 py-3 flex items-center justify-between shadow-xl animate-fadeIn z-35 shrink-0 border-b-2 border-amber-400">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-sm shrink-0 shadow-sm animate-pulse">
                🌙
              </div>
              <div>
                <div className="font-black text-amber-300 text-xs">
                  {dutyToast.title}
                </div>
                <div className="text-[11px] text-emerald-100 font-medium">
                  {dutyToast.dutyEndTime ? `المناوبة حتى ${dutyToast.dutyEndTime}` : 'متاحة الآن طوال الليل'}
                  {dutyToast.district ? ` • ${dutyToast.district}` : ''}
                </div>
              </div>
            </div>
            <button
              onClick={() => setDutyToast(null)}
              className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Community Toast Notification */}
        {communityToast && (
          <div className="bg-emerald-800 text-white text-xs px-3.5 py-2 flex items-center justify-between shadow-md animate-fadeIn z-30 shrink-0 border-b border-emerald-600/40">
            <span className="font-bold">{communityToast}</span>
            <button
              onClick={() => setCommunityToast(null)}
              className="text-emerald-200 hover:text-white mr-2 text-base font-bold leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'pharmacies' && (
            <PharmaciesView
              pharmacies={pharmaciesWithDistance}
              onSelectOnMap={handleSelectOnMap}
              onOpenCommunityReport={handleOpenCommunityReport}
              notificationsEnabled={notificationsEnabled}
              onRequestNotifications={handleRequestNotifications}
            />
          )}

          {activeTab === 'nurses' && (
            <NursesView
              nurses={nursesWithDistance}
              onSelectOnMap={handleSelectOnMap}
              onOpenCommunityReport={handleOpenCommunityReport}
            />
          )}

          {activeTab === 'hospitals' && (
            <HospitalsView
              hospitals={hospitalsWithDistance}
              onSelectOnMap={handleSelectOnMap}
              onOpenCommunityReport={handleOpenCommunityReport}
            />
          )}

          {activeTab === 'map' && (
            <MapView
              userLocation={userLocation}
              pharmacies={pharmaciesWithDistance}
              nurses={nursesWithDistance}
              hospitals={hospitalsWithDistance}
              selectedTarget={selectedRouteTarget}
              onClearSelectedTarget={() => setSelectedRouteTarget(null)}
              onSelectTarget={(target) => setSelectedRouteTarget(target)}
              onOpenLocationModal={() => setIsLocationModalOpen(true)}
            />
          )}
        </main>

        {/* Fixed Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onDutyPharmaciesCount={onDutyPharmaciesCount}
          onDutyNursesCount={onDutyNursesCount}
        />

        {/* Offline Indicator Banner */}
        <OfflineIndicator />

        {/* Location Picker & Troubleshoot Modal */}
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          userLocation={userLocation}
          isLocating={isLocating}
          onDetectGps={handleDetectLocation}
          onSelectPreset={handleSelectPresetDistrict}
        />

        {/* Community Report & Update Modal */}
        <CommunityReportModal
          isOpen={!!communityModalTarget}
          onClose={() => setCommunityModalTarget(null)}
          target={communityModalTarget}
          onSubmitReport={handleSubmitCommunityReport}
        />

        {/* Authentication & Role-Based Control Modal (Lock Screen / Provider Portal) */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          session={authSession}
          onLogin={(sess) => setAuthSession(sess)}
          onLogout={() => {
            setAuthSession(null);
            offlineStorage.saveAuthSession(null);
          }}
          users={users}
          pharmacies={rawPharmacies}
          nurses={rawNurses}
          onPharmacyUpdated={(updated) => {
            // Update previousOnDuty reference immediately to prevent duplicate alerts from Firestore echo
            previousOnDutyPharmaciesRef.current.set(updated.id, !!updated.isOnDuty);

            setRawPharmacies((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            );

            if (updated.isOnDuty) {
              const cleanName = notificationService.formatPharmacyName(updated.name);
              notificationService.sendDutyNotification(
                updated.name,
                updated.dutyEndTime,
                updated.district
              );

              setDutyToast({
                id: updated.id,
                title: `تناوب الليلة : ${cleanName}`,
                pharmacyName: cleanName,
                district: updated.district,
                dutyEndTime: updated.dutyEndTime
              });
              setTimeout(() => {
                setDutyToast((current) => (current?.id === updated.id ? null : current));
              }, 7000);
            }
          }}
          onNurseUpdated={(updated) => {
            setRawNurses((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            );
          }}
        />
      </div>
    </div>
  );
}
