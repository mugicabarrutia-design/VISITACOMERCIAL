import React from 'react';
import { useData } from '../context/DataContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useData();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let bg = 'bg-slate-900 border-slate-700 text-white';
        let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;

        if (toast.tipo === 'exito') {
          bg = 'bg-emerald-950/90 border-emerald-700/60 text-emerald-100 shadow-emerald-900/30';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        } else if (toast.tipo === 'error') {
          bg = 'bg-rose-950/90 border-rose-700/60 text-rose-100 shadow-rose-900/30';
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
        } else if (toast.tipo === 'aviso') {
          bg = 'bg-amber-950/90 border-amber-700/60 text-amber-100 shadow-amber-900/30';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${bg}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{toast.mensaje}</p>
              {toast.detalles && (
                <p className="text-xs opacity-85 mt-0.5 leading-relaxed break-words">{toast.detalles}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white p-1 rounded-md transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
