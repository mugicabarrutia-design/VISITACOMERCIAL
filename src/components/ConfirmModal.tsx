import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl ${isDestructive ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' : 'bg-blue-100 text-blue-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {message}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-rose-600/30'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-600/30'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
