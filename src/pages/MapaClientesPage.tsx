import React, { useState, useMemo, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useData } from '../context/DataContext';
import { Cliente, Visita, Venta } from '../types';
import { getClienteCoords, LatLng } from '../lib/geoCoords';
import { formatEuro } from '../lib/parsers';
import { ClienteDetalleModal } from '../components/ClienteDetalleModal';
import { ClienteModal } from '../components/ClienteModal';
import { VisitaModal } from '../components/VisitaModal';
import {
  MapPin,
  Search,
  Building2,
  Phone,
  Mail,
  ShoppingCart,
  Calendar,
  Eye,
  Plus,
  ArrowRight,
  TrendingUp,
  Package,
  X,
  UserCheck,
  Globe,
  DollarSign
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Controller to smoothly animate map pan/zoom when a client is selected
const MapCameraController: React.FC<{ coords: LatLng | null }> = ({ coords }) => {
  const map = useMap();
  React.useEffect(() => {
    if (map && coords) {
      map.panTo(coords);
      map.setZoom(7);
    }
  }, [map, coords]);
  return null;
};

export const MapaClientesPage: React.FC = () => {
  const { clientesConDetalle, comerciales, ventasConDetalle, visitas } = useData();

  const [busqueda, setBusqueda] = useState('');
  const [filtroComercial, setFiltroComercial] = useState('');
  const [filtroPais, setFiltroPais] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);

  // Modales adicionales
  const [clienteAEditar, setClienteAEditar] = useState<Cliente | null>(null);
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [clienteParaDetalle, setClienteParaDetalle] = useState<Cliente | null>(null);

  const [visitaModalOpen, setVisitaModalOpen] = useState(false);
  const [clienteIdParaVisita, setClienteIdParaVisita] = useState<string | undefined>(undefined);
  const [visitaAEditar, setVisitaAEditar] = useState<Visita | null>(null);

  // Mapear clientes con sus coordenadas calculadas
  const clientesConCoords = useMemo(() => {
    return clientesConDetalle.map((c) => {
      const coords = getClienteCoords(c);
      return {
        ...c,
        coords,
      };
    });
  }, [clientesConDetalle]);

  // Agrupar ventas por id_cliente/codigo usando un objeto Record para evitar shadowing del tipo Map
  const ventasMapByCliente = useMemo(() => {
    const dict: Record<string, Venta[]> = {};
    ventasConDetalle.forEach((v: Venta) => {
      const key = (v.id_cliente || '').toLowerCase().trim();
      if (!dict[key]) dict[key] = [];
      dict[key].push(v);
    });
    return dict;
  }, [ventasConDetalle]);

  // Lista única de países para el selector de filtro
  const paisesUnicos = useMemo(() => {
    const set = new Set<string>();
    clientesConDetalle.forEach((c) => {
      const p = c.pais || c.País;
      if (p) set.add(p);
    });
    return Array.from(set).sort();
  }, [clientesConDetalle]);

  // Clientes filtrados
  const clientesFiltrados = useMemo(() => {
    return clientesConCoords.filter((c) => {
      const codKey = (c.codigo || c.id || '').toLowerCase();
      const ventasDelCliente = ventasMapByCliente[codKey] || [];

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const matchInfo =
          c.nombre_empresa.toLowerCase().includes(q) ||
          (c.codigo && c.codigo.toLowerCase().includes(q)) ||
          (c.persona_contacto && c.persona_contacto.toLowerCase().includes(q)) ||
          (c.ciudad && c.ciudad.toLowerCase().includes(q)) ||
          (c.poblacion && c.poblacion.toLowerCase().includes(q)) ||
          (c.pais && c.pais.toLowerCase().includes(q));

        const matchProducto = ventasDelCliente.some(
          (v: Venta) =>
            v.articulo?.producto?.toLowerCase().includes(q) ||
            v.vendedor?.toLowerCase().includes(q) ||
            v.n_pedido?.toString().includes(q)
        );

        if (!matchInfo && !matchProducto) return false;
      }

      if (filtroComercial && c.comercial_asignado_id !== filtroComercial) {
        return false;
      }

      if (filtroPais) {
        const p = (c.pais || c.País || '').toLowerCase();
        if (p !== filtroPais.toLowerCase()) return false;
      }

      return true;
    });
  }, [clientesConCoords, busqueda, filtroComercial, filtroPais, ventasMapByCliente]);

  // Cliente seleccionado en el mapa
  const clienteSeleccionado = useMemo(() => {
    if (!selectedClienteId) return null;
    return clientesConCoords.find((c) => c.codigo === selectedClienteId || c.id === selectedClienteId) || null;
  }, [selectedClienteId, clientesConCoords]);

  // Ventas del cliente seleccionado
  const ventasDelSeleccionado = useMemo(() => {
    if (!clienteSeleccionado) return [];
    const key = (clienteSeleccionado.codigo || clienteSeleccionado.id || '').toLowerCase();
    return ventasMapByCliente[key] || [];
  }, [clienteSeleccionado, ventasMapByCliente]);

  // Métricas totales acumuladas
  const metricasMapa = useMemo(() => {
    let totalFacturacion = 0;
    let totalPedidos = 0;
    clientesFiltrados.forEach((c) => {
      const key = (c.codigo || c.id || '').toLowerCase();
      const list = ventasMapByCliente[key] || [];
      totalPedidos += list.length;
      list.forEach((v: Venta) => {
        totalFacturacion += v.importe || 0;
      });
    });
    return {
      numClientes: clientesFiltrados.length,
      totalPedidos,
      totalFacturacion,
    };
  }, [clientesFiltrados, ventasMapByCliente]);

  // Seleccionar cliente y centrar mapa
  const handleSelectCliente = useCallback((c: typeof clientesConCoords[0]) => {
    setSelectedClienteId(c.codigo || c.id);
  }, []);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100/80 dark:bg-blue-950/60 text-blue-600 rounded-xl">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mapa Interactivo de Clientes</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Localización geográfica, ventas asociadas, costes e historial de compras por cliente
            </p>
          </div>
        </div>

        {/* Resumen KPI Rápido */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-center shrink-0">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Clientes</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">{metricasMapa.numClientes}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-center shrink-0">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Pedidos</span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{metricasMapa.totalPedidos}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-center shrink-0">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Facturación</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {formatEuro(metricasMapa.totalFacturacion)}
            </span>
          </div>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, ciudad, país, producto comprado o vendedor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <select
            value={filtroPais}
            onChange={(e) => setFiltroPais(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los países ({paisesUnicos.length})</option>
            {paisesUnicos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

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

          {(busqueda || filtroPais || filtroComercial) && (
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroPais('');
                setFiltroComercial('');
              }}
              className="text-xs text-rose-600 font-semibold hover:underline self-center cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Mapa interactivo + Panel Lateral de Cliente/Ventas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Contenedor del Mapa (Google Maps Platform) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm overflow-hidden flex flex-col min-h-[550px]">
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <div className="w-full h-[580px] rounded-xl overflow-hidden relative">
              <Map
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                defaultCenter={{ lat: 48.0, lng: 9.0 }}
                defaultZoom={4}
                gestureHandling="greedy"
                className="w-full h-full"
              >
                <MapCameraController coords={clienteSeleccionado ? clienteSeleccionado.coords : null} />

                {clientesFiltrados.map((cli) => {
                  const isSelected = selectedClienteId === cli.codigo || selectedClienteId === cli.id;
                  const color = cli.comercial_asignado?.color || (isSelected ? '#2563EB' : '#475569');

                  return (
                    <React.Fragment key={cli.codigo || cli.id}>
                      <AdvancedMarker
                        position={cli.coords}
                        title={`${cli.nombre_empresa} (${cli.codigo})`}
                        onClick={() => handleSelectCliente(cli)}
                      >
                        <div className={`group relative cursor-pointer transition-all transform hover:scale-110 ${isSelected ? 'scale-125 z-30' : 'z-10'}`}>
                          <Pin
                            background={color}
                            borderColor="#ffffff"
                            glyphColor="#ffffff"
                          />
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-900/90 text-white font-mono text-[10px] font-bold whitespace-nowrap shadow-md opacity-90 group-hover:opacity-100">
                            {cli.codigo}
                          </span>
                        </div>
                      </AdvancedMarker>

                      {isSelected && (
                        <InfoWindow
                          position={cli.coords}
                          onCloseClick={() => setSelectedClienteId(null)}
                        >
                          <div className="p-1 max-w-xs text-slate-900 dark:text-slate-100">
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-[10px]">
                              {cli.codigo}
                            </span>
                            <h4 className="font-bold text-sm mt-1">{cli.nombre_empresa}</h4>
                            <p className="text-xs text-slate-500">{cli.ciudad || cli.poblacion}, {cli.pais}</p>
                            <p className="text-xs text-slate-600 font-medium mt-1">
                              Contacto: {cli.persona_contacto}
                            </p>
                          </div>
                        </InfoWindow>
                      )}
                    </React.Fragment>
                  );
                })}
              </Map>
            </div>
          </APIProvider>
        </div>

        {/* Panel Lateral: Detalle de Compras del Cliente Seleccionado */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
          {clienteSeleccionado ? (
            <div className="space-y-4">
              {/* Header cliente seleccionado */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {clienteSeleccionado.codigo}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {clienteSeleccionado.ciudad || clienteSeleccionado.poblacion}, {clienteSeleccionado.pais}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                    {clienteSeleccionado.nombre_empresa}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedClienteId(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Datos de contacto */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-700 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="font-semibold">{clienteSeleccionado.persona_contacto}</span>
                  {clienteSeleccionado.cargo && <span className="text-slate-400">({clienteSeleccionado.cargo})</span>}
                </div>
                {clienteSeleccionado.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <a href={`tel:${clienteSeleccionado.telefono}`} className="text-blue-600 hover:underline">
                      {clienteSeleccionado.telefono}
                    </a>
                  </div>
                )}
                {clienteSeleccionado.direccion && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{clienteSeleccionado.direccion}</span>
                  </div>
                )}
              </div>

              {/* Resumen de Compras del Cliente */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-emerald-500" />
                    Detalle de Compras y Costes
                  </h4>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatEuro(ventasDelSeleccionado.reduce((acc: number, v: Venta) => acc + (v.importe || 0), 0))}
                  </span>
                </div>

                {ventasDelSeleccionado.length === 0 ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                    No constan pedidos registrados para este cliente en la tabla ventas.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {ventasDelSeleccionado.map((venta: Venta) => {
                      const prod = venta.articulo;
                      const costeUnitario = prod ? prod.precio_coste : 0;
                      const costeTotal = costeUnitario * venta.cantidad;
                      const beneficio = (venta.importe || 0) - costeTotal;

                      return (
                        <div
                          key={venta.id}
                          className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {prod ? prod.producto : `Artículo Ref. ${venta.referencia_articulo}`}
                              </span>
                              <div className="text-[10px] text-slate-400">
                                Pedido #{venta.n_pedido} • {venta.fecha}
                              </div>
                            </div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                              {formatEuro(venta.importe)}
                            </span>
                          </div>

                          {/* Fila de Unidades, PVP y Coste */}
                          <div className="grid grid-cols-3 gap-1 bg-white dark:bg-slate-900 p-2 rounded-lg text-[11px] border border-slate-100 dark:border-slate-800">
                            <div>
                              <span className="block text-[9px] text-slate-400 uppercase">Cantidad</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {venta.cantidad} unidades
                              </span>
                            </div>
                            <div>
                              <span className="block text-[9px] text-slate-400 uppercase">PVP Unitario</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {formatEuro(venta.pvp)}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[9px] text-slate-400 uppercase">Coste Unitario</span>
                              <span className="font-semibold text-slate-600 dark:text-slate-400">
                                {costeUnitario > 0 ? formatEuro(costeUnitario) : 'N/D'}
                              </span>
                            </div>
                          </div>

                          {/* Fila de Margen y Transporte */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                            <span>Vendedor: {venta.vendedor}</span>
                            {beneficio > 0 && (
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                Margen estimado: +{formatEuro(beneficio)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Botones de acción rápida */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setClienteParaDetalle(clienteSeleccionado);
                    setDetalleModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  Ver Ficha
                </button>

                <button
                  onClick={() => {
                    setClienteIdParaVisita(clienteSeleccionado.codigo || clienteSeleccionado.id);
                    setVisitaAEditar(null);
                    setVisitaModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agendar Visita
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full py-20 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-full text-blue-600 dark:text-blue-400">
                <MapPin className="w-8 h-8" />
              </div>
              <div className="max-w-xs">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Selecciona un cliente en el mapa</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Haz clic en cualquiera de los marcadores del mapa para ver los productos comprados, cantidades, PVP, precio de coste e historial completo.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista / Galería de clientes con ubicación */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-500" />
          Clientes Geolocalizados ({clientesFiltrados.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {clientesFiltrados.map((cli) => {
            const isSelected = selectedClienteId === cli.codigo || selectedClienteId === cli.id;
            const key = (cli.codigo || cli.id || '').toLowerCase();
            const compras = ventasMapByCliente[key] || [];
            const totalEuros = compras.reduce((acc: number, v: Venta) => acc + (v.importe || 0), 0);

            return (
              <div
                key={cli.codigo || cli.id}
                onClick={() => handleSelectCliente(cli)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                    {cli.codigo}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                    {cli.ciudad || cli.poblacion}
                  </span>
                </div>

                <div className="font-bold text-slate-900 dark:text-white truncate">
                  {cli.nombre_empresa}
                </div>

                <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">{compras.length} {compras.length === 1 ? 'pedido' : 'pedidos'}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatEuro(totalEuros)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modales integrados */}
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

      <ClienteModal
        isOpen={clienteModalOpen}
        onClose={() => setClienteModalOpen(false)}
        clienteParaEditar={clienteAEditar}
      />

      <VisitaModal
        isOpen={visitaModalOpen}
        onClose={() => setVisitaModalOpen(false)}
        visitaParaEditar={visitaAEditar}
        clienteIdDefault={clienteIdParaVisita}
      />
    </div>
  );
};
