// GET /api/mis-reportes — historial del usuario registrado (solo sus propios reportes)
import { Router } from 'express';
import { query } from '../db.js';
import { requierePermiso } from '../middleware/auth.js';

const router = Router();

router.get('/', requierePermiso('ver_mis_reportes'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT r.id, r.tipo, r.descripcion, r.foto_url, r.estado AS estado_reporte, r.prioridad, r.creado_en,
              ST_Y(r.ubicacion::geometry) AS lat, ST_X(r.ubicacion::geometry) AS lng,
              e.id AS evento_id, e.estado AS estado_evento, e.cantidad_reportes
         FROM reportes r
         LEFT JOIN eventos e ON e.id = r.evento_id
        WHERE r.usuario_id = $1
        ORDER BY r.creado_en DESC
        LIMIT 200`,
      [req.usuario.id]
    );
    res.json(rows.map((r) => ({ ...r, lat: Number(r.lat), lng: Number(r.lng) })));
  } catch (err) { next(err); }
});

export default router;
