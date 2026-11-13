// ===== Rutas seguras con OSRM (opción B del RF04) =====
// OSRM es un motor de rutas gratuito basado en OpenStreetMap.
// 1) Pedimos a OSRM varias rutas entre el usuario y el destino.
// 2) Revisamos cuáles pasan por zonas de emergencia activas.
// 3) Si todas pasan por alguna, pedimos rutas extra "rodeando" la emergencia con un punto intermedio.
// 4) Elegimos la que evite más emergencias y, si empatan, la más corta.
import { distanciaMetros } from './geo.js';

// Servidor público de demostración de OSRM. Para producción conviene uno propio (variable VITE_OSRM_URL).
const OSRM_URL = (import.meta.env?.VITE_OSRM_URL || 'https://router.project-osrm.org').replace(/\/$/, '');

// Distancia mínima (m) que se considera "pasar por" una emergencia sin área (accidente, trancón...)
const RADIO_MINIMO_M = 120;

// Zonas que hay que evitar: emergencias activas o en atención que bloquean vía o tienen área de riesgo
export function zonasAEvitar(emergencias) {
  return emergencias
    .filter((e) => e.estado !== 'resuelta' && (e.via_bloqueada || e.radio_m > 0))
    .map((e) => ({ id: e.id, tipo: e.tipo, lat: e.lat, lng: e.lng, radio: Math.max(e.radio_m || 0, RADIO_MINIMO_M) }));
}

async function pedirOSRM(puntos, alternativas) {
  const coords = puntos.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
  const params = new URLSearchParams({ overview: 'full', geometries: 'geojson', alternatives: alternativas ? '3' : 'false' });
  const resp = await fetch(`${OSRM_URL}/route/v1/driving/${coords}?${params}`, { signal: AbortSignal.timeout(10000) });
  if (!resp.ok) throw new Error('El servicio de rutas no respondió. Intenta de nuevo en un momento.');
  const datos = await resp.json();
  if (datos.code !== 'Ok') throw new Error('No se encontró una ruta por carretera hasta ese punto.');
  return datos.routes;
}

// Distancia (m) de un punto a un segmento, en una proyección plana local (suficiente en una ciudad)
function distanciaPuntoSegmento(p, a, b) {
  const kx = 111320 * Math.cos((p.lat * Math.PI) / 180), ky = 110540;
  const ax = (a[0] - p.lng) * kx, ay = (a[1] - p.lat) * ky;
  const bx = (b[0] - p.lng) * kx, by = (b[1] - p.lat) * ky;
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l2)) : 0;
  return Math.hypot(ax + t * dx, ay + t * dy);
}

// ¿Qué zonas atraviesa una ruta?
function zonasCruzadas(geometria, zonas) {
  const c = geometria.coordinates;
  return zonas.filter((z) => {
    for (let i = 1; i < c.length; i++) {
      if (distanciaPuntoSegmento(z, c[i - 1], c[i]) <= z.radio) return true;
    }
    return false;
  });
}

// Punto a "distancia" metros de la zona, hacia un lado de la línea origen→destino (para rodearla)
function puntoDeRodeo(origen, destino, zona, lado) {
  const kx = 111320 * Math.cos((zona.lat * Math.PI) / 180), ky = 110540;
  const vx = (destino.lng - origen.lng) * kx, vy = (destino.lat - origen.lat) * ky;
  const largo = Math.hypot(vx, vy) || 1;
  const px = (-vy / largo) * lado, py = (vx / largo) * lado; // perpendicular
  const d = zona.radio * 2.5 + 250;
  return { lat: zona.lat + (py * d) / ky, lng: zona.lng + (px * d) / kx };
}

const conZonas = (r, zonas) => ({ ...r, cruza: zonasCruzadas(r.geometry, zonas) });

export async function calcularRutaSegura(origen, destino, emergencias) {
  if (distanciaMetros(origen, destino) < 50) throw new Error('El destino está demasiado cerca de tu ubicación.');
  const zonas = zonasAEvitar(emergencias);

  let rutas = (await pedirOSRM([origen, destino], true)).map((r) => conZonas(r, zonas));

  // Si todas las rutas pasan por alguna emergencia, probamos rodearla por ambos lados
  if (rutas.every((r) => r.cruza.length > 0)) {
    const zona = rutas[0].cruza[0];
    const extras = await Promise.allSettled([1, -1].map((lado) =>
      pedirOSRM([origen, puntoDeRodeo(origen, destino, zona, lado), destino], false)));
    extras.forEach((x) => { if (x.status === 'fulfilled') rutas.push(conZonas(x.value[0], zonas)); });
  }

  rutas.sort((a, b) => a.cruza.length - b.cruza.length || a.duration - b.duration);
  const [mejor, ...otras] = rutas;
  const directa = rutas.reduce((min, r) => (r.duration < min.duration ? r : min), rutas[0]);

  return {
    mejor,
    otras,
    zonasEvitadas: zonas.filter((z) => rutas.some((r) => r.cruza.includes(z)) && !mejor.cruza.includes(z)),
    minutosExtra: Math.max(0, Math.round((mejor.duration - directa.duration) / 60)),
    linkGoogle: linkGoogleConRuta(origen, destino, mejor.geometry),
  };
}

// Link de Google Maps que sigue aproximadamente la ruta elegida (pasando por 3 puntos intermedios)
function linkGoogleConRuta(origen, destino, geometria) {
  const c = geometria.coordinates;
  const intermedios = [0.25, 0.5, 0.75].map((f) => c[Math.floor(f * (c.length - 1))]).map(([lng, lat]) => `${lat.toFixed(5)},${lng.toFixed(5)}`);
  const p = new URLSearchParams({
    api: '1', travelmode: 'driving',
    origin: `${origen.lat},${origen.lng}`, destination: `${destino.lat},${destino.lng}`,
    waypoints: intermedios.join('|'),
  });
  return `https://www.google.com/maps/dir/?${p}`;
}
