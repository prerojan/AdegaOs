// FluxOS PWA & Background Notification Service
// Handles Service Worker registration, Web Notifications API permissions, and background/minimized alerts.

export interface NotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  vibrate?: number[];
  data?: any;
}

class PwaService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private permissionGranted: boolean = false;
  private sentNotifications: Map<string, number> = new Map();

  constructor() {
    this.init();
  }

  private async init() {
    if (typeof window === 'undefined') return;

    // Check Notification permission status
    if ('Notification' in window) {
      this.permissionGranted = Notification.permission === 'granted';
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        this.swRegistration = reg;
        console.log('[PWA Service] Service Worker registered with scope:', reg.scope);
      } catch (err) {
        console.warn('[PWA Service] Service Worker registration failed:', err);
      }
    }
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      this.permissionGranted = result === 'granted';
      return this.permissionGranted;
    } catch (err) {
      console.warn('[PWA Service] Request permission error:', err);
      return false;
    }
  }

  public getPermissionStatus(): string {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  public async sendNotification(title: string, options: NotificationOptions, category: 'order' | 'error' | 'general' = 'general'): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;

    // Check PWA Notification Activation Flags from Configurações
    const notifyOrders = localStorage.getItem('adegaos_pwa_notify_orders') !== 'false';
    const notifyErrors = localStorage.getItem('adegaos_pwa_notify_errors') !== 'false';

    const lowerTitle = title.toLowerCase();
    const isError = category === 'error' || lowerTitle.includes('erro') || lowerTitle.includes('falha') || lowerTitle.includes('impressora');
    const isOrder = category === 'order' || lowerTitle.includes('pedido') || lowerTitle.includes('venda') || lowerTitle.includes('caixa');

    if (isError && !notifyErrors) {
      console.log(`[PWA Service] Suppressed error notification "${title}": disabled in adegaos_pwa_notify_errors`);
      return false;
    }
    if (isOrder && !notifyOrders) {
      console.log(`[PWA Service] Suppressed order notification "${title}": disabled in adegaos_pwa_notify_orders`);
      return false;
    }

    // Deduplicate identical title+body requests within 5000ms
    const key = `${title}_${options.body}`;
    const now = Date.now();
    const lastSent = this.sentNotifications.get(key);
    if (lastSent && now - lastSent < 5000) {
      console.log(`[PWA Service] Duplicate notification skipped: "${title}"`);
      return false;
    }
    this.sentNotifications.set(key, now);

    // Check if permission is granted
    if (Notification.permission !== 'granted') {
      const granted = await this.requestNotificationPermission();
      if (!granted) return false;
    }

    const payloadOptions: any = {
      body: options.body,
      icon: options.icon || '/icon.png',
      badge: options.badge || '/logo-bw.png',
      tag: options.tag || `fluxos_notif_${Date.now()}`,
      vibrate: options.vibrate || [300, 150, 300, 150, 300],
      renotify: true,
      requireInteraction: true,
      data: options.data || { url: window.location.href }
    };

    try {
      // 1. Try active stored Service Worker registration
      let reg: ServiceWorkerRegistration | null = this.swRegistration;

      // 2. Query active registration directly from browser without blocking on .ready Promise
      if ((!reg || !reg.active) && 'serviceWorker' in navigator) {
        try {
          const activeReg = await navigator.serviceWorker.getRegistration();
          if (activeReg && activeReg.active) {
            reg = activeReg;
            this.swRegistration = activeReg;
          }
        } catch (e) {}
      }

      // 3. Fallback to navigator.serviceWorker.ready if getRegistration was null (with 1500ms race timeout)
      if ((!reg || !reg.active) && 'serviceWorker' in navigator) {
        try {
          const readyReg = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<null>(resolve => setTimeout(() => resolve(null), 1500))
          ]);
          if (readyReg && readyReg.active) {
            reg = readyReg;
            this.swRegistration = readyReg;
          }
        } catch (e) {}
      }

      // If Service Worker registration is found, show notification via SW
      if (reg && reg.showNotification) {
        await reg.showNotification(title, payloadOptions as any);
        return true;
      }

      // 4. Fallback to standard window Notification constructor (Only on non-Android / desktop browsers where constructor is legal)
      if (typeof Notification !== 'undefined' && !/Android/i.test(navigator.userAgent)) {
        const notif = new Notification(title, payloadOptions);
        notif.onclick = (event) => {
          event.preventDefault();
          window.focus();
          if (payloadOptions.data?.url) {
            window.location.href = payloadOptions.data.url;
          }
        };
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[PWA Service] Failed to dispatch system notification:', err);
      this.sentNotifications.delete(key);
      return false;
    }
  }
}

export const pwaService = new PwaService();
