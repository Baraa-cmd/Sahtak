import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Phone,
  MessageCircle,
  Star,
  Award,
  Compass,
  AlertCircle,
  Timer,
  Zap,
  ChevronLeft,
  MessageSquarePlus,
  CheckCircle2
} from 'lucide-react';
import { Nurse, SelectedRouteTarget } from '../types';
import { formatArabicTime } from '../lib/initialData';

interface NursesViewProps {
  nurses: Nurse[];
  onSelectOnMap: (target: SelectedRouteTarget) => void;
  onOpenCommunityReport: (target: {
    id: string;
    name: string;
    type: 'nurse';
    district?: string;
    currentPhone?: string;
    isOnDuty?: boolean;
  }) => void;
}

type FilterTab = 'nearest' | 'on_duty' | 'all';

export const NursesView: React.FC<NursesViewProps> = ({
  nurses,
  onSelectOnMap,
  onOpenCommunityReport
}) => {
  const [filterTab, setFilterTab] = useState<FilterTab>('nearest');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNurses = useMemo(() => {
    let list = [...nurses];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.title.toLowerCase().includes(q) ||
          n.district.toLowerCase().includes(q)
      );
    }

    if (filterTab === 'on_duty') {
      return list.filter((n) => n.isOnDuty);
    } else if (filterTab === 'nearest') {
      list.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
      if (!searchQuery.trim()) {
        return list.slice(0, 3);
      }
      return list;
    } else {
      return list.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }
  }, [nurses, filterTab, searchQuery]);

  const onDutyCount = useMemo(() => nurses.filter((n) => n.isOnDuty).length, [nurses]);

  return (
    <div className="pb-24 px-4 pt-3 max-w-md mx-auto space-y-3.5">
      {/* Simplified Header */}
      <div className="bg-sky-800 text-white rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold bg-white/15 px-2.5 py-0.5 rounded-full">
            التمريض المنزلي بدير حافر
          </span>
          <button
            onClick={() => setFilterTab('on_duty')}
            className="flex items-center gap-1.5 text-xs font-bold bg-sky-950/60 hover:bg-sky-950 px-3 py-1 rounded-full border border-sky-400/30 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
            <span>{onDutyCount} ممرضين مناوبين الآن</span>
          </button>
        </div>

        <div>
          <h2 className="text-lg font-black tracking-tight">كوادر التمريض المنزلي</h2>
          <p className="text-xs text-sky-100 font-medium mt-0.5">
            حقن وريدية ومحاليل، غيار جروح، وزيارات منزلية فورية
          </p>
        </div>
      </div>

      {/* Simplified Tabs */}
      <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
        <button
          onClick={() => setFilterTab('nearest')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
            filterTab === 'nearest'
              ? 'bg-white text-sky-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>أقرب 3 ممرضين</span>
        </button>

        <button
          onClick={() => setFilterTab('on_duty')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
            filterTab === 'on_duty'
              ? 'bg-sky-700 text-white shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>المناوبين فقط ({onDutyCount})</span>
        </button>

        <button
          onClick={() => setFilterTab('all')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
            filterTab === 'all'
              ? 'bg-white text-sky-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>جميع الكوادر ({nurses.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث باسم الممرض أو التخصص في دير حافر..."
          className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 shadow-2xs"
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

      {/* Nurses List */}
      <div className="space-y-2.5">
        {filteredNurses.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 shadow-2xs space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">لم يتم العثور على ممرضين مطابقين</p>
          </div>
        ) : (
          filteredNurses.map((nurse) => {
            const distance = nurse.distanceKm !== undefined ? `${nurse.distanceKm} km` : '0.6 km';

            return (
              <div
                key={nurse.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {nurse.name}
                      </h3>

                      {nurse.isOnDuty ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
                          مناوب الآن
                        </span>
                      ) : null}

                      {nurse.isAvailable ? (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                          متاح للزيارة
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                          مشغول بموعد
                        </span>
                      )}

                      {nurse.communityVerifiedAt && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-amber-600" />
                          مؤكد مجتمعياً
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-sky-800 font-semibold">{nurse.title}</p>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {nurse.district}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-amber-600">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {nurse.rating}
                      </span>
                    </div>
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

                {/* Duty End Info */}
                {nurse.dutyEndTime && (
                  <div className="text-[11px] bg-slate-50 text-sky-800 font-bold px-2.5 py-1.5 rounded-xl border border-slate-100 flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-sky-600" />
                    <span>متاح في المناوبة حتى: {formatArabicTime(nurse.dutyEndTime)}</span>
                  </div>
                )}

                {/* Actions: Direct Call, WhatsApp, Map Route */}
                <div className="flex items-center gap-2 pt-0.5">
                  <a
                    href={`tel:${nurse.phone}`}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>اتصال</span>
                  </a>

                  <a
                    href={`https://wa.me/${nurse.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('السلام عليكم، أحتاج زيارة تمريضية في دير حافر عبر منصة صحتك')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-sky-700 hover:bg-sky-800 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </a>

                  <button
                    onClick={() =>
                      onOpenCommunityReport({
                        id: nurse.id,
                        name: nurse.name,
                        type: 'nurse',
                        district: nurse.district,
                        currentPhone: nurse.phone,
                        isOnDuty: nurse.isOnDuty
                      })
                    }
                    className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 text-xs font-bold transition-all border border-slate-200/80"
                    title="تحديث أو تصحيح معلومات الممرض"
                  >
                    <MessageSquarePlus className="w-4 h-4 text-emerald-700" />
                  </button>

                  <button
                    onClick={() =>
                      onSelectOnMap({
                        id: nurse.id,
                        type: 'nurse',
                        name: nurse.name,
                        latitude: nurse.latitude,
                        longitude: nurse.longitude,
                        distanceKm: nurse.distanceKm,
                        district: nurse.district
                      })
                    }
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                    title="رسم مسار الطريق على الخريطة"
                  >
                    <Compass className="w-4 h-4 text-emerald-700" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
