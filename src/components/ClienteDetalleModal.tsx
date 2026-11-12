import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { Cliente, Visita } from '../types';
import { formatEuro } from '../lib/parsers';
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Plus,
  Calendar,
  Clock,
  DollarSign,
  Edit3,
  ArrowRight,
  ShoppingCart,
  Truck,
  Package
} from 'lucide-react';

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
  const { visitasConDetalle, ventasConDetalle } = useData();
  const [activeTab, setActiveTab] = useState<'visitas' | 'ventas'>('visitas');

  const historialVisitas = useMemo(() => {
    if (!cliente) return [];
    return visitasConDetalle
      .filter((v) => v.cliente_id === cliente.codigo || v.cliente_id === cliente.id)
      .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());
  }, [cliente, visitasConDetalle]);

  const historialVentas = useMemo(() => {
    if (!cliente) return [];
    const cod = (cliente.codigo || cliente.id || '').toLowerCase();
    return ventasConDetalle
      .filter((v) => v.id_cliente.toLowerCase() === cod)
      .sort((a, b) => b.n_pedido - a.n_pedido);
  }, [cliente, ventasConDetalle]);

  if (!isOpen || !cliente) return null;

  const totalEstimadoVisitas = historialVisitas.reduce((acc, v) => acc + (v.importe_estimado || 0), 0);
  const totalFacturadoVentas = historialVentas.reduce((acc, v) => acc + (v.importe || 0), 0);
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
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {cliente.codigo}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <span>{cliente.cargo || 'Cliente'}</span>
                <span>•</span>
                <span>{cliente.ciudad || cliente.poblacion}, {cliente.pais}</span>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Visitas Comerciales</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {historialVisitas.length} <span className="text-xs font-normal text-emerald-600 font-sans">({visitasRealizadas} hechas)</span>
              </p>
            </div>
            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Total Compras Facturadas</span>
              <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-0.5 truncate">
                {formatEuro(totalFacturadoVentas)}
              </p>
            </div>
            <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-800/40">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Líneas de Pedidos</span>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-300 mt-0.5">
                {historialVentas.length} pedidos
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Briefcase className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-xs text-slate-500">Contacto:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{cliente.persona_contacto}</span>
                {cliente.cargo && <span className="text-xs text-slate-400">({cliente.cargo})</span>}
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-xs text-slate-500">Teléfono:</span>
                <a href={`tel:${cliente.telefono}`} className="text-blue-600 hover:underline">{cliente.telefono}</a>
              </div>
              {cliente.email && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-xs text-slate-500">Email:</span>
                  <a href={`mailto:${cliente.email}`} className="text-blue-600 hover:underline truncate">{cliente.email}</a>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-slate-900 dark:text-white">{cliente.direccion || 'Dirección sin especificar'}</p>
                  <p className="text-slate-500">{cliente.codigo_postal} {cliente.ciudad} ({cliente.pais})</p>
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
          </div>

          {/* Tabs Selector: Visitas vs Ventas */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pt-2">
            <button
              onClick={() => setActiveTab('visitas')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'visitas'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Visitas Comerciales ({historialVisitas.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ventas')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'ventas'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Historial de Ventas / Pedidos ({historialVentas.length})</span>
            </button>
          </div>

          {/* TAB 1: VISITAS */}
          {activeTab === 'visitas' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Registro cronológico de visitas</span>
                <button
                  onClick={() => {
                    onCrearVisitaParaCliente(cliente.codigo || cliente.id);
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
                  <p className="text-sm">No hay visitas comerciales registradas para {cliente.nombre_empresa}.</p>
                  <button
                    onClick={() => {
                      onCrearVisitaParaCliente(cliente.codigo || cliente.id);
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
                        className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 bg-white dark:bg-slate-800/60 hover:bg-slate-50/80 transition-all cursor-pointer shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${ESTADO_BADGES[visita.estado] || 'bg-slate-100'}`}>
                              {visita.estado.toUpperCase()}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                              {visita.tipo}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
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

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          {visita.comercial && (
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
                              style={{ backgroundColor: visita.comercial.color }}
                              title={`${visita.comercial.nombre} ${visita.comercial.apellidos}`}
                            >
                              {visita.comercial.nombre[0]}
                            </div>
                          )}
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VENTAS */}
          {activeTab === 'ventas' && (
            <div className="space-y-3">
              {historialVentas.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500">
                  <ShoppingCart className="w-8 h-8 mx-auto text-slate-400 mb-1" />
                  <p className="text-sm">No constan pedidos registrados para este cliente ({cliente.codigo}).</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Nº Pedido</th>
                        <th className="py-2.5 px-3">Artículo / Ref</th>
                        <th className="py-2.5 px-3 text-center">Cant.</th>
                        <th className="py-2.5 px-3">Vendedor</th>
                        <th className="py-2.5 px-3">Envío</th>
                        <th className="py-2.5 px-3 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {historialVentas.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono">{v.fecha}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600">#{v.n_pedido}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {v.articulo?.producto || `Ref. ${v.referencia_articulo}`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">{v.cantidad}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{v.vendedor}</td>
                          <td className="py-2.5 px-3 text-slate-500">{v.cia_envio}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatEuro(v.importe)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
