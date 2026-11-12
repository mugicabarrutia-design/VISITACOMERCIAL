import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Articulo } from '../types';
import { ArticuloModal } from '../components/ArticuloModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatEuro } from '../lib/parsers';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  Filter,
  DollarSign,
  Layers,
  Edit,
  Trash2,
  TrendingDown
} from 'lucide-react';

export const ArticulosPage: React.FC = () => {
  const { articulos, eliminarArticulo } = useData();

  const [busqueda, setBusqueda] = useState('');
  const [filtroFamilia, setFiltroFamilia] = useState('');
  const [soloBajoMinimo, setSoloBajoMinimo] = useState(false);

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [articuloAEditar, setArticuloAEditar] = useState<Articulo | null>(null);
  const [articuloAEliminar, setArticuloAEliminar] = useState<Articulo | null>(null);

  // Lista de familias únicas
  const familias = useMemo(() => {
    const set = new Set<string>();
    articulos.forEach((a) => {
      if (a.familia) set.add(a.familia);
    });
    return Array.from(set).sort();
  }, [articulos]);

  // Artículos filtrados
  const articulosFiltrados = useMemo(() => {
    return articulos.filter((art) => {
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const match =
          art.producto.toLowerCase().includes(q) ||
          art.proveedor.toLowerCase().includes(q) ||
          art.familia.toLowerCase().includes(q) ||
          String(art.referencia).includes(q);
        if (!match) return false;
      }

      if (filtroFamilia && art.familia !== filtroFamilia) {
        return false;
      }

      if (soloBajoMinimo && !art.bajo_minimo) {
        return false;
      }

      return true;
    });
  }, [articulos, busqueda, filtroFamilia, soloBajoMinimo]);

  // Métricas
  const totalStock = articulos.reduce((acc, a) => acc + (a.stock || 0), 0);
  const valorTotalInventario = articulos.reduce((acc, a) => acc + (a.stock || 0) * (a.precio_coste || 0), 0);
  const articulosAlerta = articulos.filter((a) => a.bajo_minimo).length;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Catálogo de Artículos</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inventario de productos, proveedores, familias y alertas de stock mínimo
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setArticuloAEditar(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nuevo Artículo
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Artículos</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{articulos.length}</p>
        </div>

        <div className={`p-3.5 rounded-2xl border shadow-xs transition-colors ${
          articulosAlerta > 0
            ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-200'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Bajo Mínimo</span>
            {articulosAlerta > 0 && <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />}
          </div>
          <p className={`text-2xl font-bold mt-0.5 ${articulosAlerta > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {articulosAlerta}
          </p>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Unidades en Stock</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{totalStock.toLocaleString('es-ES')}</p>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Valoración Coste</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
            {formatEuro(valorTotalInventario)}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por referencia, nombre de producto, proveedor o familia..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <select
              value={filtroFamilia}
              onChange={(e) => setFiltroFamilia(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las familias</option>
              {familias.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={soloBajoMinimo}
                onChange={(e) => setSoloBajoMinimo(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Solo artículos bajo mínimo ({articulosAlerta})
              </span>
            </label>
          </div>

          {(busqueda || filtroFamilia || soloBajoMinimo) && (
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroFamilia('');
                setSoloBajoMinimo(false);
              }}
              className="text-xs text-rose-600 font-semibold hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                <th className="py-3.5 px-4 w-16">Ref</th>
                <th className="py-3.5 px-4">Producto & Proveedor</th>
                <th className="py-3.5 px-4">Familia</th>
                <th className="py-3.5 px-4 text-center">Stock / Mínimo</th>
                <th className="py-3.5 px-4 text-right">Precio Coste</th>
                <th className="py-3.5 px-4 text-center">Estado Stock</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {articulosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm">No se encontraron artículos con los criterios seleccionados.</p>
                  </td>
                </tr>
              ) : (
                articulosFiltrados.map((art) => {
                  const bajoMinimo = art.bajo_minimo;

                  return (
                    <tr
                      key={art.referencia}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Referencia */}
                      <td className="py-3 px-4 font-mono font-bold text-xs text-slate-500 dark:text-slate-400">
                        #{art.referencia}
                      </td>

                      {/* Producto & Proveedor */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {art.producto}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {art.proveedor}
                        </div>
                      </td>

                      {/* Familia */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {art.familia}
                        </span>
                      </td>

                      {/* Stock / Mínimo */}
                      <td className="py-3 px-4 text-center font-mono text-xs">
                        <span className={`font-bold ${bajoMinimo ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                          {art.stock}
                        </span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-slate-500">{art.stock_min} min</span>
                      </td>

                      {/* Precio Coste */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-xs text-slate-900 dark:text-white">
                        {formatEuro(art.precio_coste)}
                      </td>

                      {/* Estado Stock */}
                      <td className="py-3 px-4 text-center">
                        {bajoMinimo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            Bajo Mínimo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle className="w-3 h-3" />
                            Óptimo
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1 opacity-90 group-hover:opacity-100">
                          <button
                            onClick={() => {
                              setArticuloAEditar(art);
                              setModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                            title="Editar artículo"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setArticuloAEliminar(art)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Eliminar artículo"
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

      {/* Modal Articulo */}
      <ArticuloModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        articuloParaEditar={articuloAEditar}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(articuloAEliminar)}
        onClose={() => setArticuloAEliminar(null)}
        onConfirm={async () => {
          if (articuloAEliminar) {
            await eliminarArticulo(articuloAEliminar.referencia);
            setArticuloAEliminar(null);
          }
        }}
        title="¿Eliminar artículo del catálogo?"
        message={`¿Estás seguro de que deseas eliminar "${articuloAEliminar?.producto}" (Ref. ${articuloAEliminar?.referencia})?`}
        confirmText="Sí, eliminar"
        cancelText="Conservar"
      />
    </div>
  );
};
