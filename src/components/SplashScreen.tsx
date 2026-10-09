import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, duration = 1800 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, duration - 400);

    const finishTimer = setTimeout(() => {
      setIsVisible(false);
      onFinish?.();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [duration, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white transition-opacity duration-500 selection:bg-none ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ direction: 'rtl' }}
    >
      {/* Top subtle glow */}
      <div className="w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-500 shadow-sm" />

      {/* Main Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Animated Medical Emblem Card */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-emerald-500/20 rounded-3xl blur-xl animate-pulse" />
          
          <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-white to-emerald-50 p-2 shadow-2xl flex items-center justify-center border border-white/60">
            {/* Medical Cross & Heartbeat SVG */}
            <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-md">
              {/* Green Cross */}
              <path
                d="M38 12 C38 10 40 8 42 8 L58 8 C60 8 62 10 62 12 L62 38 L88 38 C90 38 92 40 92 42 L92 58 C92 60 90 62 88 62 L62 62 L62 88 C62 90 60 92 58 92 L42 92 C40 92 38 90 38 88 L38 62 L12 62 C10 62 8 60 8 58 L8 42 C8 40 10 38 12 38 L38 38 Z"
                fill="#047857"
              />
              {/* White Heartbeat Wave */}
              <path
                d="M 14 50 L 32 50 L 40 32 L 50 68 L 60 38 L 68 56 L 74 50 L 86 50"
                fill="none"
                stroke="#ffffff"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-pulse"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black tracking-tight text-white mb-2 drop-shadow-sm flex items-center gap-2">
          <span>صحتك</span>
          <span className="text-emerald-300 text-xl font-bold bg-emerald-800/80 px-2.5 py-0.5 rounded-lg border border-emerald-600/50">
            دير حافر
          </span>
        </h1>

        {/* Subtitle Badge */}
        <div className="bg-emerald-800/60 border border-emerald-600/40 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm shadow-inner mb-6">
          دليلك الطبي للمناوبات والرعاية الصحية
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 text-xs text-emerald-300/90 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>جاري المزامنة اللحظية مع الصيدليات...</span>
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="pb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex gap-1.5 justify-center">
          <span className="w-2 h-2 rounded-full bg-emerald-400/80 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-emerald-400/80 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-emerald-400/80 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-[11px] text-emerald-400/70 font-medium tracking-wide">
          منظومة الطوارئ والمناوبات الليلية • رعاية 24/7
        </p>
      </div>
    </div>
  );
};
