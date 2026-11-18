// ===== Autenticación (JWT) y permisos por rol =====
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db.js';

// Crea un token temporal (por defecto dura 8 horas)
export function crearToken(usuario) {
  return jwt.sign({ id: usuario.id, rol: usuario.rol }, config.jwtSecret, { expiresIn: config.jwtDuracion });
}

// Lee el token si viene (Authorization: Bearer xxx). No obliga a estar logueado:
// así el mapa y las consultas funcionan sin cuenta; las rutas que lo exigen usan requierePermiso().
export function leerToken(req, _res, next) {
  const cabecera = req.headers.authorization || '';
  if (cabecera.startsWith('Bearer ')) {
    try {
      const datos = jwt.verify(cabecera.slice(7), config.jwtSecret);
      req.usuario = { id: datos.id, rol: datos.rol };
    } catch {
      // Token vencido o falso: se trata como anónimo
    }
  }
  next();
}

export function requiereLogin(req, res, next) {
  if (!req.usuario) return res.status(401).json({ error: 'Debes iniciar sesión.' });
  next();
}

// Verifica en la base de datos que el usuario siga activo y que su rol (actual) tenga el permiso.
// Se consulta la base cada vez para que un cambio de rol o una cuenta desactivada aplique de inmediato.
export function requierePermiso(permiso) {
  return async (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ error: 'Debes iniciar sesión.' });
    try {
      const { rows } = await query(
        `SELECT u.id, u.nombre, u.rol, u.entidad
           FROM usuarios u
           JOIN permisos p ON p.rol = u.rol AND p.permiso = $2
          WHERE u.id = $1 AND u.activo`,
        [req.usuario.id, permiso]
      );
      if (!rows[0]) return res.status(403).json({ error: 'No tienes permiso para hacer esto.' });
      req.usuario = rows[0]; // datos frescos (rol, entidad)
      next();
    } catch (err) { next(err); }
  };
}
