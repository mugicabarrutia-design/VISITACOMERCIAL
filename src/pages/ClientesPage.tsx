import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Cliente, Visita } from '../types';
import { ClienteModal } from '../components/ClienteModal';
import { ClienteDetalleModal } from '../components/ClienteDetalleModal';
import { VisitaModal } from '../components/VisitaModal';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Search,
  Plus,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Edit,
  Trash2,
  Eye,
  FileText
} from 'lucide-react';

export const ClientesPage: React.FC = () => {
  const { clientesConDetalle, comerciales, visitas, eliminarCliente } = useData();

  const [busqueda, setBusqueda] = useState('');
  const [filtroComercial, setFiltroComercial] = useState('');
  const [filtroSector, setFiltroSector] = useState('');

  // Modales
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState<Cliente | null>(null);

  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [clienteParaDetalle, setClienteParaDetalle] = useState<Cliente | null>(null);

  const [visitaModalOpen, setVisitaModalOpen] = useState(false);
  const [clienteIdParaVisita, setClienteIdParaVisita] = useState<string | undefined>(undefined);
  const [visitaAEditar, setVisitaAEditar] = useState<Visita | null>(null);

  const [clienteAEliminar, setClienteAEliminar] = useState<Cliente | null>(null);

  // Lista de sectores únicos para el filtro
  const sectores = useMemo(() => {
    const set = new Set<string>();
    clientesConDetalle.forEach((c) => {
      if (c.sector) set.add(c.sector);
    });
    return Array.from(set).sort();
  }, [clientesConDetalle]);

  // Filtrado de clientes
  const clientesFiltrados = useMemo(() => {
    return clientesConDetalle.filter((c) => {
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const match =
          c.nombre_empresa.toLowerCase().includes(q) ||
          c.cif.toLowerCase().includes(q) ||
          c.persona_contacto.toLowerCase().includes(q) ||
          c.poblacion.toLowerCase().includes(q) ||
          c.provincia.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.sector.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (filtroComercial && c.comercial_asignado_id !== filtroComercial) {
        return false;
      }

      if (filtroSector && c.sector !== filtroSector) {
        return false;
      }

      return true;
    });
  }, [clientesConDetalle, busqueda, filtroComercial, filtroSector]);

  // Contar visitas por cliente
  const visitasPorCliente = useMemo(() => {
    const map = new Map<string, number>();
    visitas.forEach((v) => {
      map.set(v.cliente_id, (map.get(v.cliente_id) || 0) + 1);
    });
    return map;
  }, [visitas]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100/80 dark:bg-blue-950/60 text-blue-600 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Cartera de Clientes</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gestión de cuentas, historial de visitas y comerciales asignados
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setClienteAEditar(null);
            setClienteModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nuevo Cliente
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, CIF, contacto, sector o ciudad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <select
            value={filtroComercial}
            onChange={(e) => setFiltroComercial(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los comerciales asignados</option>
            {comerciales.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.apellidos}
              </option>
            ))}
          </select>

          <select
            value={filtroSector}
            onChange={(e) => setFiltroSector(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los sectores</option>
            {sectores.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>

          {(busqueda || filtroComercial || filtroSector) && (
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroComercial('');
                setFiltroSector('');
              }}
              className="text-xs text-rose-600 font-semibold hover:underline self-center"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Clientes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clientesFiltrados.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold">No se encontraron clientes.</p>
            <p className="text-xs mt-1">Prueba con otros términos de búsqueda o registra un nuevo cliente.</p>
          </div>
        ) : (
          clientesFiltrados.map((cliente) => {
            const numVisitas = visitasPorCliente.get(cliente.id) || 0;
            const comercial = cliente.comercial_asignado;

            return (
              <div
                key={cliente.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {cliente.nombre_empresa}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {cliente.cif}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 truncate max-w-[150px]">
                          {cliente.sector}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setClienteParaDetalle(cliente);
                        setDetalleModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors shrink-0"
                      title="Ver ficha completa"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium truncate">{cliente.persona_contacto}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`tel:${cliente.telefono}`} className="text-blue-600 hover:underline">
                        {cliente.telefono}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`mailto:${cliente.email}`} className="text-blue-600 hover:underline truncate">
                        {cliente.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {cliente.poblacion} ({cliente.provincia})
                      </span>
                    </div>
                  </div>

                  {/* Comercial Asignado */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-slate-400">Comercial:</span>
                    {comercial ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold text-white shadow-xs"
                        style={{ backgroundColor: comercial.color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        {comercial.nombre} {comercial.apellidos.split(' ')[0]}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Sin asignar</span>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setClienteParaDetalle(cliente);
                        setDetalleModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                      title="Ver historial de visitas"
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>{numVisitas} visitas</span>
                    </button>
                    <button
                      onClick={() => {
                        setClienteIdParaVisita(cliente.id);
                        setVisitaAEditar(null);
                        setVisitaModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition-colors"
                      title="Agendar nueva visita para este cliente"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Visita</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setClienteAEditar(cliente);
                        setClienteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Editar cliente"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setClienteAEliminar(cliente)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Eliminar cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Alta / Edición Cliente */}
      <ClienteModal
        isOpen={clienteModalOpen}
        onClose={() => setClienteModalOpen(false)}
        clienteParaEditar={clienteAEditar}
      />

      {/* Modal Ficha Detalle e Historial */}
      <ClienteDetalleModal
        isOpen={detalleModalOpen}
        onClose={() => setDetalleModalOpen(false)}
        cliente={clienteParaDetalle}
        onEditarCliente={(cli) => {
          setClienteAEditar(cli);
          setClienteModalOpen(true);
        }}
        onCrearVisitaParaCliente={(cliId) => {
          setClienteIdParaVisita(cliId);
          setVisitaAEditar(null);
          setVisitaModalOpen(true);
        }}
        onEditarVisita={(v) => {
          setVisitaAEditar(v);
          setVisitaModalOpen(true);
        }}
      />

      {/* Modal Visita para este cliente */}
      <VisitaModal
        isOpen={visitaModalOpen}
        onClose={() => setVisitaModalOpen(false)}
        visitaParaEditar={visitaAEditar}
        clienteIdDefault={clienteIdParaVisita}
      />

      {/* Confirmación Eliminar Cliente */}
      <ConfirmModal
        isOpen={Boolean(clienteAEliminar)}
        onClose={() => setClienteAEliminar(null)}
        onConfirm={async () => {
          if (clienteAEliminar) {
            await eliminarCliente(clienteAEliminar.id);
            setClienteAEliminar(null);
          }
        }}
        title="¿Eliminar cliente de la cartera?"
        message={`¿Estás seguro de que deseas eliminar a "${clienteAEliminar?.nombre_empresa}"? Esta acción borrará al cliente y su historial de visitas asociadas.`}
        confirmText="Sí, eliminar"
        cancelText="Conservar"
      />
    </div>
  );
};
