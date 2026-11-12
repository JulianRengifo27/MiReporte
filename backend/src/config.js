// Lee las variables de entorno del archivo .env en un solo lugar
import 'dotenv/config';

export const config = {
  puerto: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL === 'true',
  frontends: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((s) => s.trim()),
  carpetaFotos: process.env.UPLOAD_DIR || 'uploads',
  urlPublica: (process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, ''),
};

if (!config.databaseUrl) {
  console.error('❌ Falta DATABASE_URL en el archivo .env (mira .env.example).');
  process.exit(1);
}
