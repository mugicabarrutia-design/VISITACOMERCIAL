import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured, supabaseUrl } from '../lib/supabaseClient';
import { Cliente, Comercial, Visita, Articulo, Venta, ToastMessage } from '../types';
import { INITIAL_COMERCIALES } from '../lib/initialData';
import {
  INITIAL_IMPORTED_CLIENTES,
  INITIAL_IMPORTED_ARTICULOS,
  INITIAL_IMPORTED_VENTAS,
  generateVisitasForImportedClientes,
} from '../lib/importedData';
import { parseSpanishNumber } from '../lib/parsers';

interface DataContextType {
  comerciales: Comercial[];
  clientes: Cliente[];
  articulos: Articulo[];
  ventas: Venta[];
  visitas: Visita[];
  visitasConDetalle: Visita[];
  clientesConDetalle: Cliente[];
  ventasConDetalle: Venta[];
  loading: boolean;
  isLiveSupabase: boolean;
  supabaseUrl: string;
  needToRunSchemaSql: boolean;
  isDatabaseEmpty: boolean;
  toasts: ToastMessage[];
  addToast: (tipo: ToastMessage['tipo'], mensaje: string, detalles?: string) => void;
  removeToast: (id: string) => void;

  // Operaciones Visitas
  crearVisita: (visita: Omit<Visita, 'id' | 'created_at'>) => Promise<Visita | null>;
  actualizarVisita: (id: string, visita: Partial<Visita>) => Promise<boolean>;
  eliminarVisita: (id: string) => Promise<boolean>;

  // Operaciones Clientes
  crearCliente: (cliente: Partial<Cliente>) => Promise<Cliente | null>;
  actualizarCliente: (codigo: string, cliente: Partial<Cliente>) => Promise<boolean>;
  eliminarCliente: (codigo: string) => Promise<boolean>;

  // Operaciones Artículos
  crearArticulo: (articulo: Partial<Articulo>) => Promise<Articulo | null>;
  actualizarArticulo: (referencia: number, articulo: Partial<Articulo>) => Promise<boolean>;
  eliminarArticulo: (referencia: number) => Promise<boolean>;

  // Operaciones Comerciales
  crearComercial: (comercial: Omit<Comercial, 'id' | 'created_at'>) => Promise<Comercial | null>;
  actualizarComercial: (id: string, comercial: Partial<Comercial>) => Promise<boolean>;
  eliminarComercial: (id: string) => Promise<boolean>;

  // Utilidades
  recargarDatos: () => Promise<void>;
  resetearDatosDemo: () => void;
  sembrarDatosEnSupabase: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Normalizadores para las columnas de Supabase
// (admiten tanto nombres originales con acentos/espacios como nombres en minúsculas)
function normalizeCliente(row: Record<string, unknown>): Cliente {
  const codigo = String(row.codigo || row.Codigo || row.id || '').trim();
  const nombre = String(row.Cliente || row.cliente || row.nombre_empresa || row.nombre || codigo);
  const contacto = String(row.Contacto || row.contacto || row.persona_contacto || '');
  const cargo = String(row.Cargo || row.cargo || '');
  const direccion = String(row.Dirección || row.Direccion || row.direccion || '');
  const ciudad = String(row.Ciudad || row.ciudad || row.poblacion || '');
  const codPost = String(row.CodPost || row.codpost || row.codigo_postal || '');
  const pais = String(row.País || row.Pais || row.pais || '');
  const telefono = String(row.Teléfono || row.Telefono || row.telefono || '');
  const comercialAsignadoId = (row.comercial_asignado_id as string) || null;

  return {
    codigo,
    id: codigo,
    nombre_empresa: nombre,
    persona_contacto: contacto,
    cargo,
    direccion,
    ciudad,
    poblacion: ciudad,
    codigo_postal: codPost,
    pais,
    telefono,
    cif: codigo.toUpperCase(),
    sector: cargo || pais || 'Distribución y Comercio',
    email: (row.email as string) || `contacto@${nombre.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    notas: row.notas as string | undefined,
    comercial_asignado_id: comercialAsignadoId,
    Cliente: nombre,
    Contacto: contacto,
    Cargo: cargo,
    Dirección: direccion,
    Ciudad: ciudad,
    CodPost: codPost,
    País: pais,
    Teléfono: telefono,
  };
}

function normalizeArticulo(row: Record<string, unknown>): Articulo {
  const ref = parseInt(String(row.Referencia || row.referencia || row.id || '0'), 10);
  const prod = String(row.Producto || row.producto || `Artículo ${ref}`);
  const prov = String(row.Proveedor || row.proveedor || '');
  const fam = String(row.Familia || row.familia || 'General');
  const stock = parseInt(String(row.Stock || row.stock || '0'), 10);
  const stockMin = parseInt(String(row['Stock Min'] || row.stock_min || '0'), 10);
  const precioCoste = parseSpanishNumber(row['Precio Coste'] || row.precio_coste || 0);
  const fechaInv = String(row['Fecha Invent'] || row.fecha_invent || '');

  return {
    referencia: ref,
    producto: prod,
    proveedor: prov,
    familia: fam,
    stock,
    stock_min: stockMin,
    precio_coste: precioCoste,
    fecha_invent: fechaInv,
    bajo_minimo: stock <= stockMin,
    Referencia: ref,
    Producto: prod,
    Proveedor: prov,
    Familia: fam,
    Stock: stock,
    'Precio Coste': precioCoste,
    'Stock Min': stockMin,
    'Fecha Invent': fechaInv,
  };
}

function normalizeVenta(row: Record<string, unknown>, index: number): Venta {
  const nPed = parseFloat(String(row['nº peddo'] || row.n_pedido || row.pedido || index + 1));
  const idCli = String(row.id_cliente || row.cliente_id || '').trim();
  const cliNom = String(row.cliente || row.cliente_nombre || '');
  const vend = String(row.Vendedor || row.vendedor || '');
  const ref = parseInt(String(row.referencia || row.referencia_articulo || '0'), 10);
  const pvp = parseSpanishNumber(row.PVP || row.pvp || 0);
  const cant = parseInt(String(row.Cantidad || row.cantidad || '1'), 10);
  const cia = String(row['Cía Envío'] || row.cia_envio || '');
  const imp = parseSpanishNumber(row.Importe || row.importe || pvp * cant);
  const fecha = String(row.Fecha || row.fecha || '');

  return {
    id: `v_${nPed}_${ref}_${index}`,
    n_pedido: nPed,
    fecha,
    cliente_nombre: cliNom,
    id_cliente: idCli,
    vendedor: vend,
    referencia_articulo: ref,
    pvp,
    cantidad: cant,
    cia_envio: cia,
    importe: imp,
    Fecha: fecha,
    'nº peddo': nPed,
    cliente_raw: cliNom,
    Vendedor: vend,
    referencia: ref,
    PVP: pvp,
    Cantidad: cant,
    'Cía Envío': cia,
    Importe: imp,
  };
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comerciales, setComerciales] = useState<Comercial[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [needToRunSchemaSql, setNeedToRunSchemaSql] = useState<boolean>(false);
  const [isDatabaseEmpty, setIsDatabaseEmpty] = useState<boolean>(false);
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

  // Cargar datos locales de respaldo
  const cargarDatosLocales = useCallback(() => {
    const storedComerciales = localStorage.getItem('DEMO_COMERCIALES_V2');
    const storedClientes = localStorage.getItem('DEMO_CLIENTES_V2');
    const storedArticulos = localStorage.getItem('DEMO_ARTICULOS_V2');
    const storedVentas = localStorage.getItem('DEMO_VENTAS_V2');
    const storedVisitas = localStorage.getItem('DEMO_VISITAS_V2');

    const com = storedComerciales ? JSON.parse(storedComerciales) : INITIAL_COMERCIALES;
    const cli = storedClientes ? JSON.parse(storedClientes) : INITIAL_IMPORTED_CLIENTES;
    const art = storedArticulos ? JSON.parse(storedArticulos) : INITIAL_IMPORTED_ARTICULOS;
    const ven = storedVentas ? JSON.parse(storedVentas) : INITIAL_IMPORTED_VENTAS;
    const vis = storedVisitas ? JSON.parse(storedVisitas) : generateVisitasForImportedClientes();

    setComerciales(com);
    setClientes(cli);
    setArticulos(art);
    setVentas(ven);
    setVisitas(vis);

    if (!storedComerciales) localStorage.setItem('DEMO_COMERCIALES_V2', JSON.stringify(com));
    if (!storedClientes) localStorage.setItem('DEMO_CLIENTES_V2', JSON.stringify(cli));
    if (!storedArticulos) localStorage.setItem('DEMO_ARTICULOS_V2', JSON.stringify(art));
    if (!storedVentas) localStorage.setItem('DEMO_VENTAS_V2', JSON.stringify(ven));
    if (!storedVisitas) localStorage.setItem('DEMO_VISITAS_V2', JSON.stringify(vis));
  }, []);

  // Recargar datos desde Supabase con manejo tolerante de tablas
  const recargarDatos = useCallback(async () => {
    setLoading(true);
    if (!isSupabaseConfigured || !supabase) {
      cargarDatosLocales();
      setLoading(false);
      return;
    }

    try {
      // 1. Clientes (nueva tabla importada)
      let loadedClientes = INITIAL_IMPORTED_CLIENTES;
      const { data: cliData, error: cliError } = await supabase.from('clientes').select('*');
      if (cliError) {
        console.warn('Tabla clientes no disponible en Supabase:', cliError.message);
      } else if (cliData && cliData.length > 0) {
        loadedClientes = cliData.map((row) => normalizeCliente(row as Record<string, unknown>));
      }

      // 2. Artículos (nueva tabla importada)
      let loadedArticulos = INITIAL_IMPORTED_ARTICULOS;
      const { data: artData, error: artError } = await supabase.from('articulos').select('*');
      if (artError) {
        console.warn('Tabla articulos no disponible en Supabase:', artError.message);
      } else if (artData && artData.length > 0) {
        loadedArticulos = artData.map((row) => normalizeArticulo(row as Record<string, unknown>));
      }

      // 3. Ventas (nueva tabla importada)
      let loadedVentas = INITIAL_IMPORTED_VENTAS;
      const { data: venData, error: venError } = await supabase.from('ventas').select('*');
      if (venError) {
        console.warn('Tabla ventas no disponible en Supabase:', venError.message);
      } else if (venData && venData.length > 0) {
        loadedVentas = venData.map((row, idx) => normalizeVenta(row as Record<string, unknown>, idx));
      }

      // 4. Comerciales
      let loadedComerciales = INITIAL_COMERCIALES;
      const { data: comData, error: comError } = await supabase.from('comerciales').select('*');
      if (comError) {
        console.warn('Tabla comerciales no disponible en Supabase:', comError.message);
      } else if (comData && comData.length > 0) {
        loadedComerciales = comData as Comercial[];
      }

      // 5. Visitas
      let loadedVisitas = generateVisitasForImportedClientes();
      const { data: visData, error: visError } = await supabase
        .from('visitas')
        .select('*')
        .order('fecha_inicio', { ascending: true });
      if (visError) {
        console.warn('Tabla visitas no disponible en Supabase:', visError.message);
        if (visError.code === '42P01' || visError.message?.includes('does not exist')) {
          setNeedToRunSchemaSql(true);
        }
      } else {
        setNeedToRunSchemaSql(false);
        if (visData && visData.length > 0) {
          loadedVisitas = visData as Visita[];
        }
      }

      const empty = loadedClientes.length === 0 && loadedArticulos.length === 0 && loadedVentas.length === 0;
      setIsDatabaseEmpty(empty);

      setClientes(loadedClientes);
      setArticulos(loadedArticulos);
      setVentas(loadedVentas);
      setComerciales(loadedComerciales);
      setVisitas(loadedVisitas);

      addToast(
        'exito',
        'Tablas sincronizadas con Supabase',
        `${loadedClientes.length} clientes, ${loadedArticulos.length} artículos y ${loadedVentas.length} ventas cargadas.`
      );
    } catch (err: unknown) {
      console.warn('Fallo al conectar con Supabase, usando almacenamiento local:', err);
      const errMsg = err instanceof Error ? err.message : 'Error desconocido';
      addToast('aviso', 'Modo de respaldo activo', `Error al consultar Supabase (${errMsg}).`);
      cargarDatosLocales();
    } finally {
      setLoading(false);
    }
  }, [cargarDatosLocales, addToast]);

  const sembrarDatosEnSupabase = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      addToast('aviso', 'Supabase no configurado', 'Introduce tus credenciales en Ajustes Supabase.');
      return;
    }
    setLoading(true);
    try {
      // 1. Sembrar comerciales si no existen
      const { error: comErr } = await supabase.from('comerciales').upsert(INITIAL_COMERCIALES, { onConflict: 'id' });
      if (comErr) console.warn('Comerciales error:', comErr.message);

      // 2. Sembrar visitas de ejemplo
      const visitasToSeed = generateVisitasForImportedClientes();
      const { error: visErr } = await supabase.from('visitas').upsert(visitasToSeed, { onConflict: 'id' });
      if (visErr) console.warn('Visitas error:', visErr.message);

      await recargarDatos();
      addToast('exito', 'Datos sembrados', 'Comerciales y visitas de ejemplo se han sincronizado con Supabase.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      addToast('error', 'Error al sembrar', msg);
    } finally {
      setLoading(false);
    }
  }, [recargarDatos, addToast]);

  useEffect(() => {
    recargarDatos();
  }, [recargarDatos]);

  const resetearDatosDemo = useCallback(() => {
    localStorage.removeItem('DEMO_COMERCIALES_V2');
    localStorage.removeItem('DEMO_CLIENTES_V2');
    localStorage.removeItem('DEMO_ARTICULOS_V2');
    localStorage.removeItem('DEMO_VENTAS_V2');
    localStorage.removeItem('DEMO_VISITAS_V2');
    cargarDatosLocales();
    addToast('info', 'Datos restablecidos', 'Se han restablecido los datos de clientes, artículos y ventas.');
  }, [cargarDatosLocales, addToast]);

  // Guardar localmente
  const guardarLocalmente = useCallback(
    (nuevosCli?: Cliente[], nuevosArt?: Articulo[], nuevasVis?: Visita[], nuevosCom?: Comercial[]) => {
      if (nuevosCli) localStorage.setItem('DEMO_CLIENTES_V2', JSON.stringify(nuevosCli));
      if (nuevosArt) localStorage.setItem('DEMO_ARTICULOS_V2', JSON.stringify(nuevosArt));
      if (nuevasVis) localStorage.setItem('DEMO_VISITAS_V2', JSON.stringify(nuevasVis));
      if (nuevosCom) localStorage.setItem('DEMO_COMERCIALES_V2', JSON.stringify(nuevosCom));
    },
    []
  );

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
        addToast('exito', 'Visita programada', 'Se ha agendado la visita correctamente.');
        return insertada;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error en Supabase';
        addToast('error', 'Error al crear visita', msg);
        // Fallback local
        const actualizadas = [...visitas, nueva];
        setVisitas(actualizadas);
        guardarLocalmente(undefined, undefined, actualizadas);
        return nueva;
      }
    } else {
      const actualizadas = [...visitas, nueva];
      setVisitas(actualizadas);
      guardarLocalmente(undefined, undefined, actualizadas);
      addToast('exito', 'Visita programada', 'Se ha agendado la visita correctamente.');
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
        const msg = err instanceof Error ? err.message : 'Error al sincronizar';
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
        const msg = err instanceof Error ? err.message : 'Error al eliminar';
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
  const crearCliente = async (clienteData: Partial<Cliente>): Promise<Cliente | null> => {
    const nextNum = clientes.length + 1;
    const codigo = clienteData.codigo?.trim() || `c${nextNum}`;
    const nuevo: Cliente = {
      codigo,
      id: codigo,
      nombre_empresa: clienteData.nombre_empresa || clienteData.Cliente || `Cliente ${codigo}`,
      persona_contacto: clienteData.persona_contacto || clienteData.Contacto || '',
      cargo: clienteData.cargo || clienteData.Cargo || '',
      direccion: clienteData.direccion || clienteData.Dirección || '',
      ciudad: clienteData.ciudad || clienteData.Ciudad || '',
      poblacion: clienteData.ciudad || clienteData.Ciudad || '',
      codigo_postal: clienteData.codigo_postal || clienteData.CodPost || '',
      pais: clienteData.pais || clienteData.País || 'España',
      telefono: clienteData.telefono || clienteData.Teléfono || '',
      cif: codigo.toUpperCase(),
      sector: clienteData.sector || 'Comercio',
      comercial_asignado_id: clienteData.comercial_asignado_id || null,
      Cliente: clienteData.nombre_empresa || clienteData.Cliente,
      Contacto: clienteData.persona_contacto || clienteData.Contacto,
      Cargo: clienteData.cargo || clienteData.Cargo,
      Dirección: clienteData.direccion || clienteData.Dirección,
      Ciudad: clienteData.ciudad || clienteData.Ciudad,
      CodPost: clienteData.codigo_postal || clienteData.CodPost,
      País: clienteData.pais || clienteData.País,
      Teléfono: clienteData.telefono || clienteData.Teléfono,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          codigo: nuevo.codigo,
          Cliente: nuevo.nombre_empresa,
          Contacto: nuevo.persona_contacto,
          Cargo: nuevo.cargo,
          Dirección: nuevo.direccion,
          Ciudad: nuevo.ciudad,
          CodPost: nuevo.codigo_postal,
          País: nuevo.pais,
          Teléfono: nuevo.telefono,
        };
        const { error } = await supabase.from('clientes').insert([payload]);
        if (error) throw error;
        setClientes((prev) => [...prev, nuevo]);
        addToast('exito', 'Cliente registrado', `${nuevo.nombre_empresa} añadido a Supabase.`);
        return nuevo;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al guardar cliente';
        addToast('error', 'Error en Supabase', msg);
        const actualizados = [...clientes, nuevo];
        setClientes(actualizados);
        guardarLocalmente(actualizados);
        return nuevo;
      }
    } else {
      const actualizados = [...clientes, nuevo];
      setClientes(actualizados);
      guardarLocalmente(actualizados);
      addToast('exito', 'Cliente registrado', `${nuevo.nombre_empresa} añadido.`);
      return nuevo;
    }
  };

  const actualizarCliente = async (codigo: string, updates: Partial<Cliente>): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const payload: Record<string, unknown> = {};
        if (updates.nombre_empresa) payload.Cliente = updates.nombre_empresa;
        if (updates.persona_contacto) payload.Contacto = updates.persona_contacto;
        if (updates.cargo) payload.Cargo = updates.cargo;
        if (updates.direccion) payload.Dirección = updates.direccion;
        if (updates.ciudad) payload.Ciudad = updates.ciudad;
        if (updates.codigo_postal) payload.CodPost = updates.codigo_postal;
        if (updates.pais) payload.País = updates.pais;
        if (updates.telefono) payload.Teléfono = updates.telefono;

        const { error } = await supabase.from('clientes').update(payload).eq('codigo', codigo);
        if (error) throw error;

        setClientes((prev) =>
          prev.map((c) => (c.codigo === codigo ? { ...c, ...updates, ...payload } : c))
        );
        addToast('exito', 'Cliente actualizado', 'Datos sincronizados en Supabase.');
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al actualizar';
        addToast('error', 'Error en Supabase', msg);
        return false;
      }
    } else {
      const actualizados = clientes.map((c) => (c.codigo === codigo ? { ...c, ...updates } : c));
      setClientes(actualizados);
      guardarLocalmente(actualizados);
      addToast('exito', 'Cliente actualizado', 'Datos actualizados localmente.');
      return true;
    }
  };

  const eliminarCliente = async (codigo: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('clientes').delete().eq('codigo', codigo);
        if (error) throw error;
        setClientes((prev) => prev.filter((c) => c.codigo !== codigo));
        setVisitas((prev) => prev.filter((v) => v.cliente_id !== codigo));
        addToast('exito', 'Cliente eliminado', 'Registro borrado de Supabase.');
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al eliminar';
        addToast('error', 'No se pudo eliminar de Supabase', msg);
        return false;
      }
    } else {
      const actualizados = clientes.filter((c) => c.codigo !== codigo);
      setClientes(actualizados);
      guardarLocalmente(actualizados);
      addToast('exito', 'Cliente eliminado', 'Cliente borrado.');
      return true;
    }
  };

  // --- CRUD ARTÍCULOS ---
  const crearArticulo = async (artData: Partial<Articulo>): Promise<Articulo | null> => {
    const ref = artData.referencia || Math.max(...articulos.map((a) => a.referencia), 0) + 1;
    const nuevo: Articulo = {
      referencia: ref,
      producto: artData.producto || `Producto ${ref}`,
      proveedor: artData.proveedor || '',
      familia: artData.familia || 'General',
      stock: artData.stock || 0,
      precio_coste: artData.precio_coste || 0,
      stock_min: artData.stock_min || 10,
      fecha_invent: artData.fecha_invent || new Date().toLocaleDateString('es-ES'),
      bajo_minimo: (artData.stock || 0) <= (artData.stock_min || 10),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          Referencia: nuevo.referencia,
          Producto: nuevo.producto,
          Proveedor: nuevo.proveedor,
          Familia: nuevo.familia,
          Stock: nuevo.stock,
          'Precio Coste': nuevo.precio_coste.toString().replace('.', ','),
          'Stock Min': nuevo.stock_min,
          'Fecha Invent': nuevo.fecha_invent,
        };
        const { error } = await supabase.from('articulos').insert([payload]);
        if (error) throw error;
        setArticulos((prev) => [...prev, nuevo]);
        addToast('exito', 'Artículo creado', `${nuevo.producto} guardado en catálogo.`);
        return nuevo;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al guardar';
        addToast('error', 'Error en Supabase', msg);
        const actualizados = [...articulos, nuevo];
        setArticulos(actualizados);
        guardarLocalmente(undefined, actualizados);
        return nuevo;
      }
    } else {
      const actualizados = [...articulos, nuevo];
      setArticulos(actualizados);
      guardarLocalmente(undefined, actualizados);
      addToast('exito', 'Artículo creado', `${nuevo.producto} guardado.`);
      return nuevo;
    }
  };

  const actualizarArticulo = async (ref: number, updates: Partial<Articulo>): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const payload: Record<string, unknown> = {};
        if (updates.producto) payload.Producto = updates.producto;
        if (updates.proveedor) payload.Proveedor = updates.proveedor;
        if (updates.familia) payload.Familia = updates.familia;
        if (updates.stock !== undefined) payload.Stock = updates.stock;
        if (updates.stock_min !== undefined) payload['Stock Min'] = updates.stock_min;
        if (updates.precio_coste !== undefined) {
          payload['Precio Coste'] = updates.precio_coste.toString().replace('.', ',');
        }

        const { error } = await supabase.from('articulos').update(payload).eq('Referencia', ref);
        if (error) throw error;

        setArticulos((prev) =>
          prev.map((a) => (a.referencia === ref ? { ...a, ...updates } : a))
        );
        addToast('exito', 'Artículo actualizado', 'Stock y precios guardados.');
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al actualizar';
        addToast('error', 'Error en Supabase', msg);
        return false;
      }
    } else {
      const actualizados = articulos.map((a) => (a.referencia === ref ? { ...a, ...updates } : a));
      setArticulos(actualizados);
      guardarLocalmente(undefined, actualizados);
      addToast('exito', 'Artículo actualizado', 'Cambios guardados.');
      return true;
    }
  };

  const eliminarArticulo = async (ref: number): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('articulos').delete().eq('Referencia', ref);
        if (error) throw error;
        setArticulos((prev) => prev.filter((a) => a.referencia !== ref));
        addToast('exito', 'Artículo eliminado', 'Eliminado de la base de datos.');
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al eliminar';
        addToast('error', 'Error al eliminar artículo', msg);
        return false;
      }
    } else {
      const actualizados = articulos.filter((a) => a.referencia !== ref);
      setArticulos(actualizados);
      guardarLocalmente(undefined, actualizados);
      addToast('exito', 'Artículo eliminado', 'Artículo eliminado.');
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
        const insertado = (data as Comercial) || nuevo;
        setComerciales((prev) => [...prev, insertado]);
        addToast('exito', 'Comercial añadido', `${insertado.nombre} registrado.`);
        return insertado;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al crear comercial';
        addToast('error', 'Error en Supabase', msg);
        const actualizados = [...comerciales, nuevo];
        setComerciales(actualizados);
        guardarLocalmente(undefined, undefined, undefined, actualizados);
        return nuevo;
      }
    } else {
      const actualizados = [...comerciales, nuevo];
      setComerciales(actualizados);
      guardarLocalmente(undefined, undefined, undefined, actualizados);
      addToast('exito', 'Comercial añadido', `${nuevo.nombre} registrado.`);
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
        addToast('error', 'Error en Supabase', msg);
        return false;
      }
    } else {
      const actualizados = comerciales.map((c) => (c.id === id ? { ...c, ...updates } : c));
      setComerciales(actualizados);
      guardarLocalmente(undefined, undefined, undefined, actualizados);
      addToast('exito', 'Comercial actualizado', 'Cambios guardados.');
      return true;
    }
  };

  const eliminarComercial = async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('comerciales').delete().eq('id', id);
        if (error) throw error;
        setComerciales((prev) => prev.filter((c) => c.id !== id));
        addToast('exito', 'Comercial eliminado', 'El comercial ha sido eliminado.');
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al eliminar';
        addToast('error', 'No se pudo eliminar el comercial', msg);
        return false;
      }
    } else {
      const actualizados = comerciales.filter((c) => c.id !== id);
      setComerciales(actualizados);
      guardarLocalmente(undefined, undefined, undefined, actualizados);
      addToast('exito', 'Comercial eliminado', 'El comercial ha sido eliminado.');
      return true;
    }
  };

  // Poblado de relaciones
  const clientesConDetalle = useMemo(() => {
    const comMap = new Map(comerciales.map((c) => [c.id, c]));
    return clientes.map((cli) => ({
      ...cli,
      comercial_asignado: cli.comercial_asignado_id ? comMap.get(cli.comercial_asignado_id) : undefined,
    }));
  }, [clientes, comerciales]);

  const visitasConDetalle = useMemo(() => {
    const comMap = new Map(comerciales.map((c) => [c.id, c]));
    const cliMap = new Map<string, Cliente>();
    clientes.forEach((cl) => {
      if (cl.codigo) cliMap.set(cl.codigo, cl);
      cliMap.set(cl.id, cl);
    });

    return visitas.map((v) => ({
      ...v,
      cliente: cliMap.get(v.cliente_id),
      comercial: comMap.get(v.comercial_id),
    }));
  }, [visitas, clientes, comerciales]);

  const ventasConDetalle = useMemo(() => {
    const cliMap = new Map<string, Cliente>();
    clientes.forEach((cl) => {
      if (cl.codigo) cliMap.set(cl.codigo, cl);
      cliMap.set(cl.id, cl);
    });
    const artMap = new Map(articulos.map((a) => [a.referencia, a]));

    return ventas.map((v) => ({
      ...v,
      cliente: cliMap.get(v.id_cliente),
      articulo: artMap.get(v.referencia_articulo),
    }));
  }, [ventas, clientes, articulos]);

  return (
    <DataContext.Provider
      value={{
        comerciales,
        clientes,
        articulos,
        ventas,
        visitas,
        visitasConDetalle,
        clientesConDetalle,
        ventasConDetalle,
        loading,
        isLiveSupabase: isSupabaseConfigured && Boolean(supabase),
        supabaseUrl,
        needToRunSchemaSql,
        isDatabaseEmpty,
        toasts,
        addToast,
        removeToast,
        crearVisita,
        actualizarVisita,
        eliminarVisita,
        crearCliente,
        actualizarCliente,
        eliminarCliente,
        crearArticulo,
        actualizarArticulo,
        eliminarArticulo,
        crearComercial,
        actualizarComercial,
        eliminarComercial,
        recargarDatos,
        resetearDatosDemo,
        sembrarDatosEnSupabase,
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
