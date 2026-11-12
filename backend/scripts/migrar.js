// Aplica en orden los archivos .sql de db/migraciones que aún no se han aplicado.
// Uso: npm run migrar        (o "node scripts/migrar.js --reset" para borrar todo y empezar de cero)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';

const carpeta = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migraciones');

async function main() {
  const cliente = await pool.connect();
  try {
    if (process.argv.includes('--reset')) {
      console.log('⚠️  Borrando todas las tablas...');
      await cliente.query('DROP TABLE IF EXISTS reportes, eventos, usuarios, alertas_climaticas, migraciones CASCADE');
    }
    await cliente.query('CREATE TABLE IF NOT EXISTS migraciones (nombre TEXT PRIMARY KEY, aplicada_en TIMESTAMPTZ DEFAULT NOW())');
    const { rows } = await cliente.query('SELECT nombre FROM migraciones');
    const aplicadas = new Set(rows.map((r) => r.nombre));
    const archivos = (await fs.readdir(carpeta)).filter((f) => f.endsWith('.sql')).sort();

    for (const archivo of archivos) {
      if (aplicadas.has(archivo)) continue;
      const sql = await fs.readFile(path.join(carpeta, archivo), 'utf8');
      await cliente.query('BEGIN');
      await cliente.query(sql);
      await cliente.query('INSERT INTO migraciones (nombre) VALUES ($1)', [archivo]);
      await cliente.query('COMMIT');
      console.log(`✅ Migración aplicada: ${archivo}`);
    }
    console.log('Base de datos al día.');
  } catch (err) {
    await cliente.query('ROLLBACK').catch(() => {});
    console.error('❌ Error en la migración:', err.message);
    if (/postgis/i.test(err.message)) console.error('   → Parece que falta instalar PostGIS (mira el README).');
    process.exitCode = 1;
  } finally {
    cliente.release();
    await pool.end();
  }
}

main();
