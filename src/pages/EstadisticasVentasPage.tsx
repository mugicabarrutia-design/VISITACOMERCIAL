import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { useData } from '../context/DataContext';
import { Venta } from '../types';
import { formatEuro } from '../lib/parsers';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  Filter,
  Calendar,
  Users,
  Briefcase,
  DollarSign,
  ShoppingCart,
  Award,
  Package,
  RotateCcw,
  Sparkles,
  BarChart2
} from 'lucide-react';

// Nombres de meses en español
const MESES_NOMBRES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

// Paleta de colores vibrantes para el gráfico circular por familias
const COLORS_FAMILIAS = [
  '#2563EB', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#64748B', // Slate
  '#84CC16', // Lime
  '#E11D48', // Rose
];

// Helper para parsear la fecha de las ventas (DD/MM/YYYY o ISO)
function parseFechaVenta(fechaStr?: string): { year: number; month: number } {
  if (!fechaStr) return { year: 2024, month: 0 };
  const str = fechaStr.trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month)) {
        return { year, month: Math.max(0, Math.min(11, month)) };
      }
    }
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() };
  }
  return { year: 2024, month: 0 };
}

export const EstadisticasVentasPage: React.FC = () => {
  const { ventasConDetalle, clientes, comerciales, articulos } = useData();

  // Estados de filtros
  const [filtroAño, setFiltroAño] = useState<string>('todos');
  const [filtroClienteId, setFiltroClienteId] = useState<string>('todos');
  const [filtroComercial, setFiltroComercial] = useState<string>('todos');

  // Obtener lista de años únicos presentes en las ventas
  const anosDisponibles = useMemo(() => {
    const set = new Set<number>();
    ventasConDetalle.forEach((v) => {
      const { year } = parseFechaVenta(v.fecha);
      if (year) set.add(year);
    });
    const sorted = Array.from(set).sort((a, b) => b - a);
    return sorted.length > 0 ? sorted : [2024, 2025];
  }, [ventasConDetalle]);

  // Lista de vendedores / comerciales únicos en la tabla ventas y comerciales
  const vendedoresUnicos = useMemo(() => {
    const set = new Set<string>();
    ventasConDetalle.forEach((v) => {
      if (v.vendedor) set.add(v.vendedor.trim());
    });
    comerciales.forEach((c) => {
      set.add(`${c.nombre} ${c.apellidos}`.trim());
      if (c.nombre) set.add(c.nombre.trim());
    });
    return Array.from(set).sort();
  }, [ventasConDetalle, comerciales]);

  // Filtrado de ventas según los filtros activos
  const ventasFiltradas = useMemo(() => {
    return ventasConDetalle.filter((v) => {
      const { year } = parseFechaVenta(v.fecha);

      // Filtro por Año
      if (filtroAño !== 'todos' && year.toString() !== filtroAño) {
        return false;
      }

      // Filtro por Cliente (coincidencia con id_cliente o codigo)
      if (filtroClienteId !== 'todos') {
        const codCli = (v.id_cliente || '').toLowerCase().trim();
        const target = filtroClienteId.toLowerCase().trim();
        if (codCli !== target) return false;
      }

      // Filtro por Comercial / Vendedor
      if (filtroComercial !== 'todos') {
        const vVend = (v.vendedor || '').toLowerCase().trim();
        const targetVend = filtroComercial.toLowerCase().trim();
        const matchesVend = vVend.includes(targetVend) || targetVend.includes(vVend);
        if (!matchesVend) return false;
      }

      return true;
    });
  }, [ventasConDetalle, filtroAño, filtroClienteId, filtroComercial]);

  // --- DATOS PARA GRÁFICO 1: EVOLUCIÓN MENSUAL (LINE CHART) ---
  const datosEvolucionMensual = useMemo(() => {
    // Array para los 12 meses
    const meses = MESES_NOMBRES.map((nombre, index) => ({
      mesIndex: index,
      mesNombre: nombre,
      ventas: 0,
      pedidos: 0,
      unidades: 0,
    }));

    ventasFiltradas.forEach((v) => {
      const { month } = parseFechaVenta(v.fecha);
      if (month >= 0 && month < 12) {
        meses[month].ventas += v.importe || 0;
        meses[month].pedidos += 1;
        meses[month].unidades += v.cantidad || 0;
      }
    });

    return meses;
  }, [ventasFiltradas]);

  // --- DATOS PARA GRÁFICO 2: POR FAMILIAS DE PRODUCTOS (PIE / DONUT CHART) ---
  const datosPorFamilia = useMemo(() => {
    const dict: Record<string, { total: number; cantidad: number; pedidos: number }> = {};

    ventasFiltradas.forEach((v) => {
      const fam = v.articulo?.familia || 'General / Varios';
      if (!dict[fam]) dict[fam] = { total: 0, cantidad: 0, pedidos: 0 };
      dict[fam].total += v.importe || 0;
      dict[fam].cantidad += v.cantidad || 0;
      dict[fam].pedidos += 1;
    });

    const grandTotal = Object.values(dict).reduce((acc, f) => acc + f.total, 0);

    return Object.entries(dict)
      .map(([familia, data], index) => ({
        name: familia,
        value: data.total,
        cantidad: data.cantidad,
        pedidos: data.pedidos,
        porcentaje: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
        color: COLORS_FAMILIAS[index % COLORS_FAMILIAS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [ventasFiltradas]);

  // --- MÉTRICAS GENERALES ACUMULADAS ---
  const metricas = useMemo(() => {
    const totalFacturacion = ventasFiltradas.reduce((acc, v) => acc + (v.importe || 0), 0);
    const totalPedidos = ventasFiltradas.length;
    const totalUnidades = ventasFiltradas.reduce((acc, v) => acc + (v.cantidad || 0), 0);
    const ticketMedio = totalPedidos > 0 ? totalFacturacion / totalPedidos : 0;

    // Familia líder
    const familiaTop = datosPorFamilia.length > 0 ? datosPorFamilia[0] : null;

    // Comercial líder
    const dictVendedor: Record<string, number> = {};
    ventasFiltradas.forEach((v) => {
      const vend = v.vendedor || 'Sin especificar';
      dictVendedor[vend] = (dictVendedor[vend] || 0) + (v.importe || 0);
    });
    const sortedVendedores = Object.entries(dictVendedor).sort((a, b) => b[1] - a[1]);
    const comercialTop = sortedVendedores.length > 0 ? { nombre: sortedVendedores[0][0], total: sortedVendedores[0][1] } : null;

    return {
      totalFacturacion,
      totalPedidos,
      totalUnidades,
      ticketMedio,
      familiaTop,
      comercialTop,
    };
  }, [ventasFiltradas, datosPorFamilia]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Estadísticas e Informes de Ventas</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Análisis dinámico por mes, cliente, comercial asignado y familias de productos
            </p>
          </div>
        </div>

        {/* Botón de resetear filtros */}
        {(filtroAño !== 'todos' || filtroClienteId !== 'todos' || filtroComercial !== 'todos') && (
          <button
            onClick={() => {
              setFiltroAño('todos');
              setFiltroClienteId('todos');
              setFiltroComercial('todos');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer Filtros
          </button>
        )}
      </div>

      {/* FILTROS PRINCIPALES (Año, Cliente, Comercial) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
          <Filter className="w-4 h-4 text-blue-500" />
          Filtros de Análisis
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Filtro 1: Año */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Año de Ejercicio
            </label>
            <select
              value={filtroAño}
              onChange={(e) => setFiltroAño(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="todos">Todos los años ({anosDisponibles.join(', ')})</option>
              {anosDisponibles.map((yr) => (
                <option key={yr} value={yr.toString()}>
                  Año {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro 2: Cliente */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              Cliente / Cuenta
            </label>
            <select
              value={filtroClienteId}
              onChange={(e) => setFiltroClienteId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="todos">Todos los clientes ({clientes.length})</option>
              {clientes.map((c) => (
                <option key={c.codigo || c.id} value={c.codigo || c.id}>
                  {c.nombre_empresa} ({c.codigo})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro 3: Comercial / Vendedor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-500" />
              Comercial / Vendedor
            </label>
            <select
              value={filtroComercial}
              onChange={(e) => setFiltroComercial(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="todos">Todos los comerciales ({vendedoresUnicos.length})</option>
              {vendedoresUnicos.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* METRICAS KPI RESUMEN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Facturación Total */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Facturación Total</span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {formatEuro(metricas.totalFacturacion)}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              {metricas.totalPedidos} pedidos registrados
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Ticket Medio */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ticket Medio / Pedido</span>
            <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {formatEuro(metricas.ticketMedio)}
            </div>
            <span className="text-[10px] text-slate-500">
              {metricas.totalUnidades} unidades vendidas
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Familia Top */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Familia Principal</span>
            <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1 truncate max-w-[150px]">
              {metricas.familiaTop ? metricas.familiaTop.name : 'N/D'}
            </div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
              {metricas.familiaTop ? `${formatEuro(metricas.familiaTop.value)} (${metricas.familiaTop.porcentaje.toFixed(1)}%)` : ''}
            </span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Comercial Top */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Comercial Estrella</span>
            <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1 truncate max-w-[150px]">
              {metricas.comercialTop ? metricas.comercialTop.nombre : 'N/D'}
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              {metricas.comercialTop ? formatEuro(metricas.comercialTop.total) : ''}
            </span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* CONTENEDOR DE GRÁFICOS SOLICITADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRÁFICO 1: LINEAL - VENTAS MENSUALES (8 cols en desktop) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Evolución de Ventas Mensuales (€)
              </h2>
              <p className="text-xs text-slate-500">
                Distribución acumulada mes a mes {filtroAño !== 'todos' ? `en el año ${filtroAño}` : 'histórica'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
              Gráfico Lineal
            </span>
          </div>

          <div className="h-[340px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosEvolucionMensual} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis
                  dataKey="mesNombre"
                  tickLine={false}
                  axisLine={{ stroke: '#64748B', opacity: 0.3 }}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#64748B', opacity: 0.3 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                />
                <Tooltip
                  formatter={(value: any) => [formatEuro(Number(value || 0)), 'Facturación']}
                  labelFormatter={(label) => `Mes: ${label}`}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ventas"
                  name="Facturación Total (€)"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#FFF' }}
                  activeDot={{ r: 7, fill: '#1D4ED8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: CIRCULAR - DISTRIBUCIÓN POR FAMILIAS DE PRODUCTOS (5 cols en desktop) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-500" />
                Ventas por Familias de Productos
              </h2>
              <p className="text-xs text-slate-500">
                Porcentaje de facturación por categoría de mercancía
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              Gráfico Circular
            </span>
          </div>

          <div className="h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datosPorFamilia}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {datosPorFamilia.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${formatEuro(Number(value || 0))}`,
                    `Familia: ${name}`,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Leyenda interactiva en tarjeta */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 max-h-[120px] overflow-y-auto pr-1">
            {datosPorFamilia.map((fam) => (
              <div key={fam.name} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: fam.color }} />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                    {fam.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono text-[11px]">{fam.porcentaje.toFixed(1)}%</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatEuro(fam.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABLA COMPARATIVA DETALLADA DE FAMILIAS Y RENDIMIENTO */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-emerald-500" />
          Resumen Ejecutivo por Familia de Producto
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="pb-3 pl-2">Familia de Producto</th>
                <th className="pb-3">Pedidos</th>
                <th className="pb-3">Unidades Vendidas</th>
                <th className="pb-3">Facturación Total</th>
                <th className="pb-3">Cuota (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {datosPorFamilia.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No hay datos de ventas disponibles con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                datosPorFamilia.map((fam) => (
                  <tr key={fam.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 pl-2 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fam.color }} />
                      {fam.name}
                    </td>
                    <td className="py-3 font-mono">{fam.pedidos}</td>
                    <td className="py-3 font-mono">{fam.cantidad} u.</td>
                    <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatEuro(fam.value)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${fam.porcentaje}%`, backgroundColor: fam.color }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-semibold">{fam.porcentaje.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
