// Lee las variables de entorno del archivo .env en un solo lugar
import 'dotenv/config';

export const config = {
  puerto: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL === 'true',
  frontends: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((s) => s.trim()),
  carpetaFotos: process.env.UPLOAD_DIR || 'uploads',
  // Dónde guardar las fotos: 'bd' (base de datos, por defecto) o 'disco' (carpeta UPLOAD_DIR)
  fotosEn: process.env.FOTOS_EN === 'disco' ? 'disco' : 'bd',
  // IA (opcional: sin llave se usan reglas de respaldo)
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModelo: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  // En Render, RENDER_EXTERNAL_URL trae la dirección pública automáticamente
  urlPublica: (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, ''),
};

// Seguridad (FASE 4)
config.jwtSecret = process.env.JWT_SECRET || '';
config.jwtDuracion = process.env.JWT_DURACION || '8h';
// Eventos sin actividad por estas horas pasan a "Resuelta" automáticamente
config.horasCierreAutomatico = Number(process.env.CIERRE_AUTOMATICO_HORAS) || 6;

if (!config.jwtSecret || config.jwtSecret.length < 32) {
  console.error('❌ Falta JWT_SECRET en el .env (mínimo 32 caracteres). Mira .env.example.');
  process.exit(1);
}

if (!config.databaseUrl) {
  console.error('❌ Falta DATABASE_URL en el archivo .env (mira .env.example).');
  process.exit(1);
}
