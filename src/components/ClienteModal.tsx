import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Cliente } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { X, Building2, User, Phone, Mail, MapPin, Briefcase, FileText, Trash2 } from 'lucide-react';

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteParaEditar?: Cliente | null;
}

export const ClienteModal: React.FC<ClienteModalProps> = ({
  isOpen,
  onClose,
  clienteParaEditar,
}) => {
  const { comerciales, crearCliente, actualizarCliente, eliminarCliente, addToast } = useData();

  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [cif, setCif] = useState('');
  const [personaContacto, setPersonaContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [poblacion, setPoblacion] = useState('');
  const [provincia, setProvincia] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [sector, setSector] = useState('');
  const [comercialAsignadoId, setComercialAsignadoId] = useState('');
  const [notas, setNotas] = useState('');

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrores({});
      if (clienteParaEditar) {
        setNombreEmpresa(clienteParaEditar.nombre_empresa);
        setCif(clienteParaEditar.cif);
        setPersonaContacto(clienteParaEditar.persona_contacto);
        setTelefono(clienteParaEditar.telefono);
        setEmail(clienteParaEditar.email);
        setDireccion(clienteParaEditar.direccion);
        setPoblacion(clienteParaEditar.poblacion);
        setProvincia(clienteParaEditar.provincia);
        setCodigoPostal(clienteParaEditar.codigo_postal);
        setSector(clienteParaEditar.sector);
        setComercialAsignadoId(clienteParaEditar.comercial_asignado_id || '');
        setNotas(clienteParaEditar.notas || '');
      } else {
        setNombreEmpresa('');
        setCif('');
        setPersonaContacto('');
        setTelefono('');
        setEmail('');
        setDireccion('');
        setPoblacion('');
        setProvincia('');
        setCodigoPostal('');
        setSector('');
        setComercialAsignadoId(comerciales[0]?.id || '');
        setNotas('');
      }
    }
  }, [isOpen, clienteParaEditar, comerciales]);

  const validar = (): boolean => {
    const err: Record<string, string> = {};

    if (!nombreEmpresa.trim()) err.nombreEmpresa = 'El nombre de la empresa es obligatorio';
    if (!cif.trim()) err.cif = 'El CIF/NIF es obligatorio';
    if (!personaContacto.trim()) err.personaContacto = 'Indica una persona de contacto';
    if (!telefono.trim()) err.telefono = 'El teléfono es obligatorio';
    
    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      err.email = 'El correo electrónico es obligatorio';
    } else if (!emailRegex.test(email.trim())) {
      err.email = 'Introduce un formato de correo electrónico válido (ej. info@empresa.com)';
    }

    if (!direccion.trim()) err.direccion = 'La dirección es obligatoria';
    if (!poblacion.trim()) err.poblacion = 'La población es obligatoria';
    if (!provincia.trim()) err.provincia = 'La provincia es obligatoria';
    if (!codigoPostal.trim()) err.codigoPostal = 'El código postal es obligatorio';
    if (!sector.trim()) err.sector = 'El sector de actividad es obligatorio';

    setErrores(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;

    setSubmitting(true);
    try {
      const payload = {
        nombre_empresa: nombreEmpresa.trim(),
        cif: cif.trim().toUpperCase(),
        persona_contacto: personaContacto.trim(),
        telefono: telefono.trim(),
        email: email.trim().toLowerCase(),
        direccion: direccion.trim(),
        poblacion: poblacion.trim(),
        provincia: provincia.trim(),
        codigo_postal: codigoPostal.trim(),
        sector: sector.trim(),
        comercial_asignado_id: comercialAsignadoId || null,
        notas: notas.trim() || undefined,
      };

      if (clienteParaEditar) {
        const ok = await actualizarCliente(clienteParaEditar.id, payload);
        if (ok) onClose();
      } else {
        const nuevo = await crearCliente(payload);
        if (nuevo) onClose();
      }
    } catch {
      addToast('error', 'Error al guardar cliente', 'Verifica los campos e inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminar = async () => {
    if (!clienteParaEditar) return;
    setSubmitting(true);
    const ok = await eliminarCliente(clienteParaEditar.id);
    setSubmitting(false);
    if (ok) onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {clienteParaEditar ? 'Editar Ficha de Cliente' : 'Registrar Nuevo Cliente'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {clienteParaEditar ? 'Actualiza los datos fiscales y de contacto' : 'Añade una nueva cuenta a la cartera'}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Industrias Metálicas S.A."
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.nombreEmpresa ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.nombreEmpresa && <p className="text-xs text-rose-500 mt-1">{errores.nombreEmpresa}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  CIF / NIF *
                </label>
                <input
                  type="text"
                  placeholder="B12345678"
                  value={cif}
                  onChange={(e) => setCif(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.cif ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.cif && <p className="text-xs text-rose-500 mt-1">{errores.cif}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    Persona de Contacto *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Carmen Rodríguez (Directora Compras)"
                  value={personaContacto}
                  onChange={(e) => setPersonaContacto(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.personaContacto ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.personaContacto && <p className="text-xs text-rose-500 mt-1">{errores.personaContacto}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                    Sector de Actividad *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Hostelería, Tecnología, Salud..."
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.sector ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.sector && <p className="text-xs text-rose-500 mt-1">{errores.sector}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    Teléfono *
                  </span>
                </label>
                <input
                  type="tel"
                  placeholder="+34 912 345 678"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.telefono ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.telefono && <p className="text-xs text-rose-500 mt-1">{errores.telefono}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    Correo Electrónico *
                  </span>
                </label>
                <input
                  type="email"
                  placeholder="contacto@empresa.es"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.email ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.email && <p className="text-xs text-rose-500 mt-1">{errores.email}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  Dirección *
                </span>
              </label>
              <input
                type="text"
                placeholder="Calle, Avenida o Polígono y número"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errores.direccion ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errores.direccion && <p className="text-xs text-rose-500 mt-1">{errores.direccion}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Población *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Madrid"
                  value={poblacion}
                  onChange={(e) => setPoblacion(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.poblacion ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.poblacion && <p className="text-xs text-rose-500 mt-1">{errores.poblacion}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Provincia *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Madrid"
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.provincia ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.provincia && <p className="text-xs text-rose-500 mt-1">{errores.provincia}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Código Postal *
                </label>
                <input
                  type="text"
                  placeholder="28001"
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.codigoPostal ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errores.codigoPostal && <p className="text-xs text-rose-500 mt-1">{errores.codigoPostal}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Comercial Asignado por Defecto
              </label>
              <select
                value={comercialAsignadoId}
                onChange={(e) => setComercialAsignadoId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin asignar</option>
                {comerciales.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.apellidos} ({c.zona})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  Notas y Observaciones
                </span>
              </label>
              <textarea
                rows={2}
                placeholder="Datos de interés para las visitas, horarios preferentes, etc."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              {clienteParaEditar ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar Cliente
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
                  {submitting ? 'Guardando...' : clienteParaEditar ? 'Guardar Cambios' : 'Crear Cliente'}
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
        title="¿Eliminar cliente?"
        message={`¿Estás seguro de que deseas eliminar a "${clienteParaEditar?.nombre_empresa}"? También se eliminará todo su historial de visitas asociadas.`}
        confirmText="Sí, eliminar cliente"
        cancelText="Conservar"
      />
    </>
  );
};
