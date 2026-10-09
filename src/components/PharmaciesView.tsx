import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Clock,
  Compass,
  Moon,
  AlertCircle,
  ExternalLink,
  Timer,
  ChevronLeft
} from 'lucide-react';
import { Pharmacy, SelectedRouteTarget } from '../types';
import { formatArabicTime } from '../lib/initialData';

interface PharmaciesViewProps {
  pharmacies: Pharmacy[];
  onSelectOnMap: (target: SelectedRouteTarget) => void;
}

type FilterTab = 'nearest' | 'on_duty' | 'all';

export const PharmaciesView: React.FC<PharmaciesViewProps> = ({
  pharmacies,
  onSelectOnMap
}) => {
  const [filterTab, setFilterTab] = useState<FilterTab>('nearest');
  const [searchQuery, setSearchQuery] = useState('');

  // Sorted and filtered list
  const filteredPharmacies = useMemo(() => {
    let list = [...pharmacies];

    // Filter by search query if user typed
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      );
    }

    // Filter by Tab
    if (filterTab === 'on_duty') {
      // ONLY on-duty pharmacies
      return list.filter((p) => p.isOnDuty);
    } else if (filterTab === 'nearest') {
      // Sort by distance and pick nearest 3
      list.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
      if (!searchQuery.trim()) {
        return list.slice(0, 3);
      }
      return list;
    } else {
      // 'all'
      return list.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }
  }, [pharmacies, filterTab, searchQuery]);

  const onDutyCount = useMemo(
    () => pharmacies.filter((p) => p.isOnDuty).length,
    [pharmacies]
  );

  return (
    <div className="pb-24 px-4 pt-3 max-w-md mx-auto space-y-3.5">
      {/* Clean Simplified Header Card */}
      <div className="bg-emerald-800 text-white rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold bg-white/15 px-2.5 py-0.5 rounded-full">
            منطقة دير حافر
          </span>
          <button
            onClick={() => setFilterTab('on_duty')}
            className="flex items-center gap-1.5 text-xs font-bold bg-emerald-900/60 hover:bg-emerald-900 px-3 py-1 rounded-full border border-emerald-500/30 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span>{onDutyCount} صيدليات مناوبة الآن</span>
          </button>
        </div>

        <div>
          <h2 className="text-lg font-black tracking-tight">صيدليات دير حافر</h2>
          <p className="text-xs text-emerald-100 font-medium mt-0.5">
            عرض مباشر للمناوبة الليلية ومسار الطريق الواقعي
          </p>
        </div>
      </div>

      {/* Simplified Three Clear Tabs */}
      <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
        <button
          onClick={() => setFilterTab('nearest')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
            filterTab === 'nearest'
              ? 'bg-white text-emerald-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>أقرب 3 صيدليات</span>
        </button>

        <button
          onClick={() => setFilterTab('on_duty')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
            filterTab === 'on_duty'
              ? 'bg-emerald-700 text-white shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>المناوبات فقط ({onDutyCount})</span>
        </button>

        <button
          onClick={() => setFilterTab('all')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
            filterTab === 'all'
              ? 'bg-white text-emerald-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>جميع الصيدليات ({pharmacies.length})</span>
        </button>
      </div>

      {/* Clean Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث باسم الصيدلية أو الشارع في دير حافر..."
          className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
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

      {/* List Header Label */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1 pt-1">
        <span>
          {filterTab === 'on_duty'
            ? 'الصيدليات المناوبة فقط في دير حافر:'
            : filterTab === 'nearest'
            ? 'أقرب 3 صيدليات إليك:'
            : 'دليل كافة الصيدليات:'}
        </span>
        <span className="text-slate-500 font-semibold">{filteredPharmacies.length} صيدلية</span>
      </div>

      {/* Pharmacies List */}
      <div className="space-y-2.5">
        {filteredPharmacies.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 shadow-2xs space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              {filterTab === 'on_duty'
                ? 'لا توجد صيدليات مناوبة حالياً'
                : 'لم يتم العثور على صيدليات مطابقة'}
            </p>
            {filterTab === 'on_duty' && (
              <button
                onClick={() => setFilterTab('all')}
                className="text-xs text-emerald-700 font-bold underline"
              >
                عرض جميع صيدليات دير حافر
              </button>
            )}
          </div>
        ) : (
          filteredPharmacies.map((pharmacy) => {
            const isDuty = pharmacy.isOnDuty;
            const distance = pharmacy.distanceKm !== undefined ? `${pharmacy.distanceKm} km` : '0.4 km';

            return (
              <div
                key={pharmacy.id}
                onClick={() =>
                  onSelectOnMap({
                    id: pharmacy.id,
                    type: 'pharmacy',
                    name: pharmacy.name,
                    latitude: pharmacy.latitude,
                    longitude: pharmacy.longitude,
                    distanceKm: pharmacy.distanceKm,
                    district: pharmacy.district
                  })
                }
                className={`bg-white rounded-2xl p-3.5 border transition-all cursor-pointer shadow-2xs hover:border-emerald-600 space-y-2.5 ${
                  isDuty ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200'
                }`}
              >
                {/* Top Row: Name, Status badge, Distance */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {pharmacy.name}
                      </h3>

                      {isDuty ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          مناوبة الآن
                        </span>
                      ) : pharmacy.isOpen ? (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          مفتوحة
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md">
                          مغلقة
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{pharmacy.district} - {pharmacy.address}</span>
                    </p>
                  </div>

                  {/* Distance */}
                  <div className="shrink-0 text-left bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                    <span className="text-xs font-black text-slate-800 block">
                      {distance}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold block">
                      عنك
                    </span>
                  </div>
                </div>

                {/* Duty Hours & Countdown */}
                <div className="flex items-center justify-between text-[11px] bg-slate-50 rounded-xl px-2.5 py-1.5 border border-slate-100 text-slate-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{formatArabicTime(pharmacy.dutyHours)}</span>
                  </div>

                  {pharmacy.dutyEndTime && (
                    <div className="flex items-center gap-1 text-emerald-700 font-bold">
                      <Timer className="w-3 h-3" />
                      <span>حتى {formatArabicTime(pharmacy.dutyEndTime)}</span>
                    </div>
                  )}
                </div>

                {/* Primary Action Button: Real Route on Map */}
                <div className="flex items-center justify-between pt-0.5 text-xs">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" />
                    <span>رسم مسار الطريق على الخريطة</span>
                  </span>

                  <span className="text-slate-400 flex items-center gap-0.5 text-[11px]">
                    <span>عرض التفاصيل</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
