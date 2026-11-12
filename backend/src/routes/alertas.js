// GET /api/alertas-climaticas — solo las que siguen vigentes
import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, titulo, descripcion, zona, nivel, recomendaciones, vigente_hasta
         FROM alertas_climaticas
        WHERE vigente_hasta > NOW()
        ORDER BY CASE nivel WHEN 'roja' THEN 1 WHEN 'naranja' THEN 2 ELSE 3 END, id`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
