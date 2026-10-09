import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Pill,
  Stethoscope,
  Timer,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  Power,
  Download,
  Server,
  FolderArchive
} from 'lucide-react';
import { Pharmacy, Nurse } from '../types';
import { updatePharmacyStatus, updateNurseStatus } from '../lib/firebase';
import { notificationService } from '../lib/notifications';
import { formatArabicTime } from '../lib/initialData';

interface ProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacies: Pharmacy[];
  nurses: Nurse[];
  onPharmacyUpdated: (pharmacy: Pharmacy) => void;
  onNurseUpdated: (nurse: Nurse) => void;
}

type ProviderRole = 'pharmacy' | 'nurse';

export const ProviderModal: React.FC<ProviderModalProps> = ({
  isOpen,
  onClose,
  pharmacies,
  nurses,
  onPharmacyUpdated,
  onNurseUpdated
}) => {
  if (!isOpen) return null;

  const [role, setRole] = useState<ProviderRole>('pharmacy');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>(
    pharmacies[0]?.id || ''
  );
  const [selectedNurseId, setSelectedNurseId] = useState<string>(
    nurses[0]?.id || ''
  );

  const currentPharmacy = pharmacies.find((p) => p.id === selectedPharmacyId);
  const currentNurse = nurses.find((n) => n.id === selectedNurseId);

  // Pharmacy State
  const [phIsOpen, setPhIsOpen] = useState(currentPharmacy?.isOpen ?? true);
  const [phIsOnDuty, setPhIsOnDuty] = useState(currentPharmacy?.isOnDuty ?? false);
  const [phDutyEndTime, setPhDutyEndTime] = useState(
    formatArabicTime(currentPharmacy?.dutyEndTime) || '6:00 صباحاً'
  );

  // Nurse State
  const [nrIsAvailable, setNrIsAvailable] = useState(
    currentNurse?.isAvailable ?? true
  );
  const [nrIsOnDuty, setNrIsOnDuty] = useState(currentNurse?.isOnDuty ?? false);
  const [nrDutyEndTime, setNrDutyEndTime] = useState(
    formatArabicTime(currentNurse?.dutyEndTime) || '7:00 صباحاً'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state when selecting different provider
  const handleSelectPharmacy = (id: string) => {
    setSelectedPharmacyId(id);
    const p = pharmacies.find((item) => item.id === id);
    if (p) {
      setPhIsOpen(p.isOpen);
      setPhIsOnDuty(p.isOnDuty);
      setPhDutyEndTime(formatArabicTime(p.dutyEndTime) || '6:00 صباحاً');
    }
  };

  const handleSelectNurse = (id: string) => {
    setSelectedNurseId(id);
    const n = nurses.find((item) => item.id === id);
    if (n) {
      setNrIsAvailable(n.isAvailable);
      setNrIsOnDuty(n.isOnDuty);
      setNrDutyEndTime(formatArabicTime(n.dutyEndTime) || '7:00 صباحاً');
    }
  };

  const handleSavePharmacy = async () => {
    if (!currentPharmacy) return;
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const updates = {
        isOpen: phIsOpen,
        isOnDuty: phIsOnDuty,
        dutyEndTime: phIsOnDuty ? phDutyEndTime : '',
        dutyHours: phIsOnDuty ? `مناوبة ليلية حتى ${phDutyEndTime}` : phIsOpen ? 'مفتوحة - دوام اعتيادي' : 'مغلقة'
      };

      await updatePharmacyStatus(currentPharmacy.id, updates);
      onPharmacyUpdated({ ...currentPharmacy, ...updates });

      // Trigger local browser push notification if duty became active
      if (phIsOnDuty && !currentPharmacy.isOnDuty) {
        notificationService.sendNotification(
          `بدأت مناوبة ${currentPharmacy.name} 🌙`,
          {
            body: `الصيدلية مناوبة الآن حتى ${phDutyEndTime} ومتاحة لخدمة الحالات الطارئة.`
          }
        );
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.warn('Update failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNurse = async () => {
    if (!currentNurse) return;
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const updates = {
        isAvailable: nrIsAvailable,
        isOnDuty: nrIsOnDuty,
        dutyEndTime: nrIsOnDuty ? nrDutyEndTime : ''
      };

      await updateNurseStatus(currentNurse.id, updates);
      onNurseUpdated({ ...currentNurse, ...updates });

      if (nrIsOnDuty && !currentNurse.isOnDuty) {
        notificationService.sendNotification(
          `الممرض ${currentNurse.name} متاح للمناوبة الآن ⚡`,
          {
            body: `جاهز للزيارات المنزلية الطارئة وتركيب المحاليل حتى ${nrDutyEndTime}.`
          }
        );
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.warn('Update failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-base">بوابة الكوادر الصحية</h2>
              <p className="text-xs text-slate-500 font-medium">إدارة الحالة ومؤقت المناوبة الذكي</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Switcher Tabs */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 text-xs font-bold">
          <button
            onClick={() => setRole('pharmacy')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              role === 'pharmacy'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>لوحة الصيدلي</span>
          </button>

          <button
            onClick={() => setRole('nurse')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              role === 'nurse'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>لوحة الممرض</span>
          </button>
        </div>

        {/* Pharmacy Controls Section */}
        {role === 'pharmacy' && (
          <div className="space-y-4">
            {/* Select Pharmacy */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                اختر الصيدلية لإدارتها:
              </label>
              <select
                value={selectedPharmacyId}
                onChange={(e) => handleSelectPharmacy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {pharmacies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle IsOpen */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900 block">حالة العمل الآن:</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {phIsOpen ? 'الصيدلية مفتوحة وتستقبل المرضى' : 'الصيدلية مغلقة حالياً'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPhIsOpen(!phIsOpen)}
                className={`relative w-12 h-6.5 rounded-full transition-colors flex items-center px-1 ${
                  phIsOpen ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    phIsOpen ? 'translate-x-0' : '-translate-x-5.5'
                  }`}
                />
              </button>
            </div>

            {/* Toggle OnDuty */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900 block">المناوبة الليلية / 24 ساعة:</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {phIsOnDuty
                    ? 'مسجلة في قائمة الصيدليات المناوبة 🟢'
                    : 'ليست في جدول المناوبة'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPhIsOnDuty(!phIsOnDuty)}
                className={`relative w-12 h-6.5 rounded-full transition-colors flex items-center px-1 ${
                  phIsOnDuty ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    phIsOnDuty ? 'translate-x-0' : '-translate-x-5.5'
                  }`}
                />
              </button>
            </div>

            {/* Smart Duty Timer presets */}
            {phIsOnDuty && (
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Timer className="w-4 h-4 text-emerald-600" />
                  <span>المؤقت الذكي للمناوبة (تحديد وقت الانتهاء):</span>
                </div>

                <div className="grid grid-cols-4 gap-1 text-xs font-bold">
                  {['6:00 صباحاً', '8:00 صباحاً', '12:00 ظهراً', '24 ساعة'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPhDutyEndTime(preset)}
                      className={`py-1.5 px-1.5 rounded-xl border text-center transition-all text-[11px] ${
                        phDutyEndTime === preset
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSavePharmacy}
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-3 rounded-2xl font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <span>جاري الحفظ والمزامنة...</span>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم تحديث حالة الصيدلية والمناوبة بنجاح!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ وتحديث الحالة اللحظية</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Nurse Controls Section */}
        {role === 'nurse' && (
          <div className="space-y-4">
            {/* Select Nurse */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                اختر الممرض لإدارته:
              </label>
              <select
                value={selectedNurseId}
                onChange={(e) => handleSelectNurse(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                {nurses.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Availability */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900 block">جاهزية الزيارة المنزلية:</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {nrIsAvailable ? 'متاح للتوجه للمريض فوراً 🟢' : 'مشغول بموعد رعاية آخر'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setNrIsAvailable(!nrIsAvailable)}
                className={`relative w-12 h-6.5 rounded-full transition-colors flex items-center px-1 ${
                  nrIsAvailable ? 'bg-teal-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    nrIsAvailable ? 'translate-x-0' : '-translate-x-5.5'
                  }`}
                />
              </button>
            </div>

            {/* Toggle OnDuty */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900 block">وردية المناوبة الليلية/الطارئة:</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {nrIsOnDuty ? 'في المناوبة النشطة حالياً ⚡' : 'خارج وقت المناوبة'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setNrIsOnDuty(!nrIsOnDuty)}
                className={`relative w-12 h-6.5 rounded-full transition-colors flex items-center px-1 ${
                  nrIsOnDuty ? 'bg-teal-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    nrIsOnDuty ? 'translate-x-0' : '-translate-x-5.5'
                  }`}
                />
              </button>
            </div>

            {/* Smart Duty Timer presets for Nurse */}
            {nrIsOnDuty && (
              <div className="bg-teal-50/70 border border-teal-100 rounded-2xl p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                  <Timer className="w-4 h-4 text-teal-600" />
                  <span>المؤقت الذكي لمناوبة الممرض:</span>
                </div>

                <div className="grid grid-cols-4 gap-1 text-xs font-bold">
                  {['4:00 صباحاً', '7:00 صباحاً', '9:00 صباحاً', 'مناوبة كاملة'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNrDutyEndTime(preset)}
                      className={`py-1.5 px-1.5 rounded-xl border text-center transition-all text-[11px] ${
                        nrDutyEndTime === preset
                          ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-teal-200 hover:bg-teal-50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSaveNurse}
              disabled={isSaving}
              className="w-full bg-teal-600 hover:bg-teal-700 active:scale-98 text-white py-3 rounded-2xl font-bold text-xs transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <span>جاري الحفظ والمزامنة...</span>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم تحديث حالة الممرض بنجاح!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ وتحديث الحالة اللحظية</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Spaceship Deployment & dist.zip Download Box */}
        <div className="pt-2 border-t border-slate-200">
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">تجهيز استضافة Spaceship 🚀</div>
                  <div className="text-[10px] text-slate-400">حزمة الإنتاج الكاملة مع ملف .htaccess المخصص</div>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                جاهز للرفع
              </span>
            </div>

            <div className="text-[11px] text-slate-300 space-y-1 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 leading-relaxed">
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold shrink-0">1.</span>
                <span>حمّل ملف <strong className="text-white">dist.zip</strong> المضغوط عبر الزر أدناه.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold shrink-0">2.</span>
                <span>ادخل إلى مدير الملفات في Spaceship وافتحه داخل مجلد <code className="text-emerald-300 bg-slate-900 px-1 rounded">public_html</code>.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold shrink-0">3.</span>
                <span>اضغط كليك يمين على الملف واختر <strong className="text-white">Extract</strong> لفك الضغط وسيعمل فوراً مع SSL.</span>
              </div>
            </div>

            <a
              href="/dist.zip"
              download="dist.zip"
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-900/40"
            >
              <Download className="w-4 h-4" />
              <FolderArchive className="w-4 h-4" />
              <span>تحميل مجلد dist.zip المضغوط الآن</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
