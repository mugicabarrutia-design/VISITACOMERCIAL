import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Articulo } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { X, Package, DollarSign, Layers, Hash, Calendar, AlertTriangle, Trash2 } from 'lucide-react';

interface ArticuloModalProps {
  isOpen: boolean;
  onClose: () => void;
  articuloParaEditar?: Articulo | null;
}

const FAMILIAS_COMUNES = [
  'Bebidas',
  'Condimentos',
  'Repostería',
  'Frutas/Verduras',
  'Carnes',
  'Pescados/Mariscos',
  'Lácteos',
  'Granos/Cereales',
];

export const ArticuloModal: React.FC<ArticuloModalProps> = ({
  isOpen,
  onClose,
  articuloParaEditar,
}) => {
  const { crearArticulo, actualizarArticulo, eliminarArticulo, addToast } = useData();

  const [referencia, setReferencia] = useState<string>('');
  const [producto, setProducto] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [familia, setFamilia] = useState('Condimentos');
  const [stock, setStock] = useState('20');
  const [stockMin, setStockMin] = useState('10');
  const [precioCoste, setPrecioCoste] = useState('15.50');
  const [fechaInvent, setFechaInvent] = useState('31/12/2025');

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrores({});
      if (articuloParaEditar) {
        setReferencia(String(articuloParaEditar.referencia));
        setProducto(articuloParaEditar.producto);
        setProveedor(articuloParaEditar.proveedor);
        setFamilia(articuloParaEditar.familia);
        setStock(String(articuloParaEditar.stock));
        setStockMin(String(articuloParaEditar.stock_min));
        setPrecioCoste(String(articuloParaEditar.precio_coste));
        setFechaInvent(articuloParaEditar.fecha_invent || '31/12/2025');
      } else {
        setReferencia('');
        setProducto('');
        setProveedor('');
        setFamilia('Condimentos');
        setStock('25');
        setStockMin('20');
        setPrecioCoste('19.90');
        setFechaInvent('31/12/2025');
      }
    }
  }, [isOpen, articuloParaEditar]);

  const validar = (): boolean => {
    const err: Record<string, string> = {};
    if (!producto.trim()) err.producto = 'El nombre del producto es obligatorio';
    if (!proveedor.trim()) err.proveedor = 'Indica el proveedor';
    if (isNaN(Number(stock)) || Number(stock) < 0) err.stock = 'El stock debe ser un número válido';
    if (isNaN(Number(stockMin)) || Number(stockMin) < 0) err.stockMin = 'El stock mínimo debe ser válido';
    if (isNaN(Number(precioCoste)) || Number(precioCoste) < 0) err.precioCoste = 'Precio de coste inválido';

    setErrores(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;

    setSubmitting(true);
    try {
      const payload: Partial<Articulo> = {
        producto: producto.trim(),
        proveedor: proveedor.trim(),
        familia: familia.trim(),
        stock: parseInt(stock, 10),
        stock_min: parseInt(stockMin, 10),
        precio_coste: parseFloat(precioCoste),
        fecha_invent: fechaInvent.trim(),
      };

      if (referencia && !articuloParaEditar) {
        payload.referencia = parseInt(referencia, 10);
      }

      if (articuloParaEditar) {
        const ok = await actualizarArticulo(articuloParaEditar.referencia, payload);
        if (ok) onClose();
      } else {
        const nuevo = await crearArticulo(payload);
        if (nuevo) onClose();
      }
    } catch {
      addToast('error', 'Error al guardar artículo', 'Verifica los campos ingresados.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminar = async () => {
    if (!articuloParaEditar) return;
    setSubmitting(true);
    const ok = await eliminarArticulo(articuloParaEditar.referencia);
    setSubmitting(false);
    if (ok) onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {articuloParaEditar ? `Editar Artículo Ref. ${articuloParaEditar.referencia}` : 'Nuevo Artículo en Catálogo'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gestión de inventario, familias y precio de coste
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Nombre del Producto *
              </label>
              <input
                type="text"
                placeholder="Ej. Mermelada de grosellas de la abuela"
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errores.producto ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errores.producto && <p className="text-xs text-rose-500 mt-1">{errores.producto}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Proveedor *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Grandma Kelly's Homestead"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.proveedor ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.proveedor && <p className="text-xs text-rose-500 mt-1">{errores.proveedor}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Familia / Categoría
                </label>
                <select
                  value={familia}
                  onChange={(e) => setFamilia(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FAMILIAS_COMUNES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Stock Actual *
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.stock ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Stock Mínimo *
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockMin}
                  onChange={(e) => setStockMin(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.stockMin ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Precio Coste (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioCoste}
                  onChange={(e) => setPrecioCoste(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.precioCoste ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Fecha de Inventario
              </label>
              <input
                type="text"
                placeholder="31/12/2025"
                value={fechaInvent}
                onChange={(e) => setFechaInvent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Alerta de Stock */}
            {parseInt(stock || '0', 10) <= parseInt(stockMin || '0', 10) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Aviso:</strong> El stock actual ({stock}) está igual o por debajo del mínimo establecido ({stockMin}). Se marcará en alerta en el catálogo.
                </span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              {articuloParaEditar ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              ) : <div />}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : articuloParaEditar ? 'Guardar Cambios' : 'Crear Artículo'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleEliminar}
        title="¿Eliminar este artículo?"
        message={`¿Estás seguro de que deseas eliminar "${articuloParaEditar?.producto}" (Ref. ${articuloParaEditar?.referencia})?`}
        confirmText="Sí, eliminar"
        cancelText="Conservar"
      />
    </>
  );
};
