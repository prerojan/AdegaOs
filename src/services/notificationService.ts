// FluxOS Decoupled Operational Notification Service
// Listens to EventBus and coordinates sound chimes, visual toasts, and PWA background notifications.

import { eventBus } from './eventBus';
import { audioManager, SoundType } from './audioManager';
import { pwaService } from './pwaService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  targetSector?: SectorContext;
}

export type SectorContext = 'producao' | 'order' | 'caixa' | 'gerente' | 'all';

class NotificationService {
  private isSubscribed: boolean = false;
  private activeSector: SectorContext = 'all';

  constructor() {
    this.init();
  }

  public setSector(sector: SectorContext) {
    this.activeSector = sector;
  }

  public getSector(): SectorContext {
    if (this.activeSector !== 'all') return this.activeSector;
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('order') || path.includes('mobile')) return 'order';
      if (path.includes('producao') || path.includes('cozinha')) return 'producao';
      if (path.includes('caixa') || path.includes('venda')) return 'caixa';
    }
    return 'all';
  }

  public init() {
    if (this.isSubscribed) return;
    this.isSubscribed = true;

    // 1. ORDER_CREATED -> Targeted ONLY to Produção
    eventBus.subscribe('ORDER_CREATED', (payload) => {
      const tableInfo = payload.table ? ` (Mesa/Comanda: ${payload.table})` : '';
      const itemCount = payload.items?.length || 0;
      const title = `Novo Pedido #${payload.id.slice(-6).toUpperCase()}`;
      const message = `${itemCount} item(ns) registrado(s)${tableInfo}`;

      this.triggerAlert({
        title,
        message,
        sound: 'order_created',
        toastType: 'info',
        targetSector: 'producao'
      });
    });

    // 2. ORDER_READY -> Targeted ONLY to Order / Garçom
    eventBus.subscribe('ORDER_READY', (payload) => {
      const tableInfo = payload.table ? ` (Mesa/Comanda: ${payload.table})` : '';
      const title = `Pedido Pronto #${payload.id.slice(-6).toUpperCase()}`;
      const message = `Pedido pronto para entrega${tableInfo}`;

      this.triggerAlert({
        title,
        message,
        sound: 'order_ready',
        toastType: 'success',
        targetSector: 'order'
      });
    });

    // 3. ORDER_CANCELLED -> Bidirectional: notifies opposite sector
    eventBus.subscribe('ORDER_CANCELLED', (payload) => {
      const origin = payload.origin || 'order';
      const targetSector: SectorContext = origin === 'order' ? 'producao' : origin === 'producao' ? 'order' : 'all';

      const title = `Pedido Cancelado #${payload.id.slice(-6).toUpperCase()}`;
      const message = payload.reason ? `Motivo: ${payload.reason}` : 'O pedido foi cancelado pelo operador.';

      this.triggerAlert({
        title,
        message,
        sound: 'order_cancelled',
        toastType: 'warning',
        targetSector
      });
    });

    // 4. NOTIFICATION_REQUESTED -> Filtered by target sector
    eventBus.subscribe('NOTIFICATION_REQUESTED', (payload) => {
      let toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
      if (payload.type === 'print_error') toastType = 'error';
      else if (payload.type === 'order_ready' || payload.type === 'cash_flow') toastType = 'success';
      else if (payload.type === 'warning') toastType = 'warning';

      const targetSector: SectorContext = payload.type === 'cash_flow' ? 'caixa' : payload.type === 'print_error' ? 'producao' : 'all';

      this.triggerAlert({
        title: payload.title,
        message: payload.message,
        sound: payload.sound || (payload.type === 'print_error' ? 'print_error' : payload.type === 'cash_flow' ? 'cash_flow' : 'ding'),
        toastType,
        targetSector
      });
    });
  }

  private recentNotifs: Map<string, number> = new Map();

  private triggerAlert(params: {
    title: string;
    message: string;
    sound?: SoundType;
    toastType: 'success' | 'error' | 'warning' | 'info';
    targetSector?: SectorContext;
  }) {
    const current = this.getSector();
    const target = params.targetSector || 'all';

    // Sector Check: If target is specific (e.g., 'producao' or 'order') and current sector doesn't match, block notification
    const isTargetSectorMatched = (target === 'all' || current === 'all' || current === target || current === 'gerente');

    // A. Sound Chime (respecting adegaos_sector_sound_routing)
    if (params.sound && isTargetSectorMatched) {
      audioManager.play(params.sound, undefined, target);
    }

    // B. Physical Haptic Vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && isTargetSectorMatched) {
      try {
        navigator.vibrate([300, 150, 300, 150, 300]);
      } catch (e) {}
    }

    // C. Visual Toast Dispatch (With explicit targetSector payload)
    if (typeof window !== 'undefined') {
      const toastDetail: ToastMessage = {
        id: `toast_${Date.now()}_${Math.random()}`,
        type: params.toastType,
        title: params.title,
        message: params.message,
        timestamp: Date.now(),
        targetSector: target
      };
      window.dispatchEvent(new CustomEvent('adegaos_show_toast', { detail: toastDetail }));
    }

    // D. PWA System Notification (ONLY send if current sector matches targetSector!)
    if (isTargetSectorMatched) {
      const notifKey = `${params.title}_${params.message}`;
      const now = Date.now();
      const lastSent = this.recentNotifs.get(notifKey);

      if (lastSent && now - lastSent < 5000) {
        console.log(`[NotificationService] Suppressed duplicate PWA notification: ${params.title}`);
        return;
      }
      this.recentNotifs.set(notifKey, now);

      // Clean old entries
      if (this.recentNotifs.size > 50) {
        this.recentNotifs.forEach((time, key) => {
          if (now - time > 10000) this.recentNotifs.delete(key);
        });
      }

      // Generate stable tag derived from title/content to allow browser native deduplication
      const stableTag = `flux_tag_${params.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const notifCategory: 'order' | 'error' | 'general' = params.toastType === 'error' || params.sound === 'print_error' ? 'error' : (params.sound === 'order_created' || params.sound === 'order_ready' ? 'order' : 'general');

      pwaService.sendNotification(params.title, {
        body: params.message,
        tag: stableTag,
        vibrate: params.sound === 'order_created' ? [300, 150, 300, 150, 300] : [200, 100, 200]
      }, notifCategory);
    } else {
      console.log(`[NotificationService] Suppressed notification for sector '${current}' (Target: '${target}')`);
    }
  }
}

export const notificationService = new NotificationService();
