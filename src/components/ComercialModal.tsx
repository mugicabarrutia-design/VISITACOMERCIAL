import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Comercial } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { X, User, Phone, Mail, MapPin, Palette, Trash2, Check } from 'lucide-react';

interface ComercialModalProps {
  isOpen: boolean;
  onClose: () => void;
  comercialParaEditar?: Comercial | null;
}

const PALETA_COLORES = [
  { hex: '#2563EB', nombre: 'Azul Real' },
  { hex: '#059669', nombre: 'Esmeralda' },
  { hex: '#D97706', nombre: 'Ámbar' },
  { hex: '#7C3AED', nombre: 'Púrpura' },
  { hex: '#DB2777', nombre: 'Rosa Intenso' },
  { hex: '#DC2626', nombre: 'Rojo Carmesí' },
  { hex: '#0891B2', nombre: 'Cian Profundo' },
  { hex: '#4F46E5', nombre: 'Índigo' },
  { hex: '#0D9488', nombre: 'Turquesa' },
  { hex: '#EA580C', nombre: 'Naranja Fuego' },
];

export const ComercialModal: React.FC<ComercialModalProps> = ({
  isOpen,
  onClose,
  comercialParaEditar,
}) => {
  const { crearComercial, actualizarComercial, eliminarComercial, addToast } = useData();

  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [zona, setZona] = useState('');
  const [color, setColor] = useState('#2563EB');
  const [activo, setActivo] = useState(true);

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrores({});
      if (comercialParaEditar) {
        setNombre(comercialParaEditar.nombre);
        setApellidos(comercialParaEditar.apellidos);
        setEmail(comercialParaEditar.email);
        setTelefono(comercialParaEditar.telefono);
        setZona(comercialParaEditar.zona);
        setColor(comercialParaEditar.color || '#2563EB');
        setActivo(comercialParaEditar.activo);
      } else {
        setNombre('');
        setApellidos('');
        setEmail('');
        setTelefono('');
        setZona('');
        setColor(PALETA_COLORES[Math.floor(Math.random() * PALETA_COLORES.length)].hex);
        setActivo(true);
      }
    }
  }, [isOpen, comercialParaEditar]);

  const validar = (): boolean => {
    const err: Record<string, string> = {};

    if (!nombre.trim()) err.nombre = 'El nombre es obligatorio';
    if (!apellidos.trim()) err.apellidos = 'Los apellidos son obligatorios';
    if (!telefono.trim()) err.telefono = 'El teléfono es obligatorio';
    if (!zona.trim()) err.zona = 'La zona asignada es obligatoria';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      err.email = 'El email es obligatorio';
    } else if (!emailRegex.test(email.trim())) {
      err.email = 'Introduce un email válido (ej. comercial@empresa.es)';
    }

    setErrores(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;

    setSubmitting(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim(),
        zona: zona.trim(),
        color,
        activo,
      };

      if (comercialParaEditar) {
        const ok = await actualizarComercial(comercialParaEditar.id, payload);
        if (ok) onClose();
      } else {
        const nuevo = await crearComercial(payload);
        if (nuevo) onClose();
      }
    } catch {
      addToast('error', 'Error al guardar comercial', 'Comprueba los datos ingresados.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminar = async () => {
    if (!comercialParaEditar) return;
    setSubmitting(true);
    const ok = await eliminarComercial(comercialParaEditar.id);
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
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                style={{ backgroundColor: color }}
              >
                {nombre ? nombre[0].toUpperCase() : 'C'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {comercialParaEditar ? 'Editar Comercial' : 'Nuevo Comercial'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {comercialParaEditar ? 'Actualiza su zona y color identificativo' : 'Alta de un nuevo asesor en el equipo'}
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    Nombre *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Carlos"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.nombre ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.nombre && <p className="text-xs text-rose-500 mt-1">{errores.nombre}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Apellidos *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Mendoza Ruiz"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.apellidos ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.apellidos && <p className="text-xs text-rose-500 mt-1">{errores.apellidos}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    Correo Electrónico *
                  </span>
                </label>
                <input
                  type="email"
                  placeholder="carlos.mendoza@empresa.es"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.email ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.email && <p className="text-xs text-rose-500 mt-1">{errores.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    Teléfono Móvil *
                  </span>
                </label>
                <input
                  type="tel"
                  placeholder="+34 612 345 678"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.telefono ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.telefono && <p className="text-xs text-rose-500 mt-1">{errores.telefono}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  Zona / Territorio Comercial *
                </span>
              </label>
              <input
                type="text"
                placeholder="Ej. Madrid y Zona Centro, Levante, Andalucía..."
                value={zona}
                onChange={(e) => setZona(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errores.zona ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errores.zona && <p className="text-xs text-rose-500 mt-1">{errores.zona}</p>}
            </div>

            {/* Selector de color */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-500" />
                  Color Identificativo en Calendario
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {PALETA_COLORES.map((item) => (
                  <button
                    key={item.hex}
                    type="button"
                    title={item.nombre}
                    onClick={() => setColor(item.hex)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                    style={{ backgroundColor: item.hex }}
                  >
                    {color.toLowerCase() === item.hex.toLowerCase() && (
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 p-1 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-32 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white uppercase"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Las visitas de este comercial se destacarán con este color en el calendario.
                </span>
              </div>
            </div>

            {/* Activo switch */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-0 border-slate-300 dark:border-slate-700"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    Comercial Activo
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Los comerciales inactivos no aparecen en los selectores de nuevas visitas.
                  </p>
                </div>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              {comercialParaEditar ? (
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
                  {submitting ? 'Guardando...' : comercialParaEditar ? 'Guardar Cambios' : 'Crear Comercial'}
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
        title="¿Eliminar comercial?"
        message={`¿Estás seguro de que deseas eliminar a "${comercialParaEditar?.nombre} ${comercialParaEditar?.apellidos}"? Sus visitas programadas se eliminarán.`}
        confirmText="Sí, eliminar"
        cancelText="Conservar"
      />
    </>
  );
};
