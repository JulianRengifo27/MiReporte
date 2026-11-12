// Carga los datos de prueba (borra los eventos, reportes y alertas existentes).
// Uso: npm run seed
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';

const archivo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'seed.sql');

try {
  await pool.query(await fs.readFile(archivo, 'utf8'));
  console.log('✅ Datos de prueba cargados (10 eventos en Bogotá y 2 alertas climáticas).');
} catch (err) {
  console.error('❌ Error cargando datos de prueba:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
