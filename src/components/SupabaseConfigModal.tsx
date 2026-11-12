import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
  supabaseUrl,
  supabaseAnonKey,
  saveSupabaseConfig,
  clearSupabaseConfig,
  isSupabaseConfigured
} from '../lib/supabaseClient';
import { SCHEMA_SQL } from '../lib/schemaSql';
import {
  X,
  Database,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Check
} from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const {
    isLiveSupabase,
    needToRunSchemaSql,
    isDatabaseEmpty,
    sembrarDatosEnSupabase,
    resetearDatosDemo,
    addToast
  } = useData();

  const [url, setUrl] = useState(supabaseUrl || 'https://gmkgwmmufxrjiwetwfcd.supabase.co');
  const [anonKey, setAnonKey] = useState(supabaseAnonKey || 'sb_publishable_yr6PzoHMCPr9gu2EqGJSZg_uuj27OP4');
  const [copiedFullSql, setCopiedFullSql] = useState(false);
  const [seeding, setSeeding] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      addToast('aviso', 'Campos vacíos', 'Introduce la URL y la Publishable/Anon Key de tu proyecto Supabase.');
      return;
    }
    saveSupabaseConfig(url, anonKey);
  };

  const handleClear = () => {
    clearSupabaseConfig();
  };

  const copiarSqlCompleto = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    setCopiedFullSql(true);
    addToast('exito', 'SQL Copiado al portapapeles', 'Pégalo en el SQL Editor de tu proyecto Supabase y pulsa Run.');
    setTimeout(() => setCopiedFullSql(false), 3000);
  };

  const handleSembrarDatos = async () => {
    setSeeding(true);
    await sembrarDatosEnSupabase();
    setSeeding(false);
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
                {isLiveSupabase ? 'Conectado a tu proyecto en tiempo real' : 'Almacenamiento local activo'}
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
            needToRunSchemaSql
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : isLiveSupabase
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
          }`}>
            {needToRunSchemaSql ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : isLiveSupabase ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Database className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-sm mb-0.5">
                {needToRunSchemaSql
                  ? 'Conectado a Supabase: Falta ejecutar el script SQL'
                  : isLiveSupabase
                  ? 'Base de datos Supabase conectada'
                  : 'Modo Local / Demo Activo'}
              </p>
              {needToRunSchemaSql ? (
                <p>
                  Las credenciales son correctas, pero las tablas (<code>comerciales</code>, <code>clientes</code>, <code>visitas</code>) aún no existen en tu base de datos Supabase. Haz clic en el botón de abajo para <strong>copiar el SQL</strong> y pégalo en el SQL Editor de tu consola Supabase.
                </p>
              ) : isLiveSupabase ? (
                <p>
                  Las visitas, comerciales y clientes se sincronizan directamente con tu base de datos de Supabase en <code>gmkgwmmufxrjiwetwfcd</code>.
                </p>
              ) : (
                <p>
                  Puedes conectar tu proyecto Supabase ingresando la URL y tu clave Publishable abajo.
                </p>
              )}
            </div>
          </div>

          {/* Quick Action: Copiar SQL Completo */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Crear tablas en Supabase (`schema.sql`)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Copia el SQL listo con tablas, claves foráneas, políticas RLS e inserts
                </p>
              </div>
              <button
                type="button"
                onClick={copiarSqlCompleto}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all active:scale-95"
              >
                {copiedFullSql ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFullSql ? '¡SQL Copiado!' : 'Copiar SQL Completo'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs">
              <a
                href="https://supabase.com/dashboard/project/gmkgwmmufxrjiwetwfcd/sql/new"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                <span>Abrir SQL Editor en tu panel de Supabase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Si las tablas ya existen en Supabase pero están vacías, opción de sembrar datos */}
          {isLiveSupabase && !needToRunSchemaSql && (
            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/40 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  Sembrar datos de ejemplo en Supabase
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  Inserta 3 comerciales, 8 clientes y 10 visitas en tu base de datos de Supabase.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSembrarDatos}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs shrink-0 transition-all active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{seeding ? 'Insertando...' : 'Sembrar Datos'}</span>
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                URL del Proyecto (Base URL)
              </label>
              <input
                type="text"
                placeholder="https://gmkgwmmufxrjiwetwfcd.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Se limpiará automáticamente cualquier sufijo como <code>/rest/v1/</code> para evitar errores 404.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Publishable Key / Anon Public Key
              </label>
              <textarea
                rows={2}
                placeholder="sb_publishable_... o eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
              >
                Restablecer configuración
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 active:scale-95 transition-all"
              >
                Guardar y Conectar
              </button>
            </div>
          </form>

          {/* Reset local demo option */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
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
  );
};
