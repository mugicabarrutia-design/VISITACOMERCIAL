/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Navigation, TabKey } from './components/Navigation';
import { CalendarioPage } from './pages/CalendarioPage';
import { VisitasPage } from './pages/VisitasPage';
import { ClientesPage } from './pages/ClientesPage';
import { ComercialesPage } from './pages/ComercialesPage';
import { VisitaModal } from './components/VisitaModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { ToastContainer } from './components/ToastContainer';
import { Database, Plus, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { loading, isLiveSupabase } = useData();
  const [currentTab, setCurrentTab] = useState<TabKey>('calendario');

  // Modales globales
  const [globalVisitaModalOpen, setGlobalVisitaModalOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col lg:flex-row text-slate-800 dark:text-slate-100 antialiased font-sans">
      {/* Navigation (Sidebar en desktop, Barra en móvil) */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNuevaVisita={() => setGlobalVisitaModalOpen(true)}
        onOpenConfigSupabase={() => setSupabaseModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Header Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">CRM Comercial</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-bold text-slate-800 dark:text-white capitalize">
              {currentTab}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Supabase status badge */}
            <button
              onClick={() => setSupabaseModalOpen(true)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                isLiveSupabase
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isLiveSupabase ? 'Supabase Conectado' : 'Modo Demo Local'}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isLiveSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
            </button>

            {/* Nueva Visita button */}
            <button
              onClick={() => setGlobalVisitaModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Agendar Visita</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium">Cargando datos comerciales...</p>
            </div>
          ) : (
            <>
              {currentTab === 'calendario' && <CalendarioPage />}
              {currentTab === 'visitas' && <VisitasPage />}
              {currentTab === 'clientes' && <ClientesPage />}
              {currentTab === 'comerciales' && <ComercialesPage />}
            </>
          )}
        </div>
      </main>

      {/* Global Visita Modal */}
      <VisitaModal
        isOpen={globalVisitaModalOpen}
        onClose={() => setGlobalVisitaModalOpen(false)}
      />

      {/* Supabase Config & Status Modal */}
      <SupabaseConfigModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />

      {/* Notifications Toast */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
