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

export interface Cliente {
  id: string;
  nombre_empresa: string;
  cif: string;
  persona_contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  poblacion: string;
  provincia: string;
  codigo_postal: string;
  sector: string;
  notas?: string;
  comercial_asignado_id: string | null;
  created_at?: string;
  // Relación poblada
  comercial_asignado?: Comercial;
}

export interface Visita {
  id: string;
  cliente_id: string;
  comercial_id: string;
  fecha_inicio: string; // ISO 8601 timestamptz
  fecha_fin: string;    // ISO 8601 timestamptz
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
