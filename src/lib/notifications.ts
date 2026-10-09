export const notificationService = {
  isSupported(): boolean {
    return 'Notification' in window;
  },

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<NotificationPermission> {
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
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    this.playChime();

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // Ignore vibration errors
      }
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
      console.warn('Notification send failed, falling back:', e);
      try {
        new Notification(title, defaultOptions);
        return true;
      } catch {
        return false;
      }
    }
  },

  // منع التكرار: سجل زمني لآخر إشعار تم إرساله لكل صيدلية (لمدة 60 ثانية)
  _dutySentTimes: new Map<string, number>(),

  /**
   * تنسيق اسم الصيدلية وإزالة أي تكرار لكلمة "صيدلية"
   */
  formatPharmacyName(name: string): string {
    let clean = name.trim();
    // إزالة أي تكرار لكلمة "صيدلية" متتالية
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

    // استخدام tag ثابت بدون Date.now() لمنع تكرار النوافذ في نظام التشغيل والمتصفح
    const safeTag = `duty-${cleanName.replace(/\s+/g, '-')}`;

    return this.sendNotification(title, {
      body: bodyDetails || `تم اعتماد ${cleanName} رسمياً كمناوبة ليلية في دير حافر.`,
      tag: safeTag
    } as NotificationOptions);
  }
};

