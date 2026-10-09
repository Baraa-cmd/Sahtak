import { Pharmacy, Nurse, Hospital, UserLocation, CommunityReport, AppUser, AuthSession } from '../types';

const CACHE_KEYS = {
  PHARMACIES: 'sehatuk_cached_pharmacies_v1',
  NURSES: 'sehatuk_cached_nurses_v1',
  HOSPITALS: 'sehatuk_cached_hospitals_v1',
  USER_LOCATION: 'sehatuk_cached_user_location_v1',
  COMMUNITY_REPORTS: 'sehatuk_community_reports_v1',
  AUTH_USERS: 'sehatuk_cached_users_v1',
  AUTH_SESSION: 'sehatuk_auth_session_v1',
  LAST_SYNC: 'sehatuk_last_sync_timestamp'
};

export const DEFAULT_ADMIN_USER: AppUser = {
  id: 'admin_root',
  username: 'admin',
  password: 'admin123',
  role: 'admin',
  displayName: 'مدير المنصة (الأدمن)',
  createdAt: new Date().toISOString()
};

export const offlineStorage = {
  saveAuthSession(session: AuthSession | null): void {
    try {
      if (session) {
        localStorage.setItem(CACHE_KEYS.AUTH_SESSION, JSON.stringify(session));
      } else {
        localStorage.removeItem(CACHE_KEYS.AUTH_SESSION);
      }
    } catch (e) {
      console.warn('Could not cache auth session:', e);
    }
  },

  getAuthSession(): AuthSession | null {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.AUTH_SESSION);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  },

  saveUsers(users: AppUser[]): void {
    try {
      localStorage.setItem(CACHE_KEYS.AUTH_USERS, JSON.stringify(users));
    } catch (e) {
      console.warn('Could not cache users:', e);
    }
  },

  getUsers(): AppUser[] {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.AUTH_USERS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return [DEFAULT_ADMIN_USER];
    } catch {
      return [DEFAULT_ADMIN_USER];
    }
  },
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
  },

  saveCommunityReport(report: CommunityReport): void {
    try {
      const existing = this.getCommunityReports();
      const updated = [report, ...existing.filter(r => r.id !== report.id)].slice(0, 100);
      localStorage.setItem(CACHE_KEYS.COMMUNITY_REPORTS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not cache community report:', e);
    }
  },

  getCommunityReports(): CommunityReport[] {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.COMMUNITY_REPORTS);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  },

  getReportsForTarget(targetId: string): CommunityReport[] {
    return this.getCommunityReports().filter(r => r.targetId === targetId);
  }
};
