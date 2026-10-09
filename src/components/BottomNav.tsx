import React from 'react';
import { Pill, Stethoscope, Map, Building2 } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onDutyPharmaciesCount: number;
  onDutyNursesCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onDutyPharmaciesCount,
  onDutyNursesCount
}) => {
  const navItems = [
    {
      id: 'pharmacies' as ActiveTab,
      label: 'الصيدليات',
      icon: Pill,
      badge: onDutyPharmaciesCount > 0 ? onDutyPharmaciesCount : undefined,
      badgeColor: 'bg-emerald-500'
    },
    {
      id: 'nurses' as ActiveTab,
      label: 'الممرضين',
      icon: Stethoscope,
      badge: onDutyNursesCount > 0 ? onDutyNursesCount : undefined,
      badgeColor: 'bg-teal-500'
    },
    {
      id: 'map' as ActiveTab,
      label: 'الخريطة',
      icon: Map
    },
    {
      id: 'hospitals' as ActiveTab,
      label: 'المشافي',
      icon: Building2
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-lg pb-safe">
      <div className="max-w-md mx-auto px-3 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-emerald-700 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div
                className={`relative p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-600 shadow-2xs'
                    : 'bg-transparent text-slate-500'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />

                {item.badge !== undefined && (
                  <span
                    className={`absolute -top-1 -right-1.5 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'font-black text-emerald-700' : 'font-medium'}`}>
                {item.label}
              </span>

              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
