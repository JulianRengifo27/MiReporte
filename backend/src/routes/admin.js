// ===== Panel de ADMINISTRADOR =====
//   GET    /api/admin/revision                 → cola de eventos en revisión (con el análisis de la IA)
//   POST   /api/admin/eventos/:id/aprobar      → publicar en el mapa
//   POST   /api/admin/eventos/:id/rechazar     → descartar (no se publica)
//   DELETE /api/admin/eventos/:id              → eliminar un evento
//   DELETE /api/admin/eventos-viejos?dias=30   → eliminar resueltos/rechazados viejos
//   GET    /api/admin/usuarios                 → listar usuarios
//   POST   /api/admin/usuarios                 → crear cuenta (ej: para una entidad)
//   PATCH  /api/admin/usuarios/:id             → cambiar rol, entidad o activar/desactivar
//   GET    /api/admin/estadisticas             → reportes por tipo, por día y por estado
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool, query } from '../db.js';
import { requierePermiso } from '../middleware/auth.js';
import { buscarPorId, COLUMNAS_PUBLICAS } from '../services/eventos.js';
import { emitir } from '../socket.js';
import {
  ROLES, ENTIDADES, limpiarTexto, validarEmail, validarPassword, idValido, esBooleanoVerdadero,
} from '../utils/validacion.js';

const router = Router();

// ---------- Cola de revisión ----------
router.get('/revision', requierePermiso('revisar_reportes'), async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT ${COLUMNAS_PUBLICAS}, e.analisis_ia,
              COALESCE(json_agg(json_build_object(
                'id', r.id, 'descripcion', r.descripcion, 'confianza', r.confianza,
                'analisis_ia', r.analisis_ia, 'creado_en', r.creado_en,
                'registrado', r.usuario_id IS NOT NULL   -- solo si/no: el admin no necesita saber quién
              ) ORDER BY r.creado_en) FILTER (WHERE r.id IS NOT NULL), '[]') AS reportes
         FROM eventos e
         LEFT JOIN reportes r ON r.evento_id = e.id
        WHERE e.estado = 'pendiente_revision'
        GROUP BY e.id
        ORDER BY e.creado_en DESC`
    );
    res.json(rows.map((r) => ({ ...r, lat: Number(r.lat), lng: Number(r.lng) })));
  } catch (err) { next(err); }
});

async function decidir(req, res, next, aprobar) {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'id no válido' });
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const { rowCount } = await cliente.query(
      `UPDATE eventos SET estado = $2, revisado_por = $3, actualizado_en = NOW()
        WHERE id = $1 AND estado = 'pendiente_revision'`,
      [id, aprobar ? 'activa' : 'rechazado', req.usuario.id]
    );
    if (!rowCount) { await cliente.query('ROLLBACK'); return res.status(404).json({ error: 'El evento ya no está en revisión.' }); }
    await cliente.query(
      `UPDATE reportes SET estado = $2, actualizado_en = NOW() WHERE evento_id = $1 AND estado = 'pendiente_revision'`,
      [id, aprobar ? 'activa' : 'rechazado']
    );
    await cliente.query('COMMIT');
    if (aprobar) emitir('nuevo_evento', await buscarPorId(id));
    res.json({ ok: true });
  } catch (err) {
    await cliente.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    cliente.release();
  }
}

router.post('/eventos/:id/aprobar', requierePermiso('revisar_reportes'), (req, res, next) => decidir(req, res, next, true));
router.post('/eventos/:id/rechazar', requierePermiso('revisar_reportes'), (req, res, next) => decidir(req, res, next, false));

// ---------- Eliminar ----------
router.delete('/eventos/:id', requierePermiso('eliminar_eventos'), async (req, res, next) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ error: 'id no válido' });
    const { rowCount } = await query('DELETE FROM eventos WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Evento no encontrado.' });
    emitir('evento_eliminado', { id });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/eventos-viejos', requierePermiso('eliminar_eventos'), async (req, res, next) => {
  try {
    const dias = Math.max(Number(req.query.dias) || 30, 1);
    const { rows } = await query(
      `DELETE FROM eventos WHERE estado IN ('resuelta', 'rechazado')
          AND actualizado_en < NOW() - make_interval(days => $1) RETURNING id`,
      [dias]
    );
    rows.forEach(({ id }) => emitir('evento_eliminado', { id }));
    // Borra también las fotos que ya no usa ningún evento ni reporte (libera espacio en la base)
    await query(
      `DELETE FROM fotos f WHERE NOT EXISTS (SELECT 1 FROM eventos e WHERE e.foto_url LIKE '%' || f.id::text)
          AND NOT EXISTS (SELECT 1 FROM reportes r WHERE r.foto_url LIKE '%' || f.id::text)`
    );
    res.json({ eliminados: rows.length });
  } catch (err) { next(err); }
});

// ---------- Usuarios ----------
router.get('/usuarios', requierePermiso('gestionar_usuarios'), async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.nombre, u.email, u.rol, u.entidad, u.activo, u.creado_en,
              (SELECT COUNT(*)::int FROM reportes r WHERE r.usuario_id = u.id) AS reportes
         FROM usuarios u ORDER BY u.creado_en DESC LIMIT 500`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

function validarRolEntidad(rol, entidad) {
  if (!ROLES.includes(rol)) return 'Rol no válido.';
  if (rol === 'entidad_oficial' && !ENTIDADES.includes(entidad)) return `Elige la entidad: ${ENTIDADES.join(', ')}.`;
  return null;
}

router.post('/usuarios', requierePermiso('gestionar_usuarios'), async (req, res, next) => {
  try {
    const nombre = limpiarTexto(req.body.nombre, 100);
    const email = validarEmail(req.body.email);
    const rol = req.body.rol;
    const entidad = rol === 'entidad_oficial' ? req.body.entidad : null;
    const errorClave = validarPassword(req.body.password);
    if (!nombre) return res.status(400).json({ error: 'Falta el nombre.' });
    if (!email) return res.status(400).json({ error: 'Correo no válido.' });
    if (errorClave) return res.status(400).json({ error: errorClave });
    const errRol = validarRolEntidad(rol, entidad);
    if (errRol) return res.status(400).json({ error: errRol });
    const hash = await bcrypt.hash(req.body.password, 10);
    const { rows: [u] } = await query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, entidad) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING RETURNING id, nombre, email, rol, entidad, activo, creado_en`,
      [nombre, email, hash, rol, entidad]
    );
    if (!u) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    res.status(201).json(u);
  } catch (err) { next(err); }
});

router.patch('/usuarios/:id', requierePermiso('gestionar_usuarios'), async (req, res, next) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ error: 'id no válido' });
    if (id === req.usuario.id) return res.status(400).json({ error: 'No puedes cambiar tu propio rol ni desactivarte.' });
    const { rows: [actual] } = await query('SELECT rol, entidad, activo FROM usuarios WHERE id = $1', [id]);
    if (!actual) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const rol = req.body.rol ?? actual.rol;
    const entidad = rol === 'entidad_oficial' ? (req.body.entidad ?? actual.entidad) : null;
    const activo = req.body.activo === undefined ? actual.activo : esBooleanoVerdadero(req.body.activo);
    const errRol = validarRolEntidad(rol, entidad);
    if (errRol) return res.status(400).json({ error: errRol });

    const { rows: [u] } = await query(
      `UPDATE usuarios SET rol = $2, entidad = $3, activo = $4 WHERE id = $1
       RETURNING id, nombre, email, rol, entidad, activo, creado_en`,
      [id, rol, entidad, activo]
    );
    res.json(u);
  } catch (err) { next(err); }
});

// ---------- Estadísticas ----------
router.get('/estadisticas', requierePermiso('ver_estadisticas'), async (_req, res, next) => {
  try {
    const [porTipo, porDia, porEstado, totales] = await Promise.all([
      query(`SELECT tipo, COUNT(*)::int AS total FROM reportes GROUP BY tipo ORDER BY total DESC`),
      query(`SELECT to_char(d, 'YYYY-MM-DD') AS dia, COUNT(r.id)::int AS total
               FROM generate_series(CURRENT_DATE - 13, CURRENT_DATE, '1 day') d
               LEFT JOIN reportes r ON r.creado_en::date = d::date
              GROUP BY d ORDER BY d`),
      query(`SELECT estado, COUNT(*)::int AS total FROM eventos GROUP BY estado`),
      query(`SELECT (SELECT COUNT(*)::int FROM reportes) AS reportes,
                    (SELECT COUNT(*)::int FROM eventos)  AS eventos,
                    (SELECT COUNT(*)::int FROM usuarios) AS usuarios,
                    (SELECT COUNT(*)::int FROM eventos WHERE estado = 'pendiente_revision') AS en_revision`),
    ]);
    res.json({ por_tipo: porTipo.rows, por_dia: porDia.rows, por_estado: porEstado.rows, totales: totales.rows[0] });
  } catch (err) { next(err); }
});

export default router;
