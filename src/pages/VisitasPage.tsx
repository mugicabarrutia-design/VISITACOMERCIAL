import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Visita, EstadoVisita } from '../types';
import { VisitaModal } from '../components/VisitaModal';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Search,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Briefcase,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw
} from 'lucide-react';

type SortField = 'fecha_inicio' | 'cliente' | 'comercial' | 'tipo' | 'estado' | 'importe_estimado';
type SortOrder = 'asc' | 'desc';

const ESTADO_CONFIG: Record<EstadoVisita, { label: string; badge: string; icon: React.ReactNode }> = {
  programada: {
    label: 'Programada',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: <Clock className="w-3 h-3 text-blue-500" />,
  },
  realizada: {
    label: 'Realizada',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: <CheckCircle className="w-3 h-3 text-emerald-500" />,
  },
  aplazada: {
    label: 'Aplazada',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: <RotateCcw className="w-3 h-3 text-amber-500" />,
  },
  cancelada: {
    label: 'Cancelada',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    icon: <XCircle className="w-3 h-3 text-rose-500" />,
  },
};

export const VisitasPage: React.FC = () => {
  const { visitasConDetalle, clientes, comerciales, eliminarVisita } = useData();

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroComercial, setFiltroComercial] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  // Ordenación
  const [sortField, setSortField] = useState<SortField>('fecha_inicio');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [visitaAEditar, setVisitaAEditar] = useState<Visita | null>(null);
  const [visitaAEliminar, setVisitaAEliminar] = useState<Visita | null>(null);

  // Filtrado y búsqueda
  const visitasFiltradas = useMemo(() => {
    return visitasConDetalle.filter((v) => {
      // Búsqueda textual
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase();
        const clienteNom = (v.cliente?.nombre_empresa || '').toLowerCase();
        const contactoNom = (v.cliente?.persona_contacto || '').toLowerCase();
        const comercialNom = `${v.comercial?.nombre || ''} ${v.comercial?.apellidos || ''}`.toLowerCase();
        const objetivo = (v.objetivo || '').toLowerCase();
        const tipo = (v.tipo || '').toLowerCase();

        const match =
          clienteNom.includes(query) ||
          contactoNom.includes(query) ||
          comercialNom.includes(query) ||
          objetivo.includes(query) ||
          tipo.includes(query);

        if (!match) return false;
      }

      // Filtro Comercial
      if (filtroComercial && v.comercial_id !== filtroComercial) return false;

      // Filtro Cliente
      if (filtroCliente && v.cliente_id !== filtroCliente) return false;

      // Filtro Estado
      if (filtroEstado && v.estado !== filtroEstado) return false;

      // Filtro Rango de Fechas
      if (filtroFechaDesde) {
        const dVisita = new Date(v.fecha_inicio).toISOString().slice(0, 10);
        if (dVisita < filtroFechaDesde) return false;
      }
      if (filtroFechaHasta) {
        const dVisita = new Date(v.fecha_inicio).toISOString().slice(0, 10);
        if (dVisita > filtroFechaHasta) return false;
      }

      return true;
    });
  }, [visitasConDetalle, busqueda, filtroComercial, filtroCliente, filtroEstado, filtroFechaDesde, filtroFechaHasta]);

  // Ordenación
  const visitasOrdenadas = useMemo(() => {
    return [...visitasFiltradas].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortField) {
        case 'fecha_inicio':
          valA = new Date(a.fecha_inicio).getTime();
          valB = new Date(b.fecha_inicio).getTime();
          break;
        case 'cliente':
          valA = (a.cliente?.nombre_empresa || '').toLowerCase();
          valB = (b.cliente?.nombre_empresa || '').toLowerCase();
          break;
        case 'comercial':
          valA = (a.comercial?.nombre || '').toLowerCase();
          valB = (b.comercial?.nombre || '').toLowerCase();
          break;
        case 'tipo':
          valA = a.tipo.toLowerCase();
          valB = b.tipo.toLowerCase();
          break;
        case 'estado':
          valA = a.estado.toLowerCase();
          valB = b.estado.toLowerCase();
          break;
        case 'importe_estimado':
          valA = a.importe_estimado || 0;
          valB = b.importe_estimado || 0;
          break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [visitasFiltradas, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroComercial('');
    setFiltroCliente('');
    setFiltroEstado('');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
  };

  const hayFiltrosActivos = Boolean(
    busqueda || filtroComercial || filtroCliente || filtroEstado || filtroFechaDesde || filtroFechaHasta
  );

  // Totales
  const totalImporte = visitasFiltradas.reduce((acc, v) => acc + (v.importe_estimado || 0), 0);
  const realizadas = visitasFiltradas.filter((v) => v.estado === 'realizada').length;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Registro de Visitas</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Listado completo con búsqueda, filtros cruzados, ordenación y acciones
          </p>
        </div>
        <button
          onClick={() => {
            setVisitaAEditar(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nueva Visita
        </button>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Visitas Totales</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{visitasFiltradas.length}</p>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Realizadas</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{realizadas}</p>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Volumen Estimado</span>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {totalImporte.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Efectividad</span>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
            {visitasFiltradas.length > 0 ? Math.round((realizadas / visitasFiltradas.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, contacto, comercial u objetivo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Comercial */}
          <div>
            <select
              value={filtroComercial}
              onChange={(e) => setFiltroComercial(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los comerciales</option>
              {comerciales.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellidos}
                </option>
              ))}
            </select>
          </div>

          {/* Cliente */}
          <div>
            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los clientes</option>
              {clientes.map((cli) => (
                <option key={cli.id} value={cli.id}>
                  {cli.nombre_empresa}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
            >
              <option value="">Todos los estados</option>
              <option value="programada">Programada</option>
              <option value="realizada">Realizada</option>
              <option value="aplazada">Aplazada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              title="Fecha desde"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              title="Fecha hasta"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0 transition-colors"
                title="Limpiar filtros"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                <th
                  onClick={() => toggleSort('fecha_inicio')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>Fecha y Horario</span>
                    {sortField === 'fecha_inicio' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('cliente')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Cliente / Contacto</span>
                    {sortField === 'cliente' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('comercial')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Comercial</span>
                    {sortField === 'comercial' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('tipo')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tipo</span>
                    {sortField === 'tipo' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('estado')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Estado</span>
                    {sortField === 'estado' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('importe_estimado')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Importe</span>
                    {sortField === 'importe_estimado' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {visitasOrdenadas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="text-sm">No se encontraron visitas que coincidan con los filtros.</p>
                    {hayFiltrosActivos && (
                      <button
                        onClick={limpiarFiltros}
                        className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Restablecer filtros
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                visitasOrdenadas.map((visita) => {
                  const inicio = new Date(visita.fecha_inicio);
                  const fin = new Date(visita.fecha_fin);
                  const fechaStr = inicio.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const horaStr = `${inicio.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} - ${fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

                  const estadoMeta = ESTADO_CONFIG[visita.estado] || ESTADO_CONFIG.programada;

                  return (
                    <tr
                      key={visita.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Fecha y Horario */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white text-xs">
                          {fechaStr}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {horaStr}
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {visita.cliente?.nombre_empresa || 'Cliente sin asignar'}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {visita.cliente?.persona_contacto} • {visita.cliente?.poblacion}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 italic mt-0.5">
                          Obj: {visita.objetivo}
                        </div>
                      </td>

                      {/* Comercial */}
                      <td className="py-3 px-4">
                        {visita.comercial ? (
                          <div className="inline-flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: visita.comercial.color }}
                            />
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                              {visita.comercial.nombre} {visita.comercial.apellidos.split(' ')[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No asignado</span>
                        )}
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          {visita.tipo}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${estadoMeta.badge}`}
                        >
                          {estadoMeta.icon}
                          {estadoMeta.label}
                        </span>
                      </td>

                      {/* Importe */}
                      <td className="py-3 px-4 text-right">
                        {visita.importe_estimado && visita.importe_estimado > 0 ? (
                          <span className="font-mono font-semibold text-xs text-slate-900 dark:text-white">
                            {visita.importe_estimado.toLocaleString('es-ES')} €
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setVisitaAEditar(visita);
                              setModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                            title="Editar visita"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setVisitaAEliminar(visita)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Eliminar visita"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Visita (Crear / Editar) */}
      <VisitaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        visitaParaEditar={visitaAEditar}
      />

      {/* Confirmación para eliminar */}
      <ConfirmModal
        isOpen={Boolean(visitaAEliminar)}
        onClose={() => setVisitaAEliminar(null)}
        onConfirm={async () => {
          if (visitaAEliminar) {
            await eliminarVisita(visitaAEliminar.id);
            setVisitaAEliminar(null);
          }
        }}
        title="¿Eliminar esta visita comercial?"
        message={`¿Estás seguro de que deseas eliminar la visita a "${visitaAEliminar?.cliente?.nombre_empresa || 'Cliente'}"?`}
        confirmText="Sí, eliminar"
        cancelText="Conservar"
      />
    </div>
  );
};
