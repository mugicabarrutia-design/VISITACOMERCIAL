export type TipoVisita = 'presentación' | 'seguimiento' | 'cierre' | 'incidencia' | 'postventa';

export type EstadoVisita = 'programada' | 'realizada' | 'cancelada' | 'aplazada';

export interface Comercial {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  zona: string;
  color: string;
  activo: boolean;
  created_at?: string;
}

/**
 * Tabla: clientes (Nueva estructura importada en Supabase)
 * Campos en base de datos:
 * - codigo (PK, e.g. "c1", "c10", "c36")
 * - Cliente (Nombre de la empresa o comercio)
 * - Contacto (Persona de contacto)
 * - Cargo (Cargo de la persona de contacto)
 * - Dirección
 * - Ciudad
 * - CodPost
 * - País
 * - Teléfono
 */
export interface Cliente {
  // Identificador principal
  codigo?: string;
  id: string; // Alias para compatibilidad = codigo

  // Datos de empresa y contacto
  nombre_empresa: string; // Alias = Cliente
  persona_contacto: string; // Alias = Contacto
  cargo?: string;
  telefono: string;
  direccion: string;
  ciudad?: string;
  poblacion: string; // Alias = ciudad
  provincia?: string;
  codigo_postal: string; // Alias = CodPost
  pais?: string;
  cif?: string; // e.g. "CIF-" + codigo
  sector?: string;
  email?: string;
  notas?: string;

  // Comercial asignado
  comercial_asignado_id?: string | null;
  comercial_asignado?: Comercial;
  created_at?: string;

  // Propiedades crudas originales de Supabase
  Cliente?: string;
  Contacto?: string;
  Cargo?: string;
  Dirección?: string;
  Ciudad?: string;
  CodPost?: string;
  País?: string;
  Teléfono?: string;
}

/**
 * Tabla: articulos (Nueva estructura importada en Supabase)
 * Campos en base de datos:
 * - Referencia (PK)
 * - Proveedor
 * - Producto
 * - Familia
 * - Stock
 * - Precio Coste (text, ej. "31,68")
 * - Stock Min
 * - Fecha Invent
 */
export interface Articulo {
  referencia: number;
  proveedor: string;
  producto: string;
  familia: string;
  stock: number;
  precio_coste: number;
  stock_min: number;
  fecha_invent?: string;
  bajo_minimo?: boolean;

  // Propiedades crudas originales
  Referencia?: number;
  Proveedor?: string;
  Producto?: string;
  Familia?: string;
  Stock?: number;
  'Precio Coste'?: string | number;
  'Stock Min'?: number;
  'Fecha Invent'?: string;
}

/**
 * Tabla: ventas (Nueva estructura importada en Supabase)
 * Campos en base de datos:
 * - Fecha
 * - nº peddo (float8)
 * - cliente (nombre del cliente)
 * - id_cliente (código del cliente, e.g. "c45", "c36")
 * - Vendedor
 * - referencia (código del artículo)
 * - PVP (text, ej. "39,08")
 * - Cantidad (int8)
 * - Cía Envío
 * - Importe (text, ej. "977,00" o "1.152,40")
 */
export interface Venta {
  id: string; // único para UI (e.g. `${n_pedido}_${referencia}`)
  n_pedido: number;
  fecha: string;
  cliente_nombre: string;
  id_cliente: string; // Vincula con Cliente.codigo
  vendedor: string;
  referencia_articulo: number;
  pvp: number;
  cantidad: number;
  cia_envio: string;
  importe: number;

  // Relaciones pobladas
  cliente?: Cliente;
  articulo?: Articulo;

  // Propiedades crudas originales
  Fecha?: string;
  'nº peddo'?: number;
  cliente_raw?: string;
  Vendedor?: string;
  referencia?: number;
  PVP?: string | number;
  Cantidad?: number;
  'Cía Envío'?: string;
  Importe?: string | number;
}

/**
 * Tabla: visitas
 */
export interface Visita {
  id: string;
  cliente_id: string; // Vincula con Cliente.codigo (ej. "c1", "c23", "c36")
  comercial_id: string;
  fecha_inicio: string; // ISO timestamptz
  fecha_fin: string;    // ISO timestamptz
  tipo: TipoVisita;
  estado: EstadoVisita;
  objetivo: string;
  resultado?: string;
  importe_estimado?: number;
  proxima_accion?: string;
  notas?: string;
  created_at?: string;

  // Relaciones pobladas
  cliente?: Cliente;
  comercial?: Comercial;
}

export interface ToastMessage {
  id: string;
  tipo: 'exito' | 'error' | 'info' | 'aviso';
  mensaje: string;
  detalles?: string;
}

export interface FiltrosVisita {
  comercialIds: string[];
  estados: EstadoVisita[];
  tipos: TipoVisita[];
  busqueda?: string;
  clienteId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}
