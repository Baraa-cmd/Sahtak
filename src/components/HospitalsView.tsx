import React, { useState, useMemo } from 'react';
import {
  Building2,
  PhoneCall,
  MapPin,
  Compass,
  Search,
  ExternalLink,
  ShieldAlert,
  MessageSquarePlus,
  CheckCircle2
} from 'lucide-react';
import { Hospital, SelectedRouteTarget } from '../types';

interface HospitalsViewProps {
  hospitals: Hospital[];
  onSelectOnMap: (target: SelectedRouteTarget) => void;
  onOpenCommunityReport: (target: {
    id: string;
    name: string;
    type: 'hospital';
    district?: string;
    currentPhone?: string;
  }) => void;
}

export const HospitalsView: React.FC<HospitalsViewProps> = ({
  hospitals,
  onSelectOnMap,
  onOpenCommunityReport
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHospitals = useMemo(() => {
    let list = [...hospitals];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.district.toLowerCase().includes(q) ||
          h.type.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }, [hospitals, searchQuery]);

  return (
    <div className="pb-24 px-4 pt-3 max-w-md mx-auto space-y-3.5">
      {/* Emergency Header */}
      <div className="bg-rose-800 text-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold bg-white/15 px-2.5 py-0.5 rounded-full w-fit">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>طوارئ وإسعاف دير حافر</span>
          </div>
          <h2 className="text-lg font-black mt-1">الإسعاف والطوارئ 110</h2>
          <p className="text-xs text-rose-100 font-medium mt-0.5">
            الاستجابة الإسعافية ونقل الحالات الحرجة 24/7
          </p>
        </div>

        <a
          href="tel:110"
          className="px-3.5 py-2 rounded-xl bg-white text-rose-800 font-black text-xs shadow-sm active:scale-95 transition-all flex items-center gap-1"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>اتصال 110</span>
        </a>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث باسم المركز أو النقطة الطبية في دير حافر..."
          className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
          >
            مسح
          </button>
        )}
      </div>

      {/* Hospitals List */}
      <div className="space-y-2.5">
        {filteredHospitals.map((hospital) => {
          const distance = hospital.distanceKm !== undefined ? `${hospital.distanceKm} km` : '0.8 km';

          return (
            <div
              key={hospital.id}
              className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {hospital.name}
                    </h3>

                    {hospital.emergency24h && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                        طوارئ 24/7
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-rose-800">
                    {hospital.type}
                  </p>

                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{hospital.district}</span>
                  </p>
                </div>

                <div className="shrink-0 text-left bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                  <span className="text-xs font-black text-slate-800 block">
                    {distance}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold block">
                    عنك
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-0.5 flex items-center gap-2">
                <a
                  href={`tel:${hospital.emergencyPhone}`}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>اتصال ({hospital.emergencyPhone})</span>
                </a>

                <button
                  onClick={() =>
                    onSelectOnMap({
                      id: hospital.id,
                      type: 'hospital',
                      name: hospital.name,
                      latitude: hospital.latitude,
                      longitude: hospital.longitude,
                      distanceKm: hospital.distanceKm,
                      district: hospital.district
                    })
                  }
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span>رسم مسار الطريق</span>
                </button>

                <button
                  onClick={() =>
                    onOpenCommunityReport({
                      id: hospital.id,
                      name: hospital.name,
                      type: 'hospital',
                      district: hospital.district,
                      currentPhone: hospital.emergencyPhone
                    })
                  }
                  className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 text-xs font-bold transition-all border border-slate-200"
                  title="مشاركة تحديث أو ملاحظة حول هذا المركز"
                >
                  <MessageSquarePlus className="w-4 h-4 text-emerald-700" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
