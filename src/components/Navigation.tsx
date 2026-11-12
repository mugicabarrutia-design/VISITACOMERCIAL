import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Calendar, CheckSquare, Users, Briefcase, Plus, Database, Menu, X, Sparkles } from 'lucide-react';

export type TabKey = 'calendario' | 'visitas' | 'clientes' | 'comerciales';

interface NavigationProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  onOpenNuevaVisita: () => void;
  onOpenConfigSupabase: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenNuevaVisita,
  onOpenConfigSupabase,
}) => {
  const { isLiveSupabase, visitas, clientes, comerciales } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      key: 'calendario' as TabKey,
      label: 'Calendario',
      icon: Calendar,
      badge: visitas.length,
    },
    {
      key: 'visitas' as TabKey,
      label: 'Visitas',
      icon: CheckSquare,
      badge: visitas.length,
    },
    {
      key: 'clientes' as TabKey,
      label: 'Clientes',
      icon: Users,
      badge: clientes.length,
    },
    {
      key: 'comerciales' as TabKey,
      label: 'Comerciales',
      icon: Briefcase,
      badge: comerciales.length,
    },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight">CRM Visitas</span>
            <span className="block text-[10px] text-slate-400">Fuerza de Ventas</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNuevaVisita}
            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs flex flex-col pt-16 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-2xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onSelectTab(item.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-blue-800/80 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  onOpenConfigSupabase();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-800/80 text-slate-300 hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Estado Supabase</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  isLiveSupabase ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {isLiveSupabase ? 'Conectado' : 'Demo Local'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex-col shrink-0 select-none">
        {/* Brand */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight leading-none">CRM Visitas</h1>
            <span className="text-[11px] text-slate-400 tracking-wide font-medium">Gestión Comercial</span>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="p-4">
          <button
            onClick={onOpenNuevaVisita}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold text-sm shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nueva Visita
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-blue-700/90 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Supabase Status Footer Card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <div
            onClick={onOpenConfigSupabase}
            className="p-3 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-700 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Database className={`w-4 h-4 ${isLiveSupabase ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className="text-xs font-bold text-white">Supabase</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${isLiveSupabase ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">
              {isLiveSupabase ? 'Conexión activa y sincronizada' : 'Modo Demo (Click para configurar)'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
