import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Cliente, Visita } from '../types';
import { X, Building2, Phone, Mail, MapPin, Briefcase, Plus, Calendar, Clock, DollarSign, Edit3, ArrowRight } from 'lucide-react';

interface ClienteDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  onEditarCliente: (cliente: Cliente) => void;
  onCrearVisitaParaCliente: (clienteId: string) => void;
  onEditarVisita: (visita: Visita) => void;
}

const ESTADO_BADGES: Record<string, string> = {
  programada: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  realizada: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  aplazada: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  cancelada: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
};

export const ClienteDetalleModal: React.FC<ClienteDetalleModalProps> = ({
  isOpen,
  onClose,
  cliente,
  onEditarCliente,
  onCrearVisitaParaCliente,
  onEditarVisita,
}) => {
  const { visitasConDetalle } = useData();

  const historialVisitas = useMemo(() => {
    if (!cliente) return [];
    return visitasConDetalle
      .filter((v) => v.cliente_id === cliente.id)
      .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());
  }, [cliente, visitasConDetalle]);

  if (!isOpen || !cliente) return null;

  const totalImporte = historialVisitas.reduce((acc, v) => acc + (v.importe_estimado || 0), 0);
  const visitasRealizadas = historialVisitas.filter((v) => v.estado === 'realizada').length;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between shrink-0">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100/70 dark:bg-blue-950/50 text-blue-600 rounded-2xl">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {cliente.nombre_empresa}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {cliente.cif}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <span>{cliente.sector}</span>
                <span>•</span>
                <span>{cliente.poblacion}, {cliente.provincia}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onEditarCliente(cliente);
                onClose();
              }}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Editar ficha del cliente"
            >
              <Edit3 className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Visitas</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{historialVisitas.length}</p>
            </div>
            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Realizadas</span>
              <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">{visitasRealizadas}</p>
            </div>
            <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-800/40">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Negocio Estimado</span>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-300 mt-0.5">
                {totalImporte.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Briefcase className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-xs text-slate-500">Contacto:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{cliente.persona_contacto}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-xs text-slate-500">Teléfono:</span>
                <a href={`tel:${cliente.telefono}`} className="text-blue-600 hover:underline">{cliente.telefono}</a>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-xs text-slate-500">Email:</span>
                <a href={`mailto:${cliente.email}`} className="text-blue-600 hover:underline truncate">{cliente.email}</a>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-slate-900 dark:text-white">{cliente.direccion}</p>
                  <p className="text-slate-500">{cliente.codigo_postal} {cliente.poblacion} ({cliente.provincia})</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 pt-1">
                <span className="text-xs text-slate-500">Comercial asignado:</span>
                {cliente.comercial_asignado ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-white shadow-xs" style={{ backgroundColor: cliente.comercial_asignado.color }}>
                    {cliente.comercial_asignado.nombre} {cliente.comercial_asignado.apellidos}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">Sin comercial asignado</span>
                )}
              </div>
            </div>

            {cliente.notas && (
              <div className="md:col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Notas: </span>
                {cliente.notas}
              </div>
            )}
          </div>

          {/* Historial de Visitas */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Historial de Visitas ({historialVisitas.length})
              </h3>
              <button
                onClick={() => {
                  onCrearVisitaParaCliente(cliente.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Programar Visita
              </button>
            </div>

            {historialVisitas.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500">
                <p className="text-sm">No hay visitas registradas para este cliente.</p>
                <button
                  onClick={() => {
                    onCrearVisitaParaCliente(cliente.id);
                    onClose();
                  }}
                  className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Agendar la primera visita ahora
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {historialVisitas.map((visita) => {
                  const inicio = new Date(visita.fecha_inicio);
                  const fin = new Date(visita.fecha_fin);
                  const fechaStr = inicio.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                  const horaStr = `${inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

                  return (
                    <div
                      key={visita.id}
                      onClick={() => {
                        onEditarVisita(visita);
                        onClose();
                      }}
                      className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${ESTADO_BADGES[visita.estado] || 'bg-slate-100 text-slate-800'}`}>
                            {visita.estado.toUpperCase()}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                            {visita.tipo}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {fechaStr} ({horaStr})
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {visita.objetivo}
                        </p>
                        {visita.resultado && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                            Resultado: {visita.resultado}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/60">
                        {visita.importe_estimado && visita.importe_estimado > 0 ? (
                          <div className="text-right">
                            <span className="text-xs text-slate-400 block">Estimado</span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                              <DollarSign className="w-3 h-3" />
                              {visita.importe_estimado.toLocaleString('es-ES')} €
                            </span>
                          </div>
                        ) : null}

                        {visita.comercial && (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
                            style={{ backgroundColor: visita.comercial.color }}
                            title={`${visita.comercial.nombre} ${visita.comercial.apellidos}`}
                          >
                            {visita.comercial.nombre[0]}
                          </div>
                        )}

                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
