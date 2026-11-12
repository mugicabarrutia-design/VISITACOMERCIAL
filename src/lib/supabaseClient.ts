import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Normaliza la URL de Supabase para asegurarse de que sea la URL base del proyecto
 * (limpiando posibles sufijos como /rest/v1/ o barras finales que provocarían 404)
 */
export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  url = url.replace(/\/rest\/v1\/?$/i, '');
  url = url.replace(/\/+$/, '');
  return url;
}

// Credenciales por defecto proporcionadas por el usuario
const DEFAULT_URL = 'https://gmkgwmmufxrjiwetwfcd.supabase.co';
const DEFAULT_KEY = 'sb_publishable_yr6PzoHMCPr9gu2EqGJSZg_uuj27OP4';

// Lectura de variables de entorno de Vite o localStorage
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const localUrl = typeof window !== 'undefined' ? localStorage.getItem('APP_SUPABASE_URL') : null;
const localKey = typeof window !== 'undefined' ? localStorage.getItem('APP_SUPABASE_ANON_KEY') : null;

// Determinar URL y clave efectivas
const rawUrl = envUrl || localUrl || DEFAULT_URL;
export const supabaseUrl = normalizeSupabaseUrl(rawUrl);
export const supabaseAnonKey = (envAnonKey || localKey || DEFAULT_KEY).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-public-key'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

/**
 * Guarda las credenciales de Supabase en localStorage y recarga la página
 */
export function saveSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    const cleanUrl = normalizeSupabaseUrl(url);
    localStorage.setItem('APP_SUPABASE_URL', cleanUrl);
    localStorage.setItem('APP_SUPABASE_ANON_KEY', key.trim());
    window.location.reload();
  }
}

/**
 * Borra las credenciales locales de Supabase y vuelve a las por defecto
 */
export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('APP_SUPABASE_URL');
    localStorage.removeItem('APP_SUPABASE_ANON_KEY');
    window.location.reload();
  }
}
