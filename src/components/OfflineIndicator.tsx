import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredNotice(true);
      const timer = setTimeout(() => setShowRestoredNotice(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestoredNotice(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showRestoredNotice) {
    return (
      <aside aria-label="حالة الاتصال" className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto z-50 flex items-center justify-between gap-2 rounded-xl bg-emerald-700/95 backdrop-blur-xs px-3.5 py-2 text-xs font-bold text-white shadow-lg animate-fade-in">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-emerald-200" />
          <span>تمت استعادة الاتصال بالإنترنت</span>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
      </aside>
    );
  }

  if (!isOnline) {
    return (
      <aside aria-label="حالة الاتصال" className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto z-50 flex items-center justify-between gap-2 rounded-xl bg-amber-600/95 backdrop-blur-xs px-3.5 py-2 text-xs font-bold text-white shadow-xl animate-fade-in border border-amber-400/40">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-200 shrink-0" />
          <span>وضع عدم الاتصال — بيانات دير حافر متاحة من الذاكرة</span>
        </div>
        <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
      </aside>
    );
  }

  return null;
};
