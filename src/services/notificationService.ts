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

  private triggerAlert(params: {
    title: string;
    message: string;
    sound?: SoundType;
    toastType: 'success' | 'error' | 'warning' | 'info';
    targetSector?: SectorContext;
  }) {
    const current = this.getSector();
    const target = params.targetSector || 'all';

    // A. Sound Chime (Play if current screen matches targetSector or targetSector is 'all')
    if (params.sound) {
      if (target === 'all' || current === 'all' || current === target || current === 'gerente') {
        audioManager.play(params.sound);
      }
    }

    // B. Physical Haptic Vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (target === 'all' || current === 'all' || current === target || current === 'gerente') {
        try {
          navigator.vibrate([300, 150, 300, 150, 300]);
        } catch (e) {}
      }
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

    // D. PWA System Notification
    pwaService.sendNotification(params.title, {
      body: params.message,
      tag: `notif_${Date.now()}`,
      vibrate: params.sound === 'order_created' ? [300, 150, 300, 150, 300] : [200, 100, 200]
    });
  }
}

export const notificationService = new NotificationService();
