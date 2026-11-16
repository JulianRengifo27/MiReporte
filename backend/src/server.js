// ===== Servidor principal de MiReporte (Express + Socket.IO) =====
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { pool } from './db.js';
import { iniciarSocket } from './socket.js';
import { carpetaFotos, leerFoto } from './services/almacenamiento.js';
import { iniciarCierreAutomatico } from './services/cierre.js';
import { leerToken } from './middleware/auth.js';
import rutasAuth from './routes/auth.js';
import rutasReportes from './routes/reportes.js';
import rutasEventos from './routes/eventos.js';
import rutasAlertas from './routes/alertas.js';
import rutasMisReportes from './routes/misReportes.js';
import rutasOficial from './routes/oficial.js';
import rutasAdmin from './routes/admin.js';

const app = express();
app.set('trust proxy', 1); // necesario en Railway para que el rate limit vea la IP real

// Cabeceras de seguridad (helmet). Las fotos se cargan desde el frontend (otro origen),
// por eso se permite "cross-origin" en Cross-Origin-Resource-Policy.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// CORS: solo el frontend configurado en FRONTEND_URL puede llamar a la API
app.use(cors({ origin: config.frontends }));
app.use(express.json({ limit: '100kb' }));
app.use(leerToken); // si viene un token válido, queda en req.usuario

// Fotos guardadas en carpeta (modo "disco" y fotos antiguas de desarrollo)
app.use('/uploads', express.static(carpetaFotos, { maxAge: '7d', fallthrough: true }));

// Fotos guardadas en la base de datos (modo "bd", el de producción)
app.get('/api/fotos/:id', async (req, res, next) => {
  try {
    const foto = await leerFoto(req.params.id);
    if (!foto) return res.status(404).json({ error: 'Foto no encontrada' });
    res.set('Content-Type', foto.tipo_mime);
    res.set('Cache-Control', 'public, max-age=604800, immutable'); // una foto nunca cambia: 7 días en caché
    res.send(foto.datos);
  } catch (err) { next(err); }
});

// Rutas de la API
app.get('/api/salud', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, db: 'conectada' }); }
  catch { res.status(503).json({ ok: false, db: 'sin conexión' }); }
});
app.use('/api/auth', rutasAuth);
app.use('/api/reportes', rutasReportes);
app.use('/api/eventos', rutasEventos);
app.use('/api/alertas-climaticas', rutasAlertas);
app.use('/api/mis-reportes', rutasMisReportes);
app.use('/api/oficial', rutasOficial);
app.use('/api/admin', rutasAdmin);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejo de errores: se registra el detalle en consola, pero al usuario no se le muestran datos internos
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON mal formado.' });
  console.error('❌', err);
  res.status(500).json({ error: 'Ocurrió un error en el servidor. Intenta de nuevo.' });
});

const servidor = http.createServer(app);
iniciarSocket(servidor);
iniciarCierreAutomatico();

servidor.listen(config.puerto, () => {
  console.log(`🚨 API de MiReporte en http://localhost:${config.puerto}`);
  console.log(`   Prueba: http://localhost:${config.puerto}/api/salud`);
});
