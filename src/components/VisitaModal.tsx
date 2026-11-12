import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Visita, TipoVisita, EstadoVisita } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { X, Calendar, Clock, DollarSign, Target, User, Building, Trash2 } from 'lucide-react';

interface VisitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitaParaEditar?: Visita | null;
  fechaInicioDefault?: string; // ISO string o YYYY-MM-DDTHH:mm
  fechaFinDefault?: string;
  clienteIdDefault?: string;
}

const TIPOS_VISITA: { valor: TipoVisita; label: string; desc: string }[] = [
  { valor: 'presentación', label: 'Presentación', desc: 'Primera toma de contacto o demo' },
  { valor: 'seguimiento', label: 'Seguimiento', desc: 'Revisión de propuesta en curso' },
  { valor: 'cierre', label: 'Cierre', desc: 'Negociación final y firma' },
  { valor: 'incidencia', label: 'Incidencia', desc: 'Resolución de problemas técnicos' },
  { valor: 'postventa', label: 'Postventa', desc: 'Fidelización y soporte de servicio' },
];

const ESTADOS_VISITA: { valor: EstadoVisita; label: string; badgeClass: string }[] = [
  { valor: 'programada', label: 'Programada', badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  { valor: 'realizada', label: 'Realizada', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { valor: 'aplazada', label: 'Aplazada', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  { valor: 'cancelada', label: 'Cancelada', badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' },
];

// Helper to format ISO into local datetime-local string (YYYY-MM-DDTHH:mm)
const toDatetimeLocal = (isoString?: string) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const VisitaModal: React.FC<VisitaModalProps> = ({
  isOpen,
  onClose,
  visitaParaEditar,
  fechaInicioDefault,
  fechaFinDefault,
  clienteIdDefault,
}) => {
  const { clientes, comerciales, crearVisita, actualizarVisita, eliminarVisita, addToast } = useData();

  const [clienteId, setClienteId] = useState('');
  const [comercialId, setComercialId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipo, setTipo] = useState<TipoVisita>('seguimiento');
  const [estado, setEstado] = useState<EstadoVisita>('programada');
  const [objetivo, setObjetivo] = useState('');
  const [resultado, setResultado] = useState('');
  const [importeEstimado, setImporteEstimado] = useState<string>('');
  const [proximaAccion, setProximaAccion] = useState('');
  const [notas, setNotas] = useState('');

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrores({});
      if (visitaParaEditar) {
        setClienteId(visitaParaEditar.cliente_id);
        setComercialId(visitaParaEditar.comercial_id);
        setFechaInicio(toDatetimeLocal(visitaParaEditar.fecha_inicio));
        setFechaFin(toDatetimeLocal(visitaParaEditar.fecha_fin));
        setTipo(visitaParaEditar.tipo);
        setEstado(visitaParaEditar.estado);
        setObjetivo(visitaParaEditar.objetivo || '');
        setResultado(visitaParaEditar.resultado || '');
        setImporteEstimado(visitaParaEditar.importe_estimado !== undefined ? String(visitaParaEditar.importe_estimado) : '');
        setProximaAccion(visitaParaEditar.proxima_accion || '');
        setNotas(visitaParaEditar.notas || '');
      } else {
        // Modo Creación
        const defaultCliente = clienteIdDefault || (clientes.length > 0 ? clientes[0].id : '');
        setClienteId(defaultCliente);

        // Preseleccionar comercial del cliente si existe
        const cliObj = clientes.find((c) => c.id === defaultCliente);
        if (cliObj && cliObj.comercial_asignado_id) {
          setComercialId(cliObj.comercial_asignado_id);
        } else if (comerciales.length > 0) {
          setComercialId(comerciales[0].id);
        } else {
          setComercialId('');
        }

        const now = new Date();
        const startStr = fechaInicioDefault ? toDatetimeLocal(fechaInicioDefault) : toDatetimeLocal(now.toISOString());
        
        let endStr = '';
        if (fechaFinDefault) {
          endStr = toDatetimeLocal(fechaFinDefault);
        } else {
          const endDate = new Date(now.getTime() + 60 * 60 * 1000);
          endStr = toDatetimeLocal(endDate.toISOString());
        }

        setFechaInicio(startStr);
        setFechaFin(endStr);
        setTipo('seguimiento');
        setEstado('programada');
        setObjetivo('');
        setResultado('');
        setImporteEstimado('');
        setProximaAccion('');
        setNotas('');
      }
    }
  }, [isOpen, visitaParaEditar, fechaInicioDefault, fechaFinDefault, clienteIdDefault, clientes, comerciales]);

  // Al cambiar de cliente en creación, preseleccionar su comercial asignado
  const handleClienteChange = (nuevoClienteId: string) => {
    setClienteId(nuevoClienteId);
    if (!visitaParaEditar) {
      const cli = clientes.find((c) => c.id === nuevoClienteId);
      if (cli && cli.comercial_asignado_id) {
        setComercialId(cli.comercial_asignado_id);
      }
    }
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!clienteId) nuevosErrores.clienteId = 'Debe seleccionar un cliente';
    if (!comercialId) nuevosErrores.comercialId = 'Debe seleccionar un comercial';
    if (!fechaInicio) nuevosErrores.fechaInicio = 'La fecha y hora de inicio es obligatoria';
    if (!fechaFin) nuevosErrores.fechaFin = 'La fecha y hora de fin es obligatoria';

    if (fechaInicio && fechaFin) {
      const dInicio = new Date(fechaInicio);
      const dFin = new Date(fechaFin);
      if (isNaN(dInicio.getTime()) || isNaN(dFin.getTime())) {
        nuevosErrores.fechaFin = 'Formato de fecha inválido';
      } else if (dFin <= dInicio) {
        nuevosErrores.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }

    if (!objetivo.trim()) {
      nuevosErrores.objetivo = 'El objetivo de la visita es obligatorio';
    }

    if (importeEstimado && (isNaN(Number(importeEstimado)) || Number(importeEstimado) < 0)) {
      nuevosErrores.importeEstimado = 'El importe estimado debe ser un número positivo';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setSubmitting(true);
    const startIso = new Date(fechaInicio).toISOString();
    const endIso = new Date(fechaFin).toISOString();
    const numImporte = importeEstimado ? parseFloat(importeEstimado) : 0;

    try {
      if (visitaParaEditar) {
        const ok = await actualizarVisita(visitaParaEditar.id, {
          cliente_id: clienteId,
          comercial_id: comercialId,
          fecha_inicio: startIso,
          fecha_fin: endIso,
          tipo,
          estado,
          objetivo: objetivo.trim(),
          resultado: resultado.trim() || undefined,
          importe_estimado: numImporte,
          proxima_accion: proximaAccion.trim() || undefined,
          notas: notas.trim() || undefined,
        });
        if (ok) onClose();
      } else {
        const nueva = await crearVisita({
          cliente_id: clienteId,
          comercial_id: comercialId,
          fecha_inicio: startIso,
          fecha_fin: endIso,
          tipo,
          estado,
          objetivo: objetivo.trim(),
          resultado: resultado.trim() || undefined,
          importe_estimado: numImporte,
          proxima_accion: proximaAccion.trim() || undefined,
          notas: notas.trim() || undefined,
        });
        if (nueva) onClose();
      }
    } catch {
      addToast('error', 'Error en el formulario', 'Ocurrió un error al procesar la visita.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminar = async () => {
    if (!visitaParaEditar) return;
    setSubmitting(true);
    const ok = await eliminarVisita(visitaParaEditar.id);
    setSubmitting(false);
    if (ok) onClose();
  };

  if (!isOpen) return null;

  const comercialSeleccionado = comerciales.find((c) => c.id === comercialId);

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 my-auto">
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full ring-4 ring-blue-500/20 ring-offset-2 dark:ring-offset-slate-900"
                style={{
                  backgroundColor: comercialSeleccionado?.color || '#3b82f6',
                }}
              />
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {visitaParaEditar ? 'Editar Visita Comercial' : 'Programar Nueva Visita'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {visitaParaEditar ? 'Modifica los datos de la reunión comercial' : 'Asigna fecha, cliente y comercial para la visita'}
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Cliente y Comercial */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-500" />
                    Cliente *
                  </span>
                </label>
                <select
                  value={clienteId}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errores.clienteId ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <option value="">Selecciona un cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_empresa} ({c.poblacion})
                    </option>
                  ))}
                </select>
                {errores.clienteId && <p className="text-xs text-rose-500 mt-1">{errores.clienteId}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    Comercial Asignado *
                  </span>
                </label>
                <select
                  value={comercialId}
                  onChange={(e) => setComercialId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errores.comercialId ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <option value="">Selecciona un comercial...</option>
                  {comerciales.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellidos} - {c.zona}
                    </option>
                  ))}
                </select>
                {errores.comercialId && <p className="text-xs text-rose-500 mt-1">{errores.comercialId}</p>}
              </div>
            </div>

            {/* Fechas: Inicio y Fin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    Fecha y Hora de Inicio *
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errores.fechaInicio ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.fechaInicio && <p className="text-xs text-rose-500 mt-1">{errores.fechaInicio}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    Fecha y Hora de Fin *
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errores.fechaFin ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.fechaFin && <p className="text-xs text-rose-500 mt-1">{errores.fechaFin}</p>}
              </div>
            </div>

            {/* Tipo y Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Tipo de Visita
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoVisita)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all capitalize"
                >
                  {TIPOS_VISITA.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.label} ({t.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Estado
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoVisita)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all capitalize"
                >
                  {ESTADOS_VISITA.map((est) => (
                    <option key={est.valor} value={est.valor}>
                      {est.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Objetivo */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-500" />
                  Objetivo de la Visita *
                </span>
              </label>
              <textarea
                rows={2}
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                placeholder="Ej. Presentar propuesta económica o revisar incidencias técnicas..."
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errores.objetivo ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errores.objetivo && <p className="text-xs text-rose-500 mt-1">{errores.objetivo}</p>}
            </div>

            {/* Importe y Próxima acción */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    Importe Estimado (€)
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0.00"
                  value={importeEstimado}
                  onChange={(e) => setImporteEstimado(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errores.importeEstimado ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.importeEstimado && <p className="text-xs text-rose-500 mt-1">{errores.importeEstimado}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Próxima Acción
                </label>
                <input
                  type="text"
                  placeholder="Ej. Enviar presupuesto el jueves..."
                  value={proximaAccion}
                  onChange={(e) => setProximaAccion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Resultado (si realizada o aplazada) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Resultado de la Visita
              </label>
              <textarea
                rows={2}
                value={resultado}
                onChange={(e) => setResultado(e.target.value)}
                placeholder="Resumen de los acuerdos o impresiones del cliente tras la reunión..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Notas internas */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Notas Internas
              </label>
              <textarea
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones de logística, personas clave, etc."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              {visitaParaEditar ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar Visita
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
                  {submitting ? 'Guardando...' : visitaParaEditar ? 'Guardar Cambios' : 'Crear Visita'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmación de eliminación */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleEliminar}
        title="¿Eliminar esta visita?"
        message="Esta acción no se puede deshacer. La reunión se eliminará definitivamente tanto del calendario como de la base de datos."
        confirmText="Sí, eliminar"
        cancelText="Conservar"
      />
    </>
  );
};
