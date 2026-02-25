// ============================================================
// HOLYPOT TOASTER — Notificaciones nativas del sistema
// Uso:  import { toast } from '@/components/Toaster'
//       toast.success('Mensaje')
//       toast.error('Mensaje')
//       toast.trade({ title, detail, pnl })   ← trade abierto
//       toast.tp({ symbol, pnl })             ← Take Profit
//       toast.sl({ symbol, pnl })             ← Stop Loss
//       toast.drawdown()                      ← descalificación
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle, Info,
  Rocket, Target, Shield, TrendingUp, TrendingDown, X
} from 'lucide-react';

// ── Singleton event bus (funciona desde cualquier archivo) ────────────────
let _listeners = [];
const _emit = (t) => _listeners.forEach(fn => fn(t));
const _subscribe  = (fn) => { _listeners.push(fn); return () => { _listeners = _listeners.filter(f => f !== fn); }; };

let _id = 0;
const mk = (type, title, detail = '', opts = {}) =>
  ({ id: ++_id, type, title, detail, ...opts });

export const toast = {
  success:   (title, detail)       => _emit(mk('success',   title, detail)),
  error:     (title, detail)       => _emit(mk('error',     title, detail)),
  warning:   (title, detail)       => _emit(mk('warning',   title, detail)),
  info:      (title, detail)       => _emit(mk('info',      title, detail)),
  trade:     ({ title, detail, pnl } = {}) => _emit(mk('trade',    title, detail, { pnl })),
  tp:        ({ symbol, pnl } = {})        => _emit(mk('tp',       `🎯 ¡Take Profit!`, `${symbol} cerrado`, { pnl })),
  sl:        ({ symbol, pnl } = {})        => _emit(mk('sl',       `🛑 Stop Loss`,      `${symbol} cerrado`, { pnl })),
  drawdown:  ()                            => _emit(mk('drawdown', '⚠️ Drawdown máximo', 'Cuenta descalificada (−10%)')),
};

// ── Configuración visual por tipo ─────────────────────────────────────────
const CONFIG = {
  success:  { icon: CheckCircle2, accent: '#00C853', bg: 'bg-[#00C853]/10', border: 'border-[#00C853]/30', iconColor: 'text-[#00C853]' },
  error:    { icon: XCircle,       accent: '#FF4444', bg: 'bg-red-500/10',   border: 'border-red-500/30',   iconColor: 'text-red-400' },
  warning:  { icon: AlertTriangle, accent: '#F59E0B', bg: 'bg-yellow-500/10',border: 'border-yellow-500/30',iconColor: 'text-yellow-400' },
  info:     { icon: Info,          accent: '#4a9eff', bg: 'bg-blue-500/10',  border: 'border-blue-500/30',  iconColor: 'text-blue-400' },
  trade:    { icon: Rocket,        accent: '#FFD700', bg: 'bg-[#FFD700]/10', border: 'border-[#FFD700]/30', iconColor: 'text-[#FFD700]' },
  tp:       { icon: Target,        accent: '#00C853', bg: 'bg-[#00C853]/10', border: 'border-[#00C853]/30', iconColor: 'text-[#00C853]' },
  sl:       { icon: Shield,        accent: '#FF4444', bg: 'bg-red-500/10',   border: 'border-red-500/30',   iconColor: 'text-red-400' },
  drawdown: { icon: AlertTriangle, accent: '#F59E0B', bg: 'bg-orange-500/10',border: 'border-orange-500/30',iconColor: 'text-orange-400' },
};

const DURATION = 5000; // ms

// ── Toast individual ──────────────────────────────────────────────────────
function ToastItem({ t, onRemove }) {
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef(null);
  const startRef    = useRef(Date.now());
  const remainRef   = useRef(DURATION);
  const cfg = CONFIG[t.type] || CONFIG.info;
  const Icon = cfg.icon;

  const startTimer = () => {
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, ((remainRef.current - elapsed) / DURATION) * 100);
      setProgress(pct);
      if (pct === 0) {
        clearInterval(intervalRef.current);
        dismiss();
      }
    }, 30);
  };

  const pauseTimer = () => {
    clearInterval(intervalRef.current);
    remainRef.current -= Date.now() - startRef.current;
  };

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onRemove(t.id), 350);
  };

  useEffect(() => {
    // slide-in
    requestAnimationFrame(() => setVisible(true));
    startTimer();
    return () => clearInterval(intervalRef.current);
  }, []);

  const pnlNum = t.pnl !== undefined ? parseFloat(t.pnl) : null;
  const hasPnl = pnlNum !== null && !isNaN(pnlNum);

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border backdrop-blur-md
        bg-[#161616]/95 ${cfg.border}
        shadow-[0_8px_32px_rgba(0,0,0,0.6)]
        transition-all duration-350 ease-out
        w-[340px] max-w-[calc(100vw-2rem)]
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
      `}
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
    >
      {/* Progress bar */}
      <div
        className="absolute top-0 left-0 h-[2px] transition-all duration-[30ms] ease-linear rounded-t-xl"
        style={{ width: `${progress}%`, backgroundColor: cfg.accent }}
      />

      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
          <Icon className={`h-5 w-5 ${cfg.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-semibold text-white leading-tight">{t.title}</p>
          {t.detail && (
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">{t.detail}</p>
          )}
          {hasPnl && (
            <div className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-xs font-bold ${
              pnlNum > 0
                ? 'bg-[#00C853]/15 text-[#00C853]'
                : pnlNum < 0
                ? 'bg-red-500/15 text-red-400'
                : 'bg-gray-500/15 text-gray-400'
            }`}>
              {pnlNum > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {pnlNum > 0 ? '+' : ''}{parseFloat(pnlNum).toFixed(2)}%
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={dismiss}
          className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-white/10 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Contenedor global — montar una vez en App.jsx ─────────────────────────
export function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return _subscribe((t) => {
      setToasts(prev => [...prev.slice(-4), t]); // máx 5 apilados
    });
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem t={t} onRemove={remove} />
        </div>
      ))}
    </div>
  );
}
