import React, { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCircle, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { audioManager, SoundType } from '../services/audioManager';
import { ToastMessage, SectorContext } from '../services/notificationService';

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'ready';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export function useToastSubscription(screenSector: SectorContext) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = `t_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const handleGlobalToast = (e: any) => {
      const detail: ToastMessage = e.detail;
      if (!detail) return;
      const target = detail.targetSector || 'all';

      const sec = String(screenSector);
      // Strict Sector Routing Filter
      const isMatch =
        target === 'all' ||
        target === sec ||
        sec === 'all' ||
        sec === 'gerente' ||
        (target === 'caixa' && (sec === 'caixa' || sec === 'gerente'));

      if (isMatch) {
        const text = detail.title ? `${detail.title}: ${detail.message}` : detail.message;
        addToast(text, detail.type || 'info');
      }
    };

    window.addEventListener('adegaos_show_toast', handleGlobalToast as EventListener);
    return () => {
      window.removeEventListener('adegaos_show_toast', handleGlobalToast as EventListener);
    };
  }, [screenSector, addToast]);

  return { toasts, addToast, removeToast };
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
  theme?: 'dark' | 'light';
}

export function playPremiumSound(type: 'success' | 'warning' | 'error' | 'bell' | 'ready' | string) {
  try {
    let sound: SoundType = 'ding';
    if (type === 'success' || type === 'ready') sound = 'order_ready';
    else if (type === 'warning' || type === 'error') sound = 'order_cancelled';
    else if (type === 'bell') sound = 'order_created';

    audioManager.play(sound);
  } catch (e) {
    console.log(`Audio notification triggered: ${type}`);
  }
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove, theme = 'dark' }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(toast => {
        // Automatically close toasts after 4 seconds
        return (
          <ToastNotificationItem
            key={toast.id}
            toast={toast}
            onRemove={onRemove}
            theme={theme}
          />
        );
      })}
    </div>
  );
};

interface ToastNotificationItemProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
  theme: 'dark' | 'light';
}

const ToastNotificationItem: React.FC<ToastNotificationItemProps> = ({ toast, onRemove, theme }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const styles = {
    success: {
      bg: theme === 'dark' ? 'bg-[#152E22] border-emerald-500/30' : 'bg-emerald-50 border-emerald-200',
      text: theme === 'dark' ? 'text-emerald-400' : 'text-emerald-800',
      icon: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
    },
    warning: {
      bg: theme === 'dark' ? 'bg-[#2E2815] border-amber-500/30' : 'bg-amber-50 border-amber-200',
      text: theme === 'dark' ? 'text-amber-400' : 'text-amber-800',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
    },
    error: {
      bg: theme === 'dark' ? 'bg-[#2E1515] border-rose-500/30' : 'bg-rose-50 border-rose-200',
      text: theme === 'dark' ? 'text-rose-400' : 'text-rose-800',
      icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
    },
    info: {
      bg: theme === 'dark' ? 'bg-[#15202E] border-sky-500/30' : 'bg-sky-50 border-sky-200',
      text: theme === 'dark' ? 'text-sky-400' : 'text-sky-800',
      icon: <Bell className="w-4 h-4 text-sky-400 shrink-0" />
    }
  };

  const config = styles[toast.type] || styles.info;

  return (
    <div
      id={`toast-${toast.id}`}
      className={`p-3.5 rounded-xl border flex items-start gap-3 shadow-lg transition-all duration-300 animate-slide-in ${config.bg} ${config.text}`}
    >
      {config.icon}
      <p className="text-xs font-medium leading-relaxed flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-gray-200 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
