// POST /api/reportes — crear un reporte sin necesidad de login
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { subirFoto, guardarFoto } from '../services/almacenamiento.js';
import { buscarPorId } from '../services/eventos.js';
import { emitir } from '../socket.js';

const router = Router();

const TIPOS = ['accidente', 'incendio', 'inundacion', 'deslizamiento', 'trancon', 'otro'];
const TIPOS_CON_AREA = { inundacion: 200, deslizamiento: 200, incendio: 100 };
const TIPOS_QUE_BLOQUEAN = ['accidente', 'trancon', 'inundacion', 'deslizamiento', 'incendio'];

// Anti-spam: máximo 5 reportes cada 10 minutos por dirección IP
const limiteReportes = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Enviaste muchos reportes seguidos. Espera unos minutos e inténtalo de nuevo.' },
});

// Revisa que los datos tengan sentido antes de guardarlos
function validar(cuerpo) {
  const tipo = String(cuerpo.tipo || '').trim();
  const lat = Number(cuerpo.lat);
  const lng = Number(cuerpo.lng);
  const descripcion = String(cuerpo.descripcion || '').trim().slice(0, 280);
  if (!TIPOS.includes(tipo)) return { error: 'Tipo de emergencia no válido.' };
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return { error: 'Latitud no válida.' };
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return { error: 'Longitud no válida.' };
  return { datos: { tipo, lat, lng, descripcion: descripcion || null } };
}

router.post('/', limiteReportes, (req, res, next) => {
  // multer procesa el formulario (campos + foto)
  subirFoto(req, res, async (errFoto) => {
    if (errFoto) return res.status(400).json({ error: errFoto.code === 'LIMIT_FILE_SIZE' ? 'La foto no puede pesar más de 5 MB.' : errFoto.message });

    const { datos, error } = validar(req.body);
    if (error) return res.status(400).json({ error });

    const cliente = await pool.connect();
    try {
      const foto_url = await guardarFoto(req.file);
      const punto = 'ST_MakePoint($2, $1)::geography'; // (lng, lat)

      await cliente.query('BEGIN');
      // FASE 2: cada reporte crea su propio evento.
      // En la FASE 3 aquí entra la IA: unir duplicados, validar coherencia y asignar prioridad.
      const { rows: [evento] } = await cliente.query(
        `INSERT INTO eventos (tipo, descripcion, foto_url, ubicacion, radio_m, via_bloqueada)
         VALUES ($3, $4, $5, ${punto}, $6, $7) RETURNING id`,
        [datos.lat, datos.lng, datos.tipo, datos.descripcion, foto_url, TIPOS_CON_AREA[datos.tipo] || 0, TIPOS_QUE_BLOQUEAN.includes(datos.tipo)]
      );
      const { rows: [reporte] } = await cliente.query(
        `INSERT INTO reportes (tipo, descripcion, foto_url, ubicacion, evento_id)
         VALUES ($3, $4, $5, ${punto}, $6) RETURNING id`,
        [datos.lat, datos.lng, datos.tipo, datos.descripcion, foto_url, evento.id]
      );
      await cliente.query('COMMIT');

      const publico = await buscarPorId(evento.id);
      emitir('nuevo_evento', publico); // ¡a todos los navegadores conectados!
      res.status(201).json({ reporte_id: reporte.id, evento: publico });
    } catch (err) {
      await cliente.query('ROLLBACK').catch(() => {});
      next(err);
    } finally {
      cliente.release();
    }
  });
});

export default router;
