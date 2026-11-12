import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Comercial } from '../types';
import { ComercialModal } from '../components/ComercialModal';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Plus,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  Edit,
  Trash2,
  Clock,
  Sparkles
} from 'lucide-react';

export const ComercialesPage: React.FC = () => {
  const { comerciales, visitasConDetalle, clientes, eliminarComercial } = useData();

  const [modalOpen, setModalOpen] = useState(false);
  const [comercialAEditar, setComercialAEditar] = useState<Comercial | null>(null);
  const [comercialAEliminar, setComercialAEliminar] = useState<Comercial | null>(null);

  // Fecha actual para calcular el mes en curso
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Métricas por comercial para el mes actual
  const statsPorComercial = useMemo(() => {
    const stats = new Map<
      string,
      {
        totalMes: number;
        realizadasMes: number;
        programadasMes: number;
        importeEstimadoMes: number;
        clientesAsignados: number;
      }
    >();

    // Inicializar para todos los comerciales
    comerciales.forEach((c) => {
      const clientesCount = clientes.filter((cli) => cli.comercial_asignado_id === c.id).length;
      stats.set(c.id, {
        totalMes: 0,
        realizadasMes: 0,
        programadasMes: 0,
        importeEstimadoMes: 0,
        clientesAsignados: clientesCount,
      });
    });

    // Acumular visitas del mes
    visitasConDetalle.forEach((v) => {
      const d = new Date(v.fecha_inicio);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const item = stats.get(v.comercial_id);
        if (item) {
          item.totalMes += 1;
          if (v.estado === 'realizada') item.realizadasMes += 1;
          if (v.estado === 'programada') item.programadasMes += 1;
          item.importeEstimadoMes += v.importe_estimado || 0;
        }
      }
    });

    return stats;
  }, [comerciales, visitasConDetalle, clientes, currentYear, currentMonth]);

  const nombreMesActual = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100/80 dark:bg-blue-950/60 text-blue-600 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Equipo Comercial</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              Rendimiento y resumen de visitas para {nombreMesActual}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setComercialAEditar(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nuevo Comercial
        </button>
      </div>

      {/* Cards de Comerciales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {comerciales.map((comercial) => {
          const stats = statsPorComercial.get(comercial.id) || {
            totalMes: 0,
            realizadasMes: 0,
            programadasMes: 0,
            importeEstimadoMes: 0,
            clientesAsignados: 0,
          };

          const tasaExito = stats.totalMes > 0 ? Math.round((stats.realizadasMes / stats.totalMes) * 100) : 0;

          return (
            <div
              key={comercial.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Card Color Top Accent */}
              <div className="h-2 w-full" style={{ backgroundColor: comercial.color }} />

              <div className="p-5 flex-1">
                {/* Header Comercial */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-md shadow-black/10"
                      style={{ backgroundColor: comercial.color }}
                    >
                      {comercial.nombre[0]}
                      {comercial.apellidos[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                        {comercial.nombre} {comercial.apellidos}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {comercial.zona}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            comercial.activo
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {comercial.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setComercialAEditar(comercial);
                        setModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Editar comercial"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setComercialAEliminar(comercial)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Eliminar comercial"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact Data */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`tel:${comercial.telefono}`} className="text-blue-600 hover:underline">
                      {comercial.telefono}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`mailto:${comercial.email}`} className="text-blue-600 hover:underline truncate">
                      {comercial.email}
                    </a>
                  </div>
                </div>

                {/* Monthly Activity Summary */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                      Resumen del Mes ({nombreMesActual})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-500" />
                        Visitas este mes
                      </span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                        {stats.totalMes}
                      </p>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="text-emerald-600">{stats.realizadasMes} hechas</span>
                        <span>•</span>
                        <span className="text-blue-600">{stats.programadasMes} pendientes</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Importe estimado
                      </span>
                      <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mt-0.5 truncate">
                        {stats.importeEstimadoMes.toLocaleString('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <div className="text-[10px] text-emerald-600/80 mt-0.5">
                        {stats.clientesAsignados} cuentas asignadas
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>Progreso de visitas realizadas</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{tasaExito}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${tasaExito}%`,
                          backgroundColor: comercial.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom footer */}
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: comercial.color }} />
                  Color calendario
                </span>
                <span className="font-mono text-[11px] uppercase">{comercial.color}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Alta / Edición Comercial */}
      <ComercialModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        comercialParaEditar={comercialAEditar}
      />

      {/* Confirmación Eliminar Comercial */}
      <ConfirmModal
        isOpen={Boolean(comercialAEliminar)}
        onClose={() => setComercialAEliminar(null)}
        onConfirm={async () => {
          if (comercialAEliminar) {
            await eliminarComercial(comercialAEliminar.id);
            setComercialAEliminar(null);
          }
        }}
        title="¿Eliminar comercial del equipo?"
        message={`¿Estás seguro de que deseas eliminar a "${comercialAEliminar?.nombre} ${comercialAEliminar?.apellidos}"? Sus visitas y citas asociadas también se borrarán.`}
        confirmText="Sí, eliminar"
        cancelText="Conservar"
      />
    </div>
  );
};
