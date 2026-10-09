import { Pharmacy, Nurse, Hospital, UserLocation } from '../types';

const CACHE_KEYS = {
  PHARMACIES: 'sehatuk_cached_pharmacies_v1',
  NURSES: 'sehatuk_cached_nurses_v1',
  HOSPITALS: 'sehatuk_cached_hospitals_v1',
  USER_LOCATION: 'sehatuk_cached_user_location_v1',
  LAST_SYNC: 'sehatuk_last_sync_timestamp'
};

export const offlineStorage = {
  saveUserLocation(loc: UserLocation): void {
    try {
      localStorage.setItem(CACHE_KEYS.USER_LOCATION, JSON.stringify(loc));
    } catch (e) {
      console.warn('Could not cache user location:', e);
    }
  },

  getUserLocation(): UserLocation | null {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.USER_LOCATION);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  },
  savePharmacies(data: Pharmacy[]): void {
    try {
      localStorage.setItem(CACHE_KEYS.PHARMACIES, JSON.stringify(data));
      localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (e) {
      console.warn('Could not cache pharmacies:', e);
    }
  },

  getPharmacies(): Pharmacy[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.PHARMACIES);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  },

  saveNurses(data: Nurse[]): void {
    try {
      localStorage.setItem(CACHE_KEYS.NURSES, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not cache nurses:', e);
    }
  },

  getNurses(): Nurse[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.NURSES);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  },

  saveHospitals(data: Hospital[]): void {
    try {
      localStorage.setItem(CACHE_KEYS.HOSPITALS, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not cache hospitals:', e);
    }
  },

  getHospitals(): Hospital[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.HOSPITALS);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  },

  getLastSyncTime(): string | null {
    return localStorage.getItem(CACHE_KEYS.LAST_SYNC);
  }
};
