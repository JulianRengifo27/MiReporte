// ===== Registro, login y perfil =====
//   POST /api/auth/registro  → crea cuenta de CIUDADANO (los otros roles los asigna el admin)
//   POST /api/auth/login     → devuelve un token JWT
//   GET  /api/auth/yo        → datos del usuario logueado y sus permisos
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { query } from '../db.js';
import { crearToken, requiereLogin } from '../middleware/auth.js';
import { limpiarTexto, validarEmail, validarPassword } from '../utils/validacion.js';

const router = Router();

// Freno a intentos de adivinar contraseñas: 10 intentos cada 15 minutos por IP
const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
});

// Datos que se le devuelven al propio usuario (nunca el hash de la contraseña)
async function perfil(id) {
  const { rows: [u] } = await query(
    'SELECT id, nombre, email, rol, entidad FROM usuarios WHERE id = $1 AND activo', [id]
  );
  if (!u) return null;
  const { rows } = await query('SELECT permiso FROM permisos WHERE rol = $1', [u.rol]);
  return { ...u, permisos: rows.map((r) => r.permiso) };
}

router.post('/registro', limiteAuth, async (req, res, next) => {
  try {
    const nombre = limpiarTexto(req.body.nombre, 100);
    const email = validarEmail(req.body.email);
    const errorClave = validarPassword(req.body.password);
    if (!nombre || nombre.length < 2) return res.status(400).json({ error: 'Escribe tu nombre.' });
    if (!email) return res.status(400).json({ error: 'Correo no válido.' });
    if (errorClave) return res.status(400).json({ error: errorClave });
    if (req.body.acepta_politica !== true) return res.status(400).json({ error: 'Debes aceptar la política de privacidad.' });

    const hash = await bcrypt.hash(req.body.password, 10); // bcrypt: la contraseña nunca se guarda en texto plano
    const { rows: [u] } = await query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, 'ciudadano')
       ON CONFLICT (email) DO NOTHING RETURNING id, rol`,
      [nombre, email, hash]
    );
    if (!u) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    res.status(201).json({ token: crearToken(u), usuario: await perfil(u.id) });
  } catch (err) { next(err); }
});

router.post('/login', limiteAuth, async (req, res, next) => {
  try {
    const email = validarEmail(req.body.email);
    const password = String(req.body.password || '');
    const { rows: [u] } = email
      ? await query('SELECT id, rol, password_hash, activo FROM usuarios WHERE email = $1', [email])
      : { rows: [] };
    // Mismo mensaje si el correo no existe o la clave está mal (no damos pistas)
    const ok = u && u.activo && (await bcrypt.compare(password, u.password_hash));
    if (!ok) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    res.json({ token: crearToken(u), usuario: await perfil(u.id) });
  } catch (err) { next(err); }
});

router.get('/yo', requiereLogin, async (req, res, next) => {
  try {
    const u = await perfil(req.usuario.id);
    if (!u) return res.status(401).json({ error: 'Tu cuenta no está activa.' });
    res.json(u);
  } catch (err) { next(err); }
});

export default router;
