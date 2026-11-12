import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured, supabaseUrl } from '../lib/supabaseClient';
import { Cliente, Comercial, Visita, ToastMessage } from '../types';
import { INITIAL_COMERCIALES, INITIAL_CLIENTES, generateInitialVisitas } from '../lib/initialData';

interface DataContextType {
  comerciales: Comercial[];
  clientes: Cliente[];
  visitas: Visita[];
  visitasConDetalle: Visita[];
  clientesConDetalle: Cliente[];
  loading: boolean;
  isLiveSupabase: boolean;
  supabaseUrl: string;
  toasts: ToastMessage[];
  addToast: (tipo: ToastMessage['tipo'], mensaje: string, detalles?: string) => void;
  removeToast: (id: string) => void;
  // Operaciones Visitas
  crearVisita: (visita: Omit<Visita, 'id' | 'created_at'>) => Promise<Visita | null>;
  actualizarVisita: (id: string, visita: Partial<Visita>) => Promise<boolean>;
  eliminarVisita: (id: string) => Promise<boolean>;
  // Operaciones Clientes
  crearCliente: (cliente: Omit<Cliente, 'id' | 'created_at'>) => Promise<Cliente | null>;
  actualizarCliente: (id: string, cliente: Partial<Cliente>) => Promise<boolean>;
  eliminarCliente: (id: string) => Promise<boolean>;
  // Operaciones Comerciales
  crearComercial: (comercial: Omit<Comercial, 'id' | 'created_at'>) => Promise<Comercial | null>;
  actualizarComercial: (id: string, comercial: Partial<Comercial>) => Promise<boolean>;
  eliminarComercial: (id: string) => Promise<boolean>;
  // Utilidades
  recargarDatos: () => Promise<void>;
  resetearDatosDemo: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comerciales, setComerciales] = useState<Comercial[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Notificaciones Toast
  const addToast = useCallback((tipo: ToastMessage['tipo'], mensaje: string, detalles?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, tipo, mensaje, detalles }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Cargar datos locales desde localStorage o iniciales
  const cargarDatosLocales = useCallback(() => {
    const storedComerciales = localStorage.getItem('DEMO_COMERCIALES');
    const storedClientes = localStorage.getItem('DEMO_CLIENTES');
    const storedVisitas = localStorage.getItem('DEMO_VISITAS');

    const com = storedComerciales ? JSON.parse(storedComerciales) : INITIAL_COMERCIALES;
    const cli = storedClientes ? JSON.parse(storedClientes) : INITIAL_CLIENTES;
    const vis = storedVisitas ? JSON.parse(storedVisitas) : generateInitialVisitas();

    setComerciales(com);
    setClientes(cli);
    setVisitas(vis);

    if (!storedComerciales) localStorage.setItem('DEMO_COMERCIALES', JSON.stringify(com));
    if (!storedClientes) localStorage.setItem('DEMO_CLIENTES', JSON.stringify(cli));
    if (!storedVisitas) localStorage.setItem('DEMO_VISITAS', JSON.stringify(vis));
  }, []);

  // Cargar datos de Supabase o fallback local
  const recargarDatos = useCallback(async () => {
    setLoading(true);
    if (!isSupabaseConfigured || !supabase) {
      cargarDatosLocales();
      setLoading(false);
      return;
    }

    try {
      // 1. Comerciales
      const { data: comData, error: comError } = await supabase
        .from('comerciales')
        .select('*')
        .order('nombre', { ascending: true });
      if (comError) throw comError;

      // 2. Clientes
      const { data: cliData, error: cliError } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre_empresa', { ascending: true });
      if (cliError) throw cliError;

      // 3. Visitas
      const { data: visData, error: visError } = await supabase
        .from('visitas')
        .select('*')
        .order('fecha_inicio', { ascending: true });
      if (visError) throw visError;

      setComerciales(comData || []);
      setClientes(cliData || []);
      setVisitas(visData || []);
    } catch (err: unknown) {
      console.warn('Fallo al conectar con Supabase, usando almacenamiento local:', err);
      const errMsg = err instanceof Error ? err.message : 'Error desconocido';
      addToast('aviso', 'Modo local activo', `No se pudo conectar a Supabase (${errMsg}). Usando datos locales.`);
      cargarDatosLocales();
    } finally {
      setLoading(false);
    }
  }, [cargarDatosLocales, addToast]);

  useEffect(() => {
    recargarDatos();
  }, [recargarDatos]);

  const resetearDatosDemo = useCallback(() => {
    localStorage.removeItem('DEMO_COMERCIALES');
    localStorage.removeItem('DEMO_CLIENTES');
    localStorage.removeItem('DEMO_VISITAS');
    cargarDatosLocales();
    addToast('info', 'Datos de prueba restablecidos', 'Se han cargado los 3 comerciales, 8 clientes y 10 visitas de ejemplo.');
  }, [cargarDatosLocales, addToast]);

  // Sincronizar en localStorage cuando estemos en modo local
  const guardarLocalmente = useCallback((nuevosComerciales?: Comercial[], nuevosClientes?: Cliente[], nuevasVisitas?: Visita[]) => {
    if (!isSupabaseConfigured) {
      if (nuevosComerciales) localStorage.setItem('DEMO_COMERCIALES', JSON.stringify(nuevosComerciales));
      if (nuevosClientes) localStorage.setItem('DEMO_CLIENTES', JSON.stringify(nuevosClientes));
      if (nuevasVisitas) localStorage.setItem('DEMO_VISITAS', JSON.stringify(nuevasVisitas));
    }
  }, []);

  // --- CRUD VISITAS ---
  const crearVisita = async (visitaData: Omit<Visita, 'id' | 'created_at'>): Promise<Visita | null> => {
    const id = crypto.randomUUID();
    const nueva: Visita = {
      ...visitaData,
      id,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('visitas').insert([nueva]).select().single();
        if (error) throw error;
        const insertada = data as Visita;
        setVisitas((prev) => [...prev, insertada]);
        addToast('exito', 'Visita programada', `Se ha agendado la visita correctamente.`);
        return insertada;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error en Supabase';
        addToast('error', 'Error al crear visita', msg);
        return null;
      }
    } else {
      const actualizadas = [...visitas, nueva];
      setVisitas(actualizadas);
      guardarLocalmente(undefined, undefined, actualizadas);
      addToast('exito', 'Visita programada', `Se ha agendado la visita correctamente.`);
      return nueva;
    }
  };

  const actualizarVisita = async (id: string, updates: Partial<Visita>): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('visitas').update(updates).eq('id', id);
        if (error) throw error;
        setVisitas((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
        addToast('exito', 'Visita actualizada', 'Los cambios se han guardado en Supabase.');
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al sincronizar con Supabase';
        addToast('error', 'Error al actualizar', msg);
        return false;
      }
    } else {
      const actualizadas = visitas.map((v) => (v.id === id ? { ...v, ...updates } : v));
      setVisitas(actualizadas);
      guardarLocalmente(undefined, undefined, actualizadas);
      addToast('exito', 'Visita actualizada', 'Cambios guardados localmente.');
      return true;
    }
  };

  const eliminarVisita = async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('visitas').delete().eq('id', id);
        if (error) throw error;
        setVisitas((prev) => prev.filter((v) => v.id !== id));
        addToast('exito', 'Visita eliminada', 'La visita ha sido eliminada.');
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al eliminar de Supabase';
        addToast('error', 'No se pudo eliminar la visita', msg);
        return false;
      }
    } else {
      const actualizadas = visitas.filter((v) => v.id !== id);
      setVisitas(actualizadas);
      guardarLocalmente(undefined, undefined, actualizadas);
      addToast('exito', 'Visita eliminada', 'La visita ha sido eliminada.');
      return true;
    }
  };

  // --- CRUD CLIENTES ---
  const crearCliente = async (clienteData: Omit<Cliente, 'id' | 'created_at'>): Promise<Cliente | null> => {
    const id = crypto.randomUUID();
    const nuevo: Cliente = {
      ...clienteData,
      id,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('clientes').insert([nuevo]).select().single();
        if (error) throw error;
        const insertado = data as Cliente;
        setClientes((prev) => [...prev, insertado]);
        addToast('exito', 'Cliente creado', `Cliente ${insertado.nombre_empresa} registrado.`);
        return insertado;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al crear cliente';
        addToast('error', 'Error al guardar cliente', msg);
        return null;
      }
    } else {
      const actualizados = [...clientes, nuevo];
      setClientes(actualizados);
      guardarLocalmente(undefined, actualizados);
      addToast('exito', 'Cliente creado', `Cliente ${nuevo.nombre_empresa} registrado.`);
      return nuevo;
    }
  };

  const actualizarCliente = async (id: string, updates: Partial<Cliente>): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('clientes').update(updates).eq('id', id);
        if (error) throw error;
        setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
        addToast('exito', 'Cliente actualizado', 'Datos del cliente actualizados en Supabase.');
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al actualizar cliente';
        addToast('error', 'Error al actualizar cliente', msg);
        return false;
      }
    } else {
      const actualizados = clientes.map((c) => (c.id === id ? { ...c, ...updates } : c));
      setClientes(actualizados);
      guardarLocalmente(undefined, actualizados);
      addToast('exito', 'Cliente actualizado', 'Datos del cliente actualizados localmente.');
      return true;
    }
  };

  const eliminarCliente = async (id: string): Promise<boolean> => {
    // Validar si tiene visitas
    const tieneVisitas = visitas.some((v) => v.cliente_id === id);
    if (tieneVisitas) {
      addToast('aviso', 'Atención', 'Este cliente tiene visitas asociadas que también serán eliminadas.');
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('clientes').delete().eq('id', id);
        if (error) throw error;
        setClientes((prev) => prev.filter((c) => c.id !== id));
        setVisitas((prev) => prev.filter((v) => v.cliente_id !== id));
        addToast('exito', 'Cliente eliminado', 'El cliente y sus visitas han sido eliminados.');
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al eliminar';
        addToast('error', 'No se pudo eliminar el cliente', msg);
        return false;
      }
    } else {
      const actualizados = clientes.filter((c) => c.id !== id);
      const visitasActualizadas = visitas.filter((v) => v.cliente_id !== id);
      setClientes(actualizados);
      setVisitas(visitasActualizadas);
      guardarLocalmente(undefined, actualizados, visitasActualizadas);
      addToast('exito', 'Cliente eliminado', 'El cliente ha sido eliminado.');
      return true;
    }
  };

  // --- CRUD COMERCIALES ---
  const crearComercial = async (comercialData: Omit<Comercial, 'id' | 'created_at'>): Promise<Comercial | null> => {
    const id = crypto.randomUUID();
    const nuevo: Comercial = {
      ...comercialData,
      id,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('comerciales').insert([nuevo]).select().single();
        if (error) throw error;
        const insertado = data as Comercial;
        setComerciales((prev) => [...prev, insertado]);
        addToast('exito', 'Comercial añadido', `${insertado.nombre} ${insertado.apellidos} registrado.`);
        return insertado;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al crear comercial';
        addToast('error', 'Error al guardar comercial', msg);
        return null;
      }
    } else {
      const actualizados = [...comerciales, nuevo];
      setComerciales(actualizados);
      guardarLocalmente(actualizados);
      addToast('exito', 'Comercial añadido', `${nuevo.nombre} ${nuevo.apellidos} registrado.`);
      return nuevo;
    }
  };

  const actualizarComercial = async (id: string, updates: Partial<Comercial>): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('comerciales').update(updates).eq('id', id);
        if (error) throw error;
        setComerciales((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
        addToast('exito', 'Comercial actualizado', 'Cambios guardados en Supabase.');
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al actualizar';
        addToast('error', 'Error al actualizar comercial', msg);
        return false;
      }
    } else {
      const actualizados = comerciales.map((c) => (c.id === id ? { ...c, ...updates } : c));
      setComerciales(actualizados);
      guardarLocalmente(actualizados);
      addToast('exito', 'Comercial actualizado', 'Cambios guardados.');
      return true;
    }
  };

  const eliminarComercial = async (id: string): Promise<boolean> => {
    // Validar si tiene visitas
    const tieneVisitas = visitas.some((v) => v.comercial_id === id);
    if (tieneVisitas) {
      addToast('aviso', 'Atención', 'Este comercial tiene visitas asignadas.');
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('comerciales').delete().eq('id', id);
        if (error) throw error;
        setComerciales((prev) => prev.filter((c) => c.id !== id));
        // Desasignar en clientes locales o actualizar
        setClientes((prev) => prev.map((cl) => (cl.comercial_asignado_id === id ? { ...cl, comercial_asignado_id: null } : cl)));
        setVisitas((prev) => prev.filter((v) => v.comercial_id !== id));
        addToast('exito', 'Comercial eliminado', 'El comercial ha sido eliminado correctamente.');
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al eliminar';
        addToast('error', 'No se pudo eliminar el comercial', msg);
        return false;
      }
    } else {
      const actualizados = comerciales.filter((c) => c.id !== id);
      const clientesActualizados = clientes.map((cl) => (cl.comercial_asignado_id === id ? { ...cl, comercial_asignado_id: null } : cl));
      const visitasActualizadas = visitas.filter((v) => v.comercial_id !== id);
      setComerciales(actualizados);
      setClientes(clientesActualizados);
      setVisitas(visitasActualizadas);
      guardarLocalmente(actualizados, clientesActualizados, visitasActualizadas);
      addToast('exito', 'Comercial eliminado', 'El comercial ha sido eliminado.');
      return true;
    }
  };

  // Relaciones pobladas memoizadas
  const clientesConDetalle = useMemo(() => {
    const comMap = new Map(comerciales.map((c) => [c.id, c]));
    return clientes.map((cli) => ({
      ...cli,
      comercial_asignado: cli.comercial_asignado_id ? comMap.get(cli.comercial_asignado_id) : undefined,
    }));
  }, [clientes, comerciales]);

  const visitasConDetalle = useMemo(() => {
    const comMap = new Map(comerciales.map((c) => [c.id, c]));
    const cliMap = new Map(clientes.map((cl) => [cl.id, cl]));

    return visitas.map((v) => ({
      ...v,
      cliente: cliMap.get(v.cliente_id),
      comercial: comMap.get(v.comercial_id),
    }));
  }, [visitas, clientes, comerciales]);

  return (
    <DataContext.Provider
      value={{
        comerciales,
        clientes,
        visitas,
        visitasConDetalle,
        clientesConDetalle,
        loading,
        isLiveSupabase: isSupabaseConfigured && Boolean(supabase),
        supabaseUrl,
        toasts,
        addToast,
        removeToast,
        crearVisita,
        actualizarVisita,
        eliminarVisita,
        crearCliente,
        actualizarCliente,
        eliminarCliente,
        crearComercial,
        actualizarComercial,
        eliminarComercial,
        recargarDatos,
        resetearDatosDemo,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe utilizarse dentro de un DataProvider');
  }
  return context;
};
