// Carga los datos de prueba (borra los eventos, reportes y alertas existentes)
// y crea/actualiza las cuentas de prueba de cada rol.
// Uso: npm run seed
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';

const archivo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'seed.sql');

// Cuentas SOLO para desarrollo y demostración. Las contraseñas se pueden cambiar con
// SEED_PASSWORD_ADMIN / SEED_PASSWORD_ENTIDAD / SEED_PASSWORD_CIUDADANO en el .env.
const USUARIOS_PRUEBA = [
  { nombre: 'Administrador MiReporte', email: 'admin@mireporte.test',      rol: 'admin',           entidad: null,            clave: process.env.SEED_PASSWORD_ADMIN || 'Admin2026*' },
  { nombre: 'Bomberos Bogotá',         email: 'bomberos@mireporte.test',   rol: 'entidad_oficial', entidad: 'Bomberos',      clave: process.env.SEED_PASSWORD_ENTIDAD || 'Entidad2026*' },
  { nombre: 'Tránsito Bogotá',         email: 'transito@mireporte.test',   rol: 'entidad_oficial', entidad: 'Tránsito',      clave: process.env.SEED_PASSWORD_ENTIDAD || 'Entidad2026*' },
  { nombre: 'Defensa Civil',           email: 'defensa@mireporte.test',    rol: 'entidad_oficial', entidad: 'Defensa Civil', clave: process.env.SEED_PASSWORD_ENTIDAD || 'Entidad2026*' },
  { nombre: 'Ciudadano de prueba',     email: 'ciudadano@mireporte.test',  rol: 'ciudadano',       entidad: null,            clave: process.env.SEED_PASSWORD_CIUDADANO || 'Ciudadano2026*' },
];

try {
  await pool.query(await fs.readFile(archivo, 'utf8'));
  for (const u of USUARIOS_PRUEBA) {
    const hash = await bcrypt.hash(u.clave, 10);
    await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, entidad)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET nombre = $1, password_hash = $3, rol = $4, entidad = $5, activo = TRUE`,
      [u.nombre, u.email, hash, u.rol, u.entidad]
    );
  }
  console.log('✅ Datos de prueba cargados (10 eventos, 2 alertas climáticas y 5 cuentas de prueba).');
  console.log('   Cuentas: admin@ / bomberos@ / transito@ / defensa@ / ciudadano@mireporte.test (contraseñas en el README)');
} catch (err) {
  console.error('❌ Error cargando datos de prueba:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
