// Carga los datos de DEMOSTRACIÓN para la presentación (encima de los datos de prueba).
// Uso: npm run demo     (ejecuta antes "npm run seed" automáticamente)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';

const archivo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'demo.sql');

try {
  await pool.query(await fs.readFile(archivo, 'utf8'));
  const { rows: [t] } = await pool.query(`SELECT
      (SELECT COUNT(*) FROM eventos WHERE estado IN ('activa','en_atencion')) AS activos,
      (SELECT COUNT(*) FROM eventos WHERE estado = 'pendiente_revision') AS revision,
      (SELECT COUNT(*) FROM reportes) AS reportes`);
  console.log(`✅ Demo lista: ${t.activos} emergencias activas, ${t.revision} en revisión, ${t.reportes} reportes en total.`);
} catch (err) {
  console.error('❌ Error cargando la demo:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
