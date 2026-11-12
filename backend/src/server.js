// ===== Servidor principal de Pilas (Express + Socket.IO) =====
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { pool } from './db.js';
import { iniciarSocket } from './socket.js';
import { carpetaFotos } from './services/almacenamiento.js';
import rutasReportes from './routes/reportes.js';
import rutasEventos from './routes/eventos.js';
import rutasAlertas from './routes/alertas.js';

const app = express();
app.set('trust proxy', 1); // necesario en Railway para que el rate limit vea la IP real

app.use(cors({ origin: config.frontends }));
app.use(express.json({ limit: '100kb' }));

// Fotos subidas (en desarrollo, carpeta local)
app.use('/uploads', express.static(carpetaFotos, { maxAge: '7d' }));

// Rutas de la API
app.get('/api/salud', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, db: 'conectada' }); }
  catch { res.status(503).json({ ok: false, db: 'sin conexión' }); }
});
app.use('/api/reportes', rutasReportes);
app.use('/api/eventos', rutasEventos);
app.use('/api/alertas-climaticas', rutasAlertas);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejo de errores: se registra el detalle en consola, pero al usuario no se le muestran datos internos
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('❌', err);
  res.status(500).json({ error: 'Ocurrió un error en el servidor. Intenta de nuevo.' });
});

const servidor = http.createServer(app);
iniciarSocket(servidor);

servidor.listen(config.puerto, () => {
  console.log(`🚨 API de Pilas en http://localhost:${config.puerto}`);
  console.log(`   Prueba: http://localhost:${config.puerto}/api/salud`);
});
