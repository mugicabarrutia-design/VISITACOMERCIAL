import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { supabaseUrl, supabaseAnonKey, saveSupabaseConfig, clearSupabaseConfig, isSupabaseConfigured } from '../lib/supabaseClient';
import { X, Database, CheckCircle, AlertTriangle, Copy, ExternalLink, RefreshCw } from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const { isLiveSupabase, resetearDatosDemo, addToast } = useData();

  const [url, setUrl] = useState(supabaseUrl || '');
  const [anonKey, setAnonKey] = useState(supabaseAnonKey || '');
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      addToast('aviso', 'Campos vacíos', 'Introduce la URL y la Anon Key de tu proyecto Supabase.');
      return;
    }
    saveSupabaseConfig(url, anonKey);
  };

  const handleClear = () => {
    clearSupabaseConfig();
  };

  const copiarInstruccion = () => {
    navigator.clipboard.writeText('supabase/schema.sql');
    setCopiedSql(true);
    addToast('info', 'Copiado', 'Ruta del archivo copiada al portapapeles.');
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isLiveSupabase ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Conexión con Supabase</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isLiveSupabase ? 'Conectado a tu base de datos Supabase' : 'Modo Demostración / Almacenamiento local activo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status badge */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            isLiveSupabase
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
          }`}>
            {isLiveSupabase ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-sm mb-0.5">
                {isLiveSupabase ? 'Base de datos en tiempo real activa' : 'Modo Local / Demo Activo'}
              </p>
              {isLiveSupabase ? (
                <p>Las visitas, comerciales y clientes se están guardando y sincronizando en tu base de datos Supabase directamente.</p>
              ) : (
                <p>
                  No se han detectado credenciales de Supabase en el entorno. La aplicación está funcionando con almacenamiento local de prueba con 3 comerciales, 8 clientes y 10 visitas. Para conectar tu propio Supabase, introduce las credenciales abajo.
                </p>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                VITE_SUPABASE_URL (Project URL)
              </label>
              <input
                type="url"
                placeholder="https://xyzabcdefg.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                VITE_SUPABASE_ANON_KEY (Public Anon Key)
              </label>
              <textarea
                rows={3}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {isSupabaseConfigured ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Restablecer a modo local
                </button>
              ) : <div />}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 active:scale-95 transition-all"
              >
                Guardar y Conectar
              </button>
            </div>
          </form>

          {/* Quick instructions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              ¿Cómo configurar tu Supabase en 2 minutos?
            </h4>
            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
              <li>Crea un proyecto en <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a></li>
              <li>Abre el <strong>SQL Editor</strong> en Supabase y ejecuta el script generado:</li>
            </ol>
            <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-200">
              <span>supabase/schema.sql</span>
              <button
                onClick={copiarInstruccion}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-sans font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedSql ? 'Copiado' : 'Copiar ruta'}
              </button>
            </div>
            <li>Copia tu <strong>Project URL</strong> y tu <strong>anon public key</strong> de Project Settings &gt; API y pégalos arriba.</li>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => {
                  resetearDatosDemo();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                Reinicializar datos demo en modo local
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
