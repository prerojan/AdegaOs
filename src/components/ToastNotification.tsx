import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, Bell, XCircle, Printer } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'ready' | 'cancel' | 'print';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Single lazily-initialized shared AudioContext to prevent context limits and leaks
let sharedAudioContext: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioContext) {
      sharedAudioContext = new AudioContextClass();
    }
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }
    return sharedAudioContext;
  } catch (e) {
    console.warn("Shared AudioContext creation or resume failed:", e);
    return null;
  }
}

// Custom synthesizer audio engine using Web Audio API (Natively Scheduled, Precise & Leak-free)
export function playPremiumSound(type: ToastType) {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'success') {
      // Sweet rising double chime natively scheduled in audio time (no setTimeouts!)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.1); // A5
      osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.25); // E6
      gain2.gain.setValueAtTime(0.35, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.45);

    } else if (type === 'ready') {
      // High-pitched waiter chime natively scheduled in audio time
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1479.98, now + 0.13); // F#6
      gain2.gain.setValueAtTime(0.35, now + 0.13);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.13);
      osc2.stop(now + 0.38);

    } else if (type === 'info') {
      // Clean, professional double beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);

    } else if (type === 'warning') {
      // Attention grabbing double detuned chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(329.63, now + 0.12); // E4
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);

    } else if (type === 'cancel') {
      // Low descending triple tone (cancellation/loss)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(392.00, now); // G4
      osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.25); // C4
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

    } else if (type === 'print') {
      // Satisfying physical thermal print head mechanical buzz (natively scheduled to avoid gaps)
      const duration = 0.8;
      const interval = 0.06; // seconds
      for (let timeOffset = 0; timeOffset < duration; timeOffset += interval) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100 + Math.random() * 90, now + timeOffset);
        gain.gain.setValueAtTime(0.06, now + timeOffset); // Softer volume to prevent audio distortion
        gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.04);
      }
    }
  } catch (e) {
    console.warn("AudioContext playback prevented by browser policy:", e);
  }
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
  theme: 'dark' | 'light';
}

export function ToastContainer({ toasts, onRemove, theme }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onRemove={onRemove} theme={theme} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastCardProps {
  key?: string;
  toast: ToastItem;
  onRemove: (id: string) => void;
  theme: 'dark' | 'light';
}

function ToastCard({ toast, onRemove, theme }: ToastCardProps) {
  const soundPlayedRef = useRef(false);
  const onRemoveRef = useRef(onRemove);
  onRemoveRef.current = onRemove;

  useEffect(() => {
    // Play the unique sound effect once and only once on mount
    if (!soundPlayedRef.current) {
      playPremiumSound(toast.type);
      soundPlayedRef.current = true;
    }
  }, [toast.type]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemoveRef.current(toast.id);
    }, toast.duration || 3200);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration]);

  const config = {
    success: {
      bg: theme === 'dark' ? 'bg-[#0A1D15]/95 border-[#10B981]/40' : 'bg-[#ECFDF5]/95 border-[#10B981]/50',
      text: theme === 'dark' ? 'text-[#10B981]' : 'text-[#065F46]',
      icon: <CheckCircle2 className="w-5 h-5 shrink-0 text-[#10B981]" />,
      descColor: theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
    },
    info: {
      bg: theme === 'dark' ? 'bg-[#0E1A2B]/95 border-[#3B82F6]/40' : 'bg-[#EFF6FF]/95 border-[#3B82F6]/50',
      text: theme === 'dark' ? 'text-[#3B82F6]' : 'text-[#1E40AF]',
      icon: <Info className="w-5 h-5 shrink-0 text-[#3B82F6]" />,
      descColor: theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
    },
    warning: {
      bg: theme === 'dark' ? 'bg-[#221808]/95 border-[#F59E0B]/40' : 'bg-[#FFFBEB]/95 border-[#F59E0B]/50',
      text: theme === 'dark' ? 'text-[#F59E0B]' : 'text-[#92400E]',
      icon: <AlertTriangle className="w-5 h-5 shrink-0 text-[#F59E0B]" />,
      descColor: theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
    },
    ready: {
      bg: theme === 'dark' ? 'bg-[#18112B]/95 border-[#8B5CF6]/40' : 'bg-[#F5F3FF]/95 border-[#8B5CF6]/50',
      text: theme === 'dark' ? 'text-[#8B5CF6]' : 'text-[#5B21B6]',
      icon: <Bell className="w-5 h-5 shrink-0 text-[#8B5CF6] animate-bounce" />,
      descColor: theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
    },
    cancel: {
      bg: theme === 'dark' ? 'bg-[#200A0A]/95 border-[#EF4444]/40' : 'bg-[#FEF2F2]/95 border-[#EF4444]/50',
      text: theme === 'dark' ? 'text-[#EF4444]' : 'text-[#991B1B]',
      icon: <XCircle className="w-5 h-5 shrink-0 text-[#EF4444]" />,
      descColor: theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
    },
    print: {
      bg: theme === 'dark' ? 'bg-[#0F1E19]/95 border-[#18F2A4]/40' : 'bg-[#F0FDF4]/95 border-[#10B981]/50',
      text: theme === 'dark' ? 'text-[#18F2A4]' : 'text-[#065F46]',
      icon: <Printer className="w-5 h-5 shrink-0 text-[#18F2A4]" />,
      descColor: theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
    }
  }[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 350 }}
      className={`p-3.5 rounded-xl border flex items-start gap-3 shadow-xl backdrop-blur-md pointer-events-auto ${config.bg}`}
    >
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1 flex flex-col">
        <span className={`text-[11px] font-bold tracking-widest uppercase mb-0.5 ${config.text}`}>
          {toast.type === 'ready' ? 'PEDIDO PRONTO' : toast.type === 'cancel' ? 'EVENTO CANCELADO' : toast.type === 'print' ? 'IMPRESSÃO AUTOMÁTICA' : 'NOTIFICAÇÃO'}
        </span>
        <p className={`text-xs font-semibold leading-relaxed ${config.descColor}`}>{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-gray-100 transition-colors p-0.5 rounded cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}
