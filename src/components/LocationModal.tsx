import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Crosshair,
  Building2,
  Globe,
  Settings,
  ChevronLeft,
  MousePointerClick
} from 'lucide-react';
import { UserLocation } from '../types';
import { DAYR_HAFIR_PRESETS, PresetDistrict } from '../lib/initialData';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: UserLocation;
  isLocating: boolean;
  onDetectGps: () => void;
  onSelectPreset: (preset: PresetDistrict) => void;
  onActivateManualMapPick: () => void;
  onDetectByIp?: () => void;
  isIpLocating?: boolean;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  isLocating,
  onDetectGps,
  onSelectPreset,
  onActivateManualMapPick,
  onDetectByIp,
  isIpLocating = false
}) => {
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 relative max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-3.5 top-3.5 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center space-y-1 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
            <Compass className="w-6 h-6 text-emerald-700" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">
            تحديد موقعك في دير حافر
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            اختر الطريقة الأنسب لتحديد مكانك لحساب أقرب صيدلية وممرض ورسم المسار بدقة.
          </p>
        </div>

        {/* Current Active Location Badge */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-[10px] text-slate-500 font-bold">الموقع النشط حالياً:</div>
              <div className="font-extrabold text-slate-900 truncate">
                {userLocation.districtName}
              </div>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
              userLocation.source === 'gps' || userLocation.isAuto
                ? 'bg-emerald-100 text-emerald-800'
                : userLocation.source === 'manual'
                ? 'bg-sky-100 text-sky-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {userLocation.source === 'gps' || userLocation.isAuto
              ? 'GPS 🛰️'
              : userLocation.source === 'manual'
              ? 'تحديد يدوي 📍'
              : 'حي محدد 🏘️'}
          </span>
        </div>

        {/* Primary Option: Automatic Real Location (GPS + Network) */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onDetectGps();
              onClose();
            }}
            disabled={isLocating}
            className="w-full bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 active:scale-98 text-white p-3.5 rounded-2xl font-black text-xs transition-all shadow-md shadow-emerald-700/20 flex items-center justify-between gap-2 border border-emerald-600 disabled:opacity-75"
          >
            <div className="flex items-center gap-2.5 text-right">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                {isLocating ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Navigation className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <div className="text-xs font-black">
                  {isLocating ? 'جاري تحديد موقعك الفعلي...' : 'التقاط موقعي الحقيقي تلقائياً 🛰️'}
                </div>
                <div className="text-[10px] text-emerald-100 font-normal">
                  تحديد فوري عبر الأقمار الصناعية وشبكة الاتصال دون أي إدخال
                </div>
              </div>
            </div>
            {isLocating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white shrink-0" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-white/80 shrink-0" />
            )}
          </button>

          {/* Secondary Option: Manual Pick on Map */}
          <button
            onClick={() => {
              onClose();
              onActivateManualMapPick();
            }}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-between gap-2 shadow-2xs"
          >
            <div className="flex items-center gap-2.5 text-right">
              <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <MousePointerClick className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">تحديد موقعي يدوياً على الخريطة 🎯</div>
                <div className="text-[10px] text-slate-500 font-normal">
                  انقر على مكانك مباشرة أو اسحب الدبوس
                </div>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Option 3: Select District / Neighborhood in Dayr Hafir */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>أو اختر حيك في دير حافر فوراً:</span>
            </span>
            <span className="text-[10px] text-slate-500">نقرة واحدة</span>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5 no-scrollbar">
            {DAYR_HAFIR_PRESETS.map((preset) => {
              const isSelected = userLocation.districtName.includes(preset.name);
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    onSelectPreset(preset);
                    onClose();
                  }}
                  className={`w-full text-right p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-black'
                      : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="truncate">
                    <div className="text-xs font-bold flex items-center gap-1.5 truncate">
                      <MapPin
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{preset.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mr-5">
                      {preset.description}
                    </div>
                  </div>

                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Troubleshoot & Browser Permission Guide Toggle */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowTroubleshoot(!showTroubleshoot)}
            className="w-full text-center text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1"
          >
            <Settings className="w-3 h-3 text-slate-400" />
            <span>{showTroubleshoot ? 'إخفاء تعليمات الإذن' : 'لماذا لا يلتقط هاتفي الموقع؟ (حل المشكلة)'}</span>
          </button>

          {showTroubleshoot && (
            <div className="mt-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] text-slate-700 space-y-1.5 animate-in fade-in duration-150">
              <div className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>أسباب وحلول عدم التقاط الموقع:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pr-1">
                <li>
                  <strong>متصفح Chrome / أندرويد:</strong> اضغط على أيقونة الإعدادات 🔒 بجانب رابط الموقع في شريط العناوين ثم اختر <em>«الموقع الجغرافي: سماح»</em>.
                </li>
                <li>
                  <strong>آيفون (سفاري):</strong> افتح إعدادات الهاتف ⚙️ &gt; الخصوصية والأمن &gt; خدمات الموقع &gt; تأكد من تفعيلها لمتصفح Safari.
                </li>
                <li>
                  <strong>أجهزة الحواسيب:</strong> أجهزة الكمبيوتر لا تحتوي عادة على شريحة GPS فعلية وتعتمد على شبكة الإنترنت. لذلك يُنصح باختيار <em>«تحديد موقعي يدوياً على الخريطة»</em> أو اختيار الحي مباشرة.
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
