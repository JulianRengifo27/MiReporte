// Consultas de eventos. Aquí se decide QUÉ columnas son públicas:
// nunca se devuelve usuario_id ni datos personales (Ley 1581).
import { query } from '../db.js';

// Columnas públicas de un evento (lat/lng se extraen del punto PostGIS)
export const COLUMNAS_PUBLICAS = `
  e.id, e.tipo, e.descripcion, e.foto_url,
  ST_Y(e.ubicacion::geometry) AS lat, ST_X(e.ubicacion::geometry) AS lng,
  e.radio_m, e.estado, e.prioridad, e.origen, e.verificado, e.entidad,
  e.via_bloqueada, e.desvio, e.cantidad_reportes, e.creado_en, e.actualizado_en`;

// Estados que se muestran en el mapa público
const ESTADOS_PUBLICOS = ['activa', 'en_atencion', 'resuelta'];

// Emergencias cerca de un punto, de la más cercana a la más lejana
export async function buscarCercanos({ lat, lng, radio }) {
  const { rows } = await query(
    `SELECT ${COLUMNAS_PUBLICAS},
            ROUND(ST_Distance(e.ubicacion, ST_MakePoint($2, $1)::geography)) AS distancia_m
       FROM eventos e
      WHERE e.estado = ANY($4)
        AND ST_DWithin(e.ubicacion, ST_MakePoint($2, $1)::geography, $3)
        AND (e.estado <> 'resuelta' OR e.actualizado_en > NOW() - INTERVAL '24 hours')
      ORDER BY distancia_m ASC
      LIMIT 200`,
    [lat, lng, radio, ESTADOS_PUBLICOS]
  );
  return rows.map(normalizar);
}

export async function buscarPorId(id) {
  const { rows } = await query(
    `SELECT ${COLUMNAS_PUBLICAS} FROM eventos e WHERE e.id = $1 AND e.estado = ANY($2)`,
    [id, ESTADOS_PUBLICOS]
  );
  return rows[0] ? normalizar(rows[0]) : null;
}

// pg devuelve algunos números como texto; los convertimos
function normalizar(f) {
  return {
    ...f,
    lat: Number(f.lat),
    lng: Number(f.lng),
    ...(f.distancia_m != null && { distancia_m: Number(f.distancia_m) }),
  };
}
