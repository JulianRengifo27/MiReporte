// Conexión a PostgreSQL con un "pool" (reutiliza conexiones, escala mejor)
import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  // Algunas bases en la nube exigen conexión cifrada (DATABASE_SSL=true o "?sslmode=require" en la URL).
  // Si no se pide, no se fuerza nada y se respeta lo que diga la URL.
  ...(config.databaseSsl && { ssl: { rejectUnauthorized: false } }),
  max: 10,
});

// Atajo para hacer consultas: query('SELECT ... WHERE id = $1', [id])
export const query = (texto, valores) => pool.query(texto, valores);
