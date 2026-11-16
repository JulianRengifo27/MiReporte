// ===== Buscador de direcciones y lugares (geocodificación) =====
// Usa Photon (https://photon.komoot.io): gratuito, sin llave y basado en OpenStreetMap,
// igual que el mapa. Convierte un texto ("Universidad Nacional", "Calle 80 con 68")
// en coordenadas para calcular la ruta segura.
import { distanciaMetros } from './geo.js';

const PHOTON_URL = (import.meta.env?.VITE_GEOCODER_URL || 'https://photon.komoot.io').replace(/\/$/, '');

// Rectángulo aproximado de Colombia: solo se muestran resultados del país
const COLOMBIA = { oeste: -79.1, sur: -4.3, este: -66.8, norte: 13.5 };

// Arma un texto corto y legible para cada resultado
function etiqueta(p) {
  const via = [p.street, p.housenumber].filter(Boolean).join(' # ');
  const titulo = p.name || via || p.locality || p.district || p.city || 'Lugar sin nombre';
  const detalle = [p.name ? via : null, p.locality || p.district, p.city || p.state]
    .filter((x) => x && x !== titulo)
    .filter((x, i, arr) => arr.indexOf(x) === i)
    .join(', ');
  return { titulo, detalle };
}

/**
 * Busca lugares que coincidan con el texto, dando prioridad a los cercanos.
 * @param {string} texto  lo que escribió el usuario
 * @param {{lat:number,lng:number}} cerca  ubicación del usuario (para ordenar por cercanía)
 * @param {AbortSignal} [signal]  para cancelar la búsqueda si el usuario sigue escribiendo
 */
export async function buscarDirecciones(texto, cerca, signal) {
  const q = texto.trim();
  if (q.length < 3) return [];
  const params = new URLSearchParams({
    q,
    limit: '15',
    lat: String(cerca.lat),
    lon: String(cerca.lng),
    bbox: `${COLOMBIA.oeste},${COLOMBIA.sur},${COLOMBIA.este},${COLOMBIA.norte}`,
  });
  let resp;
  try {
    resp = await fetch(`${PHOTON_URL}/api/?${params}`, { signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('No se pudo buscar la dirección. Revisa tu conexión.');
  }
  if (!resp.ok) throw new Error('El buscador de direcciones no respondió. Intenta de nuevo.');
  const datos = await resp.json();
  const vistos = new Set();
  return (datos.features || [])
    .filter((f) => !f.properties.countrycode || f.properties.countrycode === 'CO')
    .map((f) => ({
      ...etiqueta(f.properties),
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }))
    // Quita repetidos (mismo nombre y casi el mismo punto)
    .filter((r) => {
      const clave = `${r.titulo}|${r.lat.toFixed(3)}|${r.lng.toFixed(3)}`;
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    })
    // Los lugares cercanos (a menos de 25 km, más o menos la ciudad) van primero; dentro de cada grupo se respeta
    // el orden de relevancia que da el buscador
    .map((r, i) => ({ ...r, i, cerca: distanciaMetros(cerca, r) <= 25000 }))
    .sort((a, b) => (b.cerca - a.cerca) || (a.i - b.i))
    .slice(0, 6)
    .map(({ i, cerca: _c, ...r }) => r);
}
