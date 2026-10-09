import React from 'react';
import {
  Activity,
  MapPin,
  RefreshCw,
  Bell,
  BellRing,
  WifiOff,
  UserCheck,
  ShieldAlert,
  Lock,
  Unlock
} from 'lucide-react';
import { UserLocation, AuthSession } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  userLocation: UserLocation;
  isLocating: boolean;
  onRefreshLocation: () => void;
  onOpenLocationModal: () => void;
  isOnline: boolean;
  notificationsEnabled: boolean;
  onRequestNotifications: () => void;
  onOpenAuthModal: () => void;
  session: AuthSession | null;
  onEmergencySOS: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userLocation,
  isLocating,
  onRefreshLocation,
  onOpenLocationModal,
  isOnline,
  notificationsEnabled,
  onRequestNotifications,
  onOpenAuthModal,
  session,
  onEmergencySOS
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base text-slate-900 tracking-tight leading-none">
                صحتك
              </h1>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                دير حافر
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
              دليل الصيدليات والممرضين والمشافي
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Notification Button */}
          <button
            onClick={onRequestNotifications}
            title={notificationsEnabled ? 'الإشعارات مفعلة' : 'تفعيل إشعارات المناوبة'}
            className={`p-2 rounded-xl transition-all flex items-center justify-center text-xs ${
              notificationsEnabled
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {notificationsEnabled ? (
              <BellRing className="w-4 h-4 text-amber-600" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </button>

          {/* Lock Button (Opens Login / Control Panel) */}
          {session ? (
            <button
              onClick={onOpenAuthModal}
              title={`لوحة التحكم: ${session.user.displayName || session.user.username}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-black transition-all border border-emerald-300 shadow-2xs"
            >
              <Unlock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate max-w-[75px]">
                {session.user.role === 'admin'
                  ? 'الأدمن 🛡️'
                  : session.user.role === 'pharmacist'
                  ? session.user.targetName || 'صيدليتي'
                  : session.user.targetName || 'حسابي'}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              title="تسجيل الدخول (زر القفل)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-800 text-xs font-bold transition-all border border-slate-200 shadow-2xs group"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-700 group-hover:scale-110 transition-transform" />
              <span>دخول</span>
            </button>
          )}

          {/* Emergency SOS Button */}
          <button
            onClick={onEmergencySOS}
            title="اتصال طوارئ وإسعاف فوري 110"
            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center shadow-xs transition-transform active:scale-95"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Location Bar */}
      <div className="bg-slate-50 border-t border-slate-100 px-4 py-1.5 flex items-center justify-between text-xs text-slate-600 max-w-md mx-auto">
        <button
          onClick={onOpenLocationModal}
          className="flex items-center gap-1.5 truncate text-right group hover:text-emerald-700 transition-colors"
          title="تغيير أو تحديد موقعك"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-slate-500 font-medium">المنطقة:</span>
          <span className="font-extrabold text-slate-900 truncate group-hover:text-emerald-800">
            {userLocation.districtName}
          </span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full shrink-0">
            {userLocation.source === 'gps'
              ? 'تلقائي GPS 🛰️'
              : userLocation.source === 'ip'
              ? 'تلقائي 🌐'
              : userLocation.source === 'manual'
              ? 'تحديد يدوي 📍'
              : 'افتراضي'}
          </span>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onRefreshLocation}
            disabled={isLocating}
            title="تحديث الموقع تلقائياً"
            className="p-1 text-slate-400 hover:text-emerald-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-700' : ''}`} />
          </button>

          {!isOnline && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
              <WifiOff className="w-3 h-3" />
              <span>أوفلاين</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
