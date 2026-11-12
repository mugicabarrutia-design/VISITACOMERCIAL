/**
 * Utilidades para parsear y formatear campos de las tablas importadas en Supabase
 * (maneja formato numérico español "1.152,40" o "31,68" y columnas con espacios)
 */

export function parseSpanishNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    // Quitar espacios
    let clean = val.trim();
    // Reemplazar puntos de miles por nada y comas decimales por puntos: "1.152,40" -> "1152.40"
    if (clean.includes(',') && clean.includes('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export function formatEuro(amount: number): string {
  return amount.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
