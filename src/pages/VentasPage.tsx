import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Venta } from '../types';
import { formatEuro } from '../lib/parsers';
import {
  TrendingUp,
  Search,
  ShoppingCart,
  DollarSign,
  Package,
  Truck,
  User,
  Building2,
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

const CIA_ENVIO_BADGES: Record<string, string> = {
  'Speedy Express': 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'United Package': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  'Federal Shipping': 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
};

export const VentasPage: React.FC = () => {
  const { ventasConDetalle, clientes, articulos } = useData();

  const [busqueda, setBusqueda] = useState('');
  const [filtroVendedor, setFiltroVendedor] = useState('');
  const [filtroCiaEnvio, setFiltroCiaEnvio] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');

  // Vendedores únicos
  const vendedores = useMemo(() => {
    const set = new Set<string>();
    ventasConDetalle.forEach((v) => {
      if (v.vendedor) set.add(v.vendedor);
    });
    return Array.from(set).sort();
  }, [ventasConDetalle]);

  // Compañías de envío únicas
  const ciasEnvio = useMemo(() => {
    const set = new Set<string>();
    ventasConDetalle.forEach((v) => {
      if (v.cia_envio) set.add(v.cia_envio);
    });
    return Array.from(set).sort();
  }, [ventasConDetalle]);

  // Filtrado de ventas
  const ventasFiltradas = useMemo(() => {
    return ventasConDetalle.filter((v) => {
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const match =
          v.cliente_nombre.toLowerCase().includes(q) ||
          v.vendedor.toLowerCase().includes(q) ||
          String(v.n_pedido).includes(q) ||
          String(v.referencia_articulo).includes(q) ||
          v.id_cliente.toLowerCase().includes(q) ||
          (v.articulo?.producto || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      if (filtroVendedor && v.vendedor !== filtroVendedor) {
        return false;
      }

      if (filtroCiaEnvio && v.cia_envio !== filtroCiaEnvio) {
        return false;
      }

      if (filtroCliente && v.id_cliente !== filtroCliente) {
        return false;
      }

      return true;
    });
  }, [ventasConDetalle, busqueda, filtroVendedor, filtroCiaEnvio, filtroCliente]);

  // Métricas financieras
  const totalFacturacion = useMemo(() => {
    return ventasFiltradas.reduce((acc, v) => acc + (v.importe || 0), 0);
  }, [ventasFiltradas]);

  const totalUnidades = useMemo(() => {
    return ventasFiltradas.reduce((acc, v) => acc + (v.cantidad || 0), 0);
  }, [ventasFiltradas]);

  const pedidosUnicos = useMemo(() => {
    const set = new Set<number>();
    ventasFiltradas.forEach((v) => set.add(v.n_pedido));
    return set.size;
  }, [ventasFiltradas]);

  const ticketMedio = pedidosUnicos > 0 ? totalFacturacion / pedidosUnicos : 0;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Registro de Ventas y Pedidos</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Historial de pedidos por cliente, vendedor asignado y agencia de transporte
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {ventasFiltradas.length} líneas de pedido
          </span>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Facturación Total</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
            {formatEuro(totalFacturacion)}
          </p>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Pedidos Únicos</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{pedidosUnicos}</p>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Unidades Vendidas</span>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{totalUnidades.toLocaleString('es-ES')}</p>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Ticket Medio</span>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-0.5 truncate">
            {formatEuro(ticketMedio)}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, vendedor, número de pedido o artículo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <select
            value={filtroVendedor}
            onChange={(e) => setFiltroVendedor(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los vendedores</option>
            {vendedores.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <select
            value={filtroCiaEnvio}
            onChange={(e) => setFiltroCiaEnvio(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las agencias de envío</option>
            {ciasEnvio.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los clientes ({clientes.length})</option>
            {clientes.map((c) => (
              <option key={c.codigo} value={c.codigo}>
                {c.nombre_empresa} ({c.codigo})
              </option>
            ))}
          </select>
        </div>

        {(busqueda || filtroVendedor || filtroCiaEnvio || filtroCliente) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroVendedor('');
                setFiltroCiaEnvio('');
                setFiltroCliente('');
              }}
              className="text-xs text-rose-600 font-semibold hover:underline"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                <th className="py-3.5 px-4 w-24">Fecha</th>
                <th className="py-3.5 px-4 w-20">Nº Pedido</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Vendedor</th>
                <th className="py-3.5 px-4">Artículo</th>
                <th className="py-3.5 px-4 text-center">Cant.</th>
                <th className="py-3.5 px-4 text-right">PVP</th>
                <th className="py-3.5 px-4">Cía Envío</th>
                <th className="py-3.5 px-4 text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm">No se encontraron ventas para los filtros aplicados.</p>
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((venta) => {
                  const badgeCia = CIA_ENVIO_BADGES[venta.cia_envio] || 'bg-slate-100 text-slate-700';

                  return (
                    <tr
                      key={venta.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Fecha */}
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {venta.fecha}
                      </td>

                      {/* Nº Pedido */}
                      <td className="py-3 px-4 font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        #{venta.n_pedido}
                      </td>

                      {/* Cliente */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {venta.cliente_nombre}
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {venta.id_cliente}
                        </span>
                      </td>

                      {/* Vendedor */}
                      <td className="py-3 px-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {venta.vendedor}
                      </td>

                      {/* Artículo */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-xs font-medium text-slate-900 dark:text-white truncate">
                          {venta.articulo ? venta.articulo.producto : `Ref. ${venta.referencia_articulo}`}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Ref: #{venta.referencia_articulo}
                        </span>
                      </td>

                      {/* Cantidad */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                        {venta.cantidad}
                      </td>

                      {/* PVP */}
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                        {formatEuro(venta.pvp)}
                      </td>

                      {/* Cía Envío */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badgeCia}`}>
                          <Truck className="w-3 h-3" />
                          {venta.cia_envio}
                        </span>
                      </td>

                      {/* Importe */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {formatEuro(venta.importe)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
