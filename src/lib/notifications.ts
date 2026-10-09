import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const notificationService = {
  _channelCreated: false,

  isNative(): boolean {
    return Capacitor.isNativePlatform();
  },

  isSupported(): boolean {
    if (this.isNative()) return true;
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  async ensureNativeChannel() {
    if (!this.isNative() || this._channelCreated) return;
    try {
      await LocalNotifications.createChannel({
        id: 'duty-channel',
        name: 'إشعارات صيدليات المناوبة والطوارئ',
        description: 'تنبيهات فورية عند اعتماد الصيدليات المناوبة في دير حافر',
        importance: 5, // High heads-up alert
        visibility: 1, // Public on lockscreen
        vibration: true,
        sound: 'beep.wav',
        lights: true,
        lightColor: '#059669'
      });
      this._channelCreated = true;
    } catch (e) {
      console.warn('Channel creation error:', e);
    }
  },

  async getPermission(): Promise<NotificationPermission> {
    if (this.isNative()) {
      try {
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display === 'granted') return 'granted';
        if (perm.display === 'denied') return 'denied';
        return 'default';
      } catch {
        return 'default';
      }
    }

    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (this.isNative()) {
      try {
        await this.ensureNativeChannel();
        const res = await LocalNotifications.requestPermissions();
        return res.display === 'granted' ? 'granted' : 'denied';
      } catch (e) {
        console.warn('Native permission request failed:', e);
        return 'denied';
      }
    }

    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  },

  playChime() {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio autoplay restrictions ignored
    }
  },

  async sendNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    const isNativeApp = this.isNative();

    this.playChime();

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // Ignore vibration errors
      }
    }

    // 1. If running as Native Android APK
    if (isNativeApp) {
      try {
        await this.ensureNativeChannel();
        const notifId = Math.floor(Math.random() * 90000) + 10000;
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title: title,
              body: options?.body || '',
              channelId: 'duty-channel',
              sound: 'beep.wav',
              smallIcon: 'ic_launcher_round',
              iconColor: '#059669',
              actionTypeId: '',
              extra: null
            }
          ]
        });
        return true;
      } catch (e) {
        console.warn('Native notification schedule error:', e);
      }
    }

    // 2. Web / PWA fallback
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      dir: 'rtl',
      lang: 'ar',
      ...options
    };

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.showNotification) {
          await reg.showNotification(title, defaultOptions);
          return true;
        }
      }

      new Notification(title, defaultOptions);
      return true;
    } catch (e) {
      console.warn('Web notification send failed:', e);
      return false;
    }
  },

  // منع التكرار: سجل زمني لآخر إشعار تم إرساله لكل صيدلية (لمدة 30 ثانية)
  _dutySentTimes: new Map<string, number>(),

  /**
   * تنسيق اسم الصيدلية وإزالة أي تكرار لكلمة "صيدلية"
   */
  formatPharmacyName(name: string): string {
    let clean = name.trim();
    clean = clean.replace(/^(صيدلية\s*)+/gi, '').trim();
    return `صيدلية ${clean}`;
  },

  /**
   * إشعار المناوبة الليلية المعتمد: "تناوب الليلة : صيدلية كذا"
   * مع حماية كاملة ضد التكرار (Deduplication)
   */
  async sendDutyNotification(
    pharmacyName: string,
    dutyEndTime?: string,
    district?: string
  ): Promise<boolean> {
    const cleanName = this.formatPharmacyName(pharmacyName);
    const title = `تناوب الليلة : ${cleanName}`;

    // فحص منع التكرار: إذا تم إرسال إشعار لهذه الصيدلية خلال آخر 30 ثانية لا تكرره
    const now = Date.now();
    const lastSent = this._dutySentTimes.get(cleanName);
    if (lastSent && now - lastSent < 30000) {
      return false; // تم الإرسال مؤخراً، منع التكرار
    }
    this._dutySentTimes.set(cleanName, now);

    const bodyDetails = [
      district ? `المنطقة: ${district}` : '',
      dutyEndTime ? `أوقات المناوبة: حتى ${dutyEndTime}` : 'متاحة الآن طوال الليل'
    ]
      .filter(Boolean)
      .join(' | ');

    const safeTag = `duty-${cleanName.replace(/\s+/g, '-')}`;

    return this.sendNotification(title, {
      body: bodyDetails || `تم اعتماد ${cleanName} رسمياً كمناوبة ليلية في دير حافر.`,
      tag: safeTag
    } as NotificationOptions);
  }
};
