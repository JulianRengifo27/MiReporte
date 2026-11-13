// POST /api/reportes — crear un reporte sin necesidad de login
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { subirFoto, guardarFoto } from '../services/almacenamiento.js';
import { buscarPorId } from '../services/eventos.js';
import { emitir } from '../socket.js';
import { limpiarTexto } from '../utils/validacion.js';
import { analizarReporte, buscarDuplicado, prioridadMayor, PARAMETROS } from '../services/ia.js';

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
  const descripcion = limpiarTexto(cuerpo.descripcion, 280);
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

    let cliente;
    try {
      // Capas 2, 3 y 4 de la IA (texto, imagen, reglas). Se hace ANTES de abrir la
      // transacción para no bloquear la base mientras Gemini responde.
      const analisis = await analizarReporte({ tipo: datos.tipo, descripcion: datos.descripcion, foto: req.file });
      const foto_url = await guardarFoto(req.file);
      const punto = 'ST_MakePoint($2, $1)::geography'; // (lng, lat)
      const resumenIA = { texto: analisis.texto, imagen: analisis.imagen, confianza: analisis.confianza };

      cliente = await pool.connect();
      await cliente.query('BEGIN');

      // Capa 1: ¿ya existe un evento igual cerca y reciente?
      const duplicado = await buscarDuplicado(cliente, datos);
      let eventoId, estadoAntes, estadoFinal, unido = false;

      if (duplicado) {
        // Unimos el reporte al evento existente: +1 reporte, más confianza
        unido = true;
        eventoId = duplicado.id;
        estadoAntes = duplicado.estado;
        const cantidad = duplicado.cantidad_reportes + 1;
        const confianza = Math.min(100, duplicado.confianza + (analisis.estado === 'activa' ? 12 : 4));
        // Un evento en revisión se publica si ya alcanzó la confianza o si varias personas lo confirman
        estadoFinal = duplicado.estado === 'pendiente_revision' &&
          (confianza >= PARAMETROS.umbralRevision || cantidad >= PARAMETROS.reportesParaPublicar)
          ? 'activa' : duplicado.estado;
        await cliente.query(
          `UPDATE eventos
              SET cantidad_reportes = $2, confianza = $3, estado = $4,
                  prioridad = $5, foto_url = COALESCE(foto_url, $6),
                  descripcion = COALESCE(descripcion, $7), actualizado_en = NOW()
            WHERE id = $1`,
          [eventoId, cantidad, confianza, estadoFinal, prioridadMayor(duplicado.prioridad, analisis.prioridad), foto_url, datos.descripcion]
        );
      } else {
        // Evento nuevo con el resultado de la IA
        estadoFinal = analisis.estado;
        const { rows: [evento] } = await cliente.query(
          `INSERT INTO eventos (tipo, descripcion, foto_url, ubicacion, radio_m, via_bloqueada, estado, prioridad, confianza, analisis_ia)
           VALUES ($3, $4, $5, ${punto}, $6, $7, $8, $9, $10, $11) RETURNING id`,
          [datos.lat, datos.lng, datos.tipo, datos.descripcion, foto_url, TIPOS_CON_AREA[datos.tipo] || 0,
            TIPOS_QUE_BLOQUEAN.includes(datos.tipo), estadoFinal, analisis.prioridad, analisis.confianza, resumenIA]
        );
        eventoId = evento.id;
      }

      const { rows: [reporte] } = await cliente.query(
        `INSERT INTO reportes (tipo, descripcion, foto_url, ubicacion, evento_id, estado, prioridad, confianza, analisis_ia, usuario_id)
         VALUES ($3, $4, $5, ${punto}, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [datos.lat, datos.lng, datos.tipo, datos.descripcion, foto_url, eventoId,
          analisis.estado, analisis.prioridad, analisis.confianza, resumenIA,
          // Si el ciudadano inició sesión, el reporte queda en SU historial (nunca se muestra públicamente)
          req.usuario?.id || null]
      );
      await cliente.query('COMMIT');

      // Tiempo real: solo se avisa de eventos públicos (los "en revisión" no salen en el mapa)
      const publico = estadoFinal === 'pendiente_revision' ? null : await buscarPorId(eventoId);
      if (publico) {
        const eraPublico = unido && estadoAntes !== 'pendiente_revision';
        emitir(eraPublico ? 'evento_actualizado' : 'nuevo_evento', publico);
      }

      res.status(201).json({
        reporte_id: reporte.id,
        unido_a_evento_existente: unido,
        en_revision: estadoFinal === 'pendiente_revision',
        prioridad: analisis.prioridad,
        evento: publico,
      });
    } catch (err) {
      await cliente?.query('ROLLBACK').catch(() => {});
      next(err);
    } finally {
      cliente?.release();
    }
  });
});

export default router;
