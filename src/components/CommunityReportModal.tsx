import React, { useState } from 'react';
import {
  X,
  MessageSquarePlus,
  CheckCircle2,
  Clock,
  Phone,
  Pill,
  MapPin,
  HelpCircle,
  Send,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { CommunityReport, CommunityReportType } from '../types';

interface CommunityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: {
    id: string;
    name: string;
    type: 'pharmacy' | 'nurse' | 'hospital';
    district?: string;
    currentPhone?: string;
    isOnDuty?: boolean;
  } | null;
  onSubmitReport: (report: CommunityReport, autoUpdateDuty?: boolean | null) => void;
}

export const CommunityReportModal: React.FC<CommunityReportModalProps> = ({
  isOpen,
  onClose,
  target,
  onSubmitReport
}) => {
  const [reportType, setReportType] = useState<CommunityReportType>('duty_confirm');
  const [details, setDetails] = useState('');
  const [suggestedPhone, setSuggestedPhone] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [pendingQuickConfirm, setPendingQuickConfirm] = useState<boolean | null>(null);

  if (!isOpen || !target) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let autoUpdateDuty: boolean | null = null;
    if (reportType === 'duty_confirm') {
      autoUpdateDuty = true;
    } else if (reportType === 'duty_closed') {
      autoUpdateDuty = false;
    }

    const newReport: CommunityReport = {
      id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      targetId: target.id,
      targetName: target.name,
      targetType: target.type,
      reportType,
      details: details.trim() || (reportType === 'duty_confirm' ? 'تم تأكيد أن المناوبة مفتوحة ومتاحة الآن' : 'تم الإبلاغ أن المركز مغلق حالياً'),
      suggestedPhone: suggestedPhone.trim() || undefined,
      reporterName: reporterName.trim() || 'أحد أهالي دير حافر',
      createdAt: new Date().toISOString()
    };

    onSubmitReport(newReport, autoUpdateDuty);
    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setDetails('');
      setSuggestedPhone('');
      setReporterName('');
      onClose();
    }, 2000);
  };

  const handleQuickDutyConfirm = (isOpenDuty: boolean) => {
    const report: CommunityReport = {
      id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      targetId: target.id,
      targetName: target.name,
      targetType: target.type,
      reportType: isOpenDuty ? 'duty_confirm' : 'duty_closed',
      details: isOpenDuty ? 'تأكيد مباشر: مفتوح ومناوب الآن' : 'تأكيد مباشر: مغلق حالياً',
      reporterName: 'مساهمة سريعة من الأهالي',
      createdAt: new Date().toISOString()
    };

    onSubmitReport(report, isOpenDuty);
    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      onClose();
    }, 1800);
  };

  const targetTypeArabic =
    target.type === 'pharmacy' ? 'صيدلية' : target.type === 'nurse' ? 'ممرض' : 'مستشفى/مركز';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-800 text-right">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <MessageSquarePlus className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold leading-tight">
                تحديث ومساهمة مجتمعية
              </h3>
              <p className="text-[11px] text-emerald-200 mt-0.5">
                مساعدة أهالي دير حافر بمعلومات دقيقة ومباشرة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target summary */}
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-semibold">{targetTypeArabic}: </span>
            <span className="font-extrabold text-slate-900">{target.name}</span>
          </div>
          {target.district && (
            <span className="text-[11px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
              {target.district}
            </span>
          )}
        </div>

        {submittedSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">
              شكراً لمساهمتك الكريمة!
            </h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
              تم تسجيل التحديث بنجاح واعتماده محلياً لمساعدة أهالي ومرضى دير حافر 🌟
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Quick 1-Tap Confirmation Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                تأكيد سريع بنقرة واحدة:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPendingQuickConfirm(true)}
                  className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
                >
                  <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>مناوب ومفتوح الآن ✅</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPendingQuickConfirm(false)}
                  className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>مغلق أو غير متاح ⛔</span>
                </button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-slate-400 text-[11px] font-semibold">أو إرسال تفاصيل أدق</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Detailed Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Report Type Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  نوع التحديث أو الملاحظة:
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setReportType('duty_confirm')}
                    className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                      reportType === 'duty_confirm'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>تأكيد المناوبة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportType('phone_update')}
                    className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                      reportType === 'phone_update'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Phone className="w-4 h-4 text-sky-700 shrink-0" />
                    <span>تعديل الهاتف</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportType('location_fix')}
                    className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                      reportType === 'location_fix'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>تصحيح العنوان</span>
                  </button>
                </div>
              </div>

              {/* Conditional Phone Input */}
              {reportType === 'phone_update' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    رقم الهاتف الصحيح أو البديل:
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={suggestedPhone}
                    onChange={(e) => setSuggestedPhone(e.target.value)}
                    placeholder="مثال: 09XXXXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
              )}

              {/* Details Text */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  الملاحظة أو التفاصيل:
                </label>
                <textarea
                  rows={2}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="اكتب ملاحظتك (مثلاً: الصيدلي موجود حتى الصباح، أو مواعيد الدوام، إلخ)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Reporter Name (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">
                  اسمك أو صفتك (اختياري):
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="مثال: د. أحمد / صيدلي / أحد أهالي الحي"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال التحديث المجتمعي</span>
              </button>
            </form>
          </div>
        )}

        {/* Confirmation Modal for Quick Availability Changes */}
        {pendingQuickConfirm !== null && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 p-5 text-right space-y-3.5">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    pendingQuickConfirm
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {pendingQuickConfirm ? (
                    <UserCheck className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 leading-tight">
                    {pendingQuickConfirm
                      ? 'تأكيد حالة الصيدلية: مناوبة ومفتوحة'
                      : 'تأكيد حالة الصيدلية: مغلقة أو غير متاحة'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    {target.name}
                  </p>
                </div>
              </div>

              <div
                className={`p-3 rounded-xl text-xs font-semibold leading-relaxed border ${
                  pendingQuickConfirm
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {pendingQuickConfirm
                  ? `هل أنت متأكد من تأكيد أن "${target.name}" مناوبة ومفتوحة الآن وتستقبل المراجعين؟ سيتم تحديث حالتها فوراً لجميع المستخدمين.`
                  : `هل أنت متأكد من تأكيد أن "${target.name}" مغلقة أو غير متاحة حالياً؟ سيتم إعلام المراجعين بأنها خارج الخدمة.`}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const statusToApply = pendingQuickConfirm;
                    setPendingQuickConfirm(null);
                    handleQuickDutyConfirm(statusToApply);
                  }}
                  className={`py-2.5 px-3 rounded-xl text-white font-black text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 ${
                    pendingQuickConfirm
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>نعم، تأكيد التحديث</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPendingQuickConfirm(null)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                >
                  إلغاء وتراجع
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
