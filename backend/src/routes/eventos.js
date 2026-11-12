// GET /api/eventos?lat=&lng=&radio=  y  GET /api/eventos/:id
import { Router } from 'express';
import { buscarCercanos, buscarPorId } from '../services/eventos.js';

const router = Router();

const RADIO_POR_DEFECTO = 10000; // 10 km
const RADIO_MAXIMO = 50000;      // 50 km

router.get('/', async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: 'Envía lat y lng válidos. Ej: /api/eventos?lat=4.6&lng=-74.08&radio=5000' });
    }
    const radio = Math.min(Number(req.query.radio) || RADIO_POR_DEFECTO, RADIO_MAXIMO);
    res.json(await buscarCercanos({ lat, lng, radio }));
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'id no válido' });
    const evento = await buscarPorId(id);
    if (!evento) return res.status(404).json({ error: 'Emergencia no encontrada' });
    res.json(evento);
  } catch (err) { next(err); }
});

export default router;
