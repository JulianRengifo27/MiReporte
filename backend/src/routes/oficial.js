// ===== Panel de ENTIDAD OFICIAL (también lo puede usar el admin) =====
//   POST  /api/oficial/reportes          → publicar reporte oficial (sello "Verificado")
//   GET   /api/oficial/eventos           → eventos activos / en atención (para gestionarlos)
//   PATCH /api/oficial/eventos/:id       → confirmar, cambiar estado, escribir desvío
import { Router } from 'express';
import { pool, query } from '../db.js';
import { requierePermiso } from '../middleware/auth.js';
import { subirFoto, guardarFoto } from '../services/almacenamiento.js';
import { buscarPorId, COLUMNAS_PUBLICAS } from '../services/eventos.js';
import { buscarDuplicado, calcularPrioridad } from '../services/ia.js';
import { emitir } from '../socket.js';
import {
  TIPOS, ESTADOS_GESTION, PRIORIDADES, limpiarTexto, validarCoordenadas, esBooleanoVerdadero, idValido,
} from '../utils/validacion.js';

const router = Router();

// ---------- Publicar un reporte oficial ----------
router.post('/reportes', requierePermiso('publicar_oficial'), (req, res, next) => {
  subirFoto(req, res, async (errFoto) => {
    if (errFoto) return res.status(400).json({ error: errFoto.message });
    const b = req.body;
    const tipo = String(b.tipo || '');
    const coords = validarCoordenadas(b.lat, b.lng);
    if (!TIPOS.includes(tipo)) return res.status(400).json({ error: 'Tipo no válido.' });
    if (coords.error) return res.status(400).json({ error: coords.error });
    const descripcion = limpiarTexto(b.descripcion, 500);
    if (!descripcion) return res.status(400).json({ error: 'Los reportes oficiales necesitan una descripción.' });
    const radio = Math.min(Math.max(Number(b.radio_m) || 0, 0), 3000);
    const estado = ESTADOS_GESTION.includes(b.estado) ? b.estado : 'activa';
    const prioridad = PRIORIDADES.includes(b.prioridad) ? b.prioridad : calcularPrioridad({ tipo });
    const desvio = limpiarTexto(b.desvio, 300);
    const via = esBooleanoVerdadero(b.via_bloqueada);
    const entidad = req.usuario.entidad || 'Administración';

    let cliente;
    try {
      const foto_url = await guardarFoto(req.file);
      cliente = await pool.connect();
      await cliente.query('BEGIN');

      // Si ya hay un evento ciudadano igual cerca, la entidad lo "toma" y lo verifica
      // (RF03: el reporte oficial tiene prioridad sobre los ciudadanos)
      const dup = await buscarDuplicado(cliente, { tipo, ...coords });
      let eventoId, eraPublico = false;
      if (dup) {
        eraPublico = dup.estado !== 'pendiente_revision';
        const { rows: [e] } = await cliente.query(
          `UPDATE eventos SET origen = 'oficial', verificado = TRUE, entidad = $2, confianza = 100,
                  descripcion = $3, estado = $4, prioridad = $5, radio_m = GREATEST(radio_m, $6),
                  via_bloqueada = $7, desvio = COALESCE($8, desvio), foto_url = COALESCE($9, foto_url),
                  cantidad_reportes = cantidad_reportes + 1, revisado_por = $10, actualizado_en = NOW()
            WHERE id = $1 RETURNING id`,
          [dup.id, entidad, descripcion, estado, prioridad, radio, via, desvio, foto_url, req.usuario.id]
        );
        eventoId = e.id;
      } else {
        const { rows: [e] } = await cliente.query(
          `INSERT INTO eventos (tipo, descripcion, foto_url, ubicacion, radio_m, estado, prioridad, origen,
                                verificado, entidad, via_bloqueada, desvio, confianza, revisado_por)
           VALUES ($1, $2, $3, ST_MakePoint($5, $4)::geography, $6, $7, $8, 'oficial', TRUE, $9, $10, $11, 100, $12)
           RETURNING id`,
          [tipo, descripcion, foto_url, coords.lat, coords.lng, radio, estado, prioridad, entidad, via, desvio, req.usuario.id]
        );
        eventoId = e.id;
      }
      await cliente.query(
        `INSERT INTO reportes (tipo, descripcion, foto_url, ubicacion, estado, origen, prioridad, confianza, evento_id, usuario_id)
         VALUES ($1, $2, $3, ST_MakePoint($5, $4)::geography, $6, 'oficial', $7, 100, $8, $9)`,
        [tipo, descripcion, foto_url, coords.lat, coords.lng, estado, prioridad, eventoId, req.usuario.id]
      );
      await cliente.query('COMMIT');

      const publico = await buscarPorId(eventoId);
      emitir(eraPublico ? 'evento_actualizado' : 'nuevo_evento', publico);
      res.status(201).json({ evento: publico, unido_a_evento_existente: Boolean(dup) });
    } catch (err) {
      await cliente?.query('ROLLBACK').catch(() => {});
      next(err);
    } finally {
      cliente?.release();
    }
  });
});

// ---------- Listar eventos para gestionar ----------
router.get('/eventos', requierePermiso('gestionar_eventos'), async (req, res, next) => {
  try {
    const estados = req.query.incluir_resueltos === 'true' ? ESTADOS_GESTION : ['activa', 'en_atencion'];
    const { rows } = await query(
      `SELECT ${COLUMNAS_PUBLICAS} FROM eventos e WHERE e.estado = ANY($1)
        ORDER BY CASE e.prioridad WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END, e.actualizado_en DESC
        LIMIT 300`,
      [estados]
    );
    res.json(rows.map((r) => ({ ...r, lat: Number(r.lat), lng: Number(r.lng) })));
  } catch (err) { next(err); }
});

// ---------- Confirmar / cambiar estado / desvío ----------
router.patch('/eventos/:id', requierePermiso('gestionar_eventos'), async (req, res, next) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ error: 'id no válido' });
    const b = req.body || {};
    const cambios = [];
    const valores = [id];
    const poner = (columna, valor) => { valores.push(valor); cambios.push(`${columna} = $${valores.length}`); };

    if (b.estado !== undefined) {
      if (!ESTADOS_GESTION.includes(b.estado)) return res.status(400).json({ error: 'Estado no válido.' });
      poner('estado', b.estado);
    }
    if (b.prioridad !== undefined) {
      if (!PRIORIDADES.includes(b.prioridad)) return res.status(400).json({ error: 'Prioridad no válida.' });
      poner('prioridad', b.prioridad);
    }
    if (b.desvio !== undefined) poner('desvio', limpiarTexto(b.desvio, 300));
    if (b.via_bloqueada !== undefined) poner('via_bloqueada', esBooleanoVerdadero(b.via_bloqueada));
    // "Confirmar": la entidad verifica el evento y le pone su sello
    if (b.confirmar === true) {
      poner('verificado', true);
      poner('entidad', req.usuario.entidad || 'Administración');
      poner('confianza', 100);
    }
    if (!cambios.length) return res.status(400).json({ error: 'No hay cambios.' });
    poner('revisado_por', req.usuario.id);

    const { rowCount } = await query(
      `UPDATE eventos SET ${cambios.join(', ')}, actualizado_en = NOW()
        WHERE id = $1 AND estado <> 'rechazado'`,
      valores
    );
    if (!rowCount) return res.status(404).json({ error: 'Evento no encontrado.' });
    const publico = await buscarPorId(id);
    if (publico) emitir('evento_actualizado', publico);
    res.json(publico);
  } catch (err) { next(err); }
});

export default router;
