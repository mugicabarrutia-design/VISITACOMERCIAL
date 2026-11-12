/**
 * Diccionario de coordenadas para los clientes importados y principales ciudades.
 */
export interface LatLng {
  lat: number;
  lng: number;
}

const CITY_COORDS: Record<string, LatLng> = {
  // Ciudades del dataset de clientes (Northwind importado)
  berlín: { lat: 52.5200, lng: 13.4050 },
  berlin: { lat: 52.5200, lng: 13.4050 },
  tsawassen: { lat: 49.0084, lng: -123.0800 },
  vancouver: { lat: 49.2827, lng: -123.1207 },
  londres: { lat: 51.5074, lng: -0.1278 },
  london: { lat: 51.5074, lng: -0.1278 },
  'buenos aires': { lat: -34.6037, lng: -58.3816 },
  'méxico d.f.': { lat: 19.4326, lng: -99.1332 },
  'mexico d.f.': { lat: 19.4326, lng: -99.1332 },
  berna: { lat: 46.9480, lng: 7.4474 },
  bern: { lat: 46.9480, lng: 7.4474 },
  'são paulo': { lat: -23.5505, lng: -46.6333 },
  'sao paulo': { lat: -23.5505, lng: -46.6333 },
  stuttgart: { lat: 48.7758, lng: 9.1829 },
  aachen: { lat: 50.7753, lng: 6.0839 },
  nantes: { lat: 47.2184, lng: -1.5536 },
  graz: { lat: 47.0707, lng: 15.4395 },
  alcobendas: { lat: 40.5475, lng: -3.6420 },
  madrid: { lat: 40.4168, lng: -3.7038 },
  lille: { lat: 50.6292, lng: 3.0573 },
  bräcke: { lat: 62.7508, lng: 15.4223 },
  bracke: { lat: 62.7508, lng: 15.4223 },
  torino: { lat: 45.0703, lng: 7.6869 },
  turin: { lat: 45.0703, lng: 7.6869 },
  münchen: { lat: 48.1351, lng: 11.5820 },
  munich: { lat: 48.1351, lng: 11.5820 },
  frankfurt: { lat: 50.1109, lng: 8.6821 },
  sevilla: { lat: 37.3891, lng: -5.9845 },
  barcelona: { lat: 41.3851, lng: 2.1734 },
  valencia: { lat: 39.4699, lng: -0.3763 },
  bilbao: { lat: 43.2630, lng: -2.9350 },
  zaragoza: { lat: 41.6488, lng: -0.8891 },
  málaga: { lat: 36.7213, lng: -4.4214 },
  lisboa: { lat: 38.7223, lng: -9.1393 },
  parís: { lat: 48.8566, lng: 2.3522 },
  paris: { lat: 48.8566, lng: 2.3522 },
  roma: { lat: 41.9028, lng: 12.4964 },
  'ámsterdam': { lat: 52.3676, lng: 4.9041 },
  amsterdam: { lat: 52.3676, lng: 4.9041 },
};

const COUNTRY_COORDS: Record<string, LatLng> = {
  alemania: { lat: 51.1657, lng: 10.4515 },
  'reino unido': { lat: 55.3781, lng: -3.4360 },
  canadá: { lat: 56.1304, lng: -106.3468 },
  canada: { lat: 56.1304, lng: -106.3468 },
  argentina: { lat: -38.4161, lng: -63.6167 },
  méxico: { lat: 23.6345, lng: -102.5528 },
  mexico: { lat: 23.6345, lng: -102.5528 },
  suiza: { lat: 46.8182, lng: 8.2275 },
  brasil: { lat: -14.2350, lng: -51.9253 },
  francia: { lat: 46.2276, lng: 2.2137 },
  austria: { lat: 47.5162, lng: 14.5501 },
  españa: { lat: 40.4637, lng: -3.7492 },
  espana: { lat: 40.4637, lng: -3.7492 },
  suecia: { lat: 60.1282, lng: 18.6435 },
  italia: { lat: 41.8719, lng: 12.5674 },
};

/**
 * Obtiene o calcula las coordenadas de un cliente de forma segura.
 */
export function getClienteCoords(cliente: {
  codigo?: string;
  id?: string;
  ciudad?: string;
  poblacion?: string;
  pais?: string;
}): LatLng {
  const ciudad = (cliente.ciudad || cliente.poblacion || '').toLowerCase().trim();
  if (ciudad && CITY_COORDS[ciudad]) {
    // Añadir micro dispersión determinista basada en el código para que los clientes en la misma ciudad no se solapen exactamente
    const offsetSeed = (cliente.codigo || cliente.id || '1').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const latOffset = ((offsetSeed % 11) - 5) * 0.008;
    const lngOffset = (((offsetSeed * 3) % 11) - 5) * 0.008;
    return {
      lat: CITY_COORDS[ciudad].lat + latOffset,
      lng: CITY_COORDS[ciudad].lng + lngOffset,
    };
  }

  const pais = (cliente.pais || '').toLowerCase().trim();
  if (pais && COUNTRY_COORDS[pais]) {
    const offsetSeed = (cliente.codigo || cliente.id || '1').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const latOffset = ((offsetSeed % 17) - 8) * 0.04;
    const lngOffset = (((offsetSeed * 5) % 17) - 8) * 0.04;
    return {
      lat: COUNTRY_COORDS[pais].lat + latOffset,
      lng: COUNTRY_COORDS[pais].lng + lngOffset,
    };
  }

  // Fallback por defecto (España / Europa central)
  const offsetSeed = (cliente.codigo || cliente.id || '1').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return {
    lat: 40.4168 + ((offsetSeed % 13) - 6) * 0.15,
    lng: -3.7038 + (((offsetSeed * 7) % 13) - 6) * 0.15,
  };
}
