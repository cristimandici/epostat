'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toast as ToastType } from '@/lib/types';

interface ToastProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastType; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const colors = {
    success: 'border-green-200 bg-white',
    error: 'border-red-200 bg-white',
    info: 'border-blue-200 bg-white',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg max-w-sm',
        colors[toast.type],
        visible ? 'animate-toast-in' : 'opacity-0 translate-x-full transition-all duration-300'
      )}
    >
      {icons[toast.type]}
      <p className="text-sm font-medium text-slate-800 flex-1">{toast.message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
        className="text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Închide notificarea"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
