// ===== Cierre automático =====
// Cada 10 minutos, los eventos sin actividad por X horas (CIERRE_AUTOMATICO_HORAS, por defecto 6)
// pasan a "Resuelta". Los que siguen "en revisión" sin que nadie los apruebe se rechazan.
import { query } from '../db.js';
import { config } from '../config.js';
import { buscarPorId } from './eventos.js';
import { emitir } from '../socket.js';

export async function cerrarEventosInactivos() {
  try {
    const { rows } = await query(
      `UPDATE eventos
          SET estado = CASE WHEN estado = 'pendiente_revision' THEN 'rechazado' ELSE 'resuelta' END,
              actualizado_en = NOW()
        WHERE estado IN ('activa', 'en_atencion', 'pendiente_revision')
          AND actualizado_en < NOW() - make_interval(hours => $1)
        RETURNING id, estado`,
      [config.horasCierreAutomatico]
    );
    for (const { id, estado } of rows) {
      if (estado === 'resuelta') emitir('evento_actualizado', await buscarPorId(id));
    }
    if (rows.length) console.log(`🕒 Cierre automático: ${rows.length} evento(s) cerrados por inactividad.`);
  } catch (err) {
    console.error('❌ Error en el cierre automático:', err.message);
  }
}

export function iniciarCierreAutomatico() {
  cerrarEventosInactivos();
  return setInterval(cerrarEventosInactivos, 10 * 60 * 1000);
}
