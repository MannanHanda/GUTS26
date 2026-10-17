'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning';
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = 'success',
  isOpen,
  onClose,
  duration = 3200,
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const bgStyles =
    type === 'success'
      ? 'bg-slate-900 text-white border-slate-800'
      : type === 'warning'
      ? 'bg-amber-950 text-amber-100 border-amber-800'
      : 'bg-teal-950 text-teal-100 border-teal-800';

  const iconColor =
    type === 'success'
      ? 'text-teal-400'
      : type === 'warning'
      ? 'text-amber-400'
      : 'text-teal-400';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-scale-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md ${bgStyles}`}
      >
        {type === 'success' && <CheckCircle2 className={`w-4 h-4 ${iconColor} shrink-0`} />}
        {type === 'warning' && <AlertCircle className={`w-4 h-4 ${iconColor} shrink-0`} />}
        {type === 'info' && <Info className={`w-4 h-4 ${iconColor} shrink-0`} />}

        <span className="text-xs font-semibold tracking-wide pr-2">{message}</span>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-0.5 rounded transition"
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
