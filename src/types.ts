export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  district: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  isOnDuty: boolean;
  dutyEndTime?: string; // ISO string or time string e.g. "08:00 AM"
  dutyHours: string;
  services: string[];
  updatedAt?: string;
  distanceKm?: number;
  communityVerifiedAt?: string;
  communityNote?: string;
}

export interface Nurse {
  id: string;
  name: string;
  title: string;
  district: string;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  isOnDuty: boolean;
  dutyEndTime?: string;
  services: string[];
  phone: string;
  experienceYears: number;
  rating: number;
  updatedAt?: string;
  distanceKm?: number;
  communityVerifiedAt?: string;
  communityNote?: string;
}

export interface Hospital {
  id: string;
  name: string;
  type: string; // مستشفى حكومي، تخصصي، خاص
  district: string;
  latitude: number;
  longitude: number;
  emergency24h: boolean;
  emergencyPhone: string;
  services: string[];
  updatedAt?: string;
  distanceKm?: number;
  communityVerifiedAt?: string;
  communityNote?: string;
}

export type CommunityReportType =
  | 'duty_confirm'
  | 'duty_closed'
  | 'phone_update'
  | 'medicine_note'
  | 'location_fix'
  | 'general_note';

export interface CommunityReport {
  id: string;
  targetId: string;
  targetName: string;
  targetType: 'pharmacy' | 'nurse' | 'hospital';
  reportType: CommunityReportType;
  details: string;
  suggestedPhone?: string;
  reporterName?: string;
  createdAt: string;
}

export type LocationSource = 'gps' | 'manual' | 'preset' | 'ip' | 'default';

export interface UserLocation {
  latitude: number;
  longitude: number;
  districtName: string;
  isAuto: boolean;
  source?: LocationSource;
}

export type ActiveTab = 'pharmacies' | 'nurses' | 'map' | 'hospitals';

export type MapStyleMode = 'default' | 'satellite';

export interface MapLayerState {
  pharmacies: boolean;
  nurses: boolean;
  hospitals: boolean;
}

export interface SelectedRouteTarget {
  id: string;
  type: 'pharmacy' | 'nurse' | 'hospital';
  name: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  district: string;
}

export type UserRole = 'admin' | 'pharmacist' | 'nurse';

export interface AppUser {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  targetId?: string; // ID of linked Pharmacy or Nurse
  targetName?: string; // Display name of linked Pharmacy or Nurse
  displayName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: AppUser;
  loginTime: string;
}
