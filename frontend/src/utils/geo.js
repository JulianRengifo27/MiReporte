// ===== Utilidades geográficas =====

// Distancia en metros entre dos puntos (fórmula de Haversine)
export function distanciaMetros(a, b) {
  const R = 6371000; // radio de la Tierra en metros
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Texto amigable para una distancia: "350 m" o "1,2 km"
export function formatoDistancia(m) {
  if (m == null) return '';
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

// Texto amigable para la hora: "hace 5 min", "hace 2 h"
export function formatoHace(iso) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  return `hace ${h} h`;
}

export function formatoHora(iso) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
}

// Crea un polígono GeoJSON con forma de círculo (para las áreas de riesgo)
export function circuloGeoJSON(centro, radioM, puntos = 48) {
  const coords = [];
  const dLat = radioM / 111320;
  const dLng = radioM / (111320 * Math.cos((centro.lat * Math.PI) / 180));
  for (let i = 0; i <= puntos; i++) {
    const ang = (i / puntos) * 2 * Math.PI;
    coords.push([centro.lng + dLng * Math.cos(ang), centro.lat + dLat * Math.sin(ang)]);
  }
  return { type: 'Polygon', coordinates: [coords] };
}

// Link externo a Google Maps con la ruta desde el usuario hasta cerca del evento
// (Google calcula automáticamente rutas alternativas).
export function linkRutaAlternativa(origen, destino) {
  const p = new URLSearchParams({ api: '1', travelmode: 'driving', destination: `${destino.lat},${destino.lng}` });
  if (origen) p.set('origin', `${origen.lat},${origen.lng}`);
  return `https://www.google.com/maps/dir/?${p.toString()}`;
}
