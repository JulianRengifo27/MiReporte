// Conexión a PostgreSQL con un "pool" (reutiliza conexiones, escala mejor)
import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  max: 10,
});

// Atajo para hacer consultas: query('SELECT ... WHERE id = $1', [id])
export const query = (texto, valores) => pool.query(texto, valores);
