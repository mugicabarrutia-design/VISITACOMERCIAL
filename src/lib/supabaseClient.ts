import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lectura de variables de entorno estándar de Vite
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Permite también configuración dinámica en localStorage para probar sin reiniciar el servidor
const localUrl = typeof window !== 'undefined' ? localStorage.getItem('APP_SUPABASE_URL') : null;
const localKey = typeof window !== 'undefined' ? localStorage.getItem('APP_SUPABASE_ANON_KEY') : null;

export const supabaseUrl = envUrl || localUrl || '';
export const supabaseAnonKey = envAnonKey || localKey || '';

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
export function saveSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('APP_SUPABASE_URL', url.trim());
    localStorage.setItem('APP_SUPABASE_ANON_KEY', anonKey.trim());
    window.location.reload();
  }
}

/**
 * Borra las credenciales locales de Supabase
 */
export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('APP_SUPABASE_URL');
    localStorage.removeItem('APP_SUPABASE_ANON_KEY');
    window.location.reload();
  }
}
