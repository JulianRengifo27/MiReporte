// ===== Guardado de fotos =====
// Dos modos (variable FOTOS_EN en el .env):
//   · "bd"    (por defecto) → la foto se guarda en PostgreSQL, tabla "fotos". Ideal para hostings
//                             en la nube (Railway, Render...), que borran los archivos al reiniciarse.
//   · "disco"               → la foto se guarda en la carpeta UPLOAD_DIR (útil con un volumen).
// El resto del código solo usa la URL que devuelve guardarFoto(), así que cambiar de modo
// (o pasar a S3/Cloudinary en el futuro) no afecta nada más.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { config } from '../config.js';
import { query } from '../db.js';

export const carpetaFotos = path.resolve(config.carpetaFotos);
if (config.fotosEn === 'disco') fs.mkdirSync(carpetaFotos, { recursive: true });

const EXTENSIONES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic' };

// Middleware de multer: recibe la foto en memoria, máximo 5 MB, solo imágenes
export const subirFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, archivo, cb) => {
    if (EXTENSIONES[archivo.mimetype]) cb(null, true);
    else cb(new Error('La foto debe ser JPG, PNG, WEBP o HEIC.'));
  },
}).single('foto');

// Guarda el archivo y devuelve su URL pública.
// El nombre es aleatorio (UUID): no revela nada del usuario ni del archivo original.
export async function guardarFoto(archivo) {
  if (!archivo) return null;
  const id = crypto.randomUUID();
  if (config.fotosEn === 'disco') {
    const nombre = id + EXTENSIONES[archivo.mimetype];
    await fs.promises.writeFile(path.join(carpetaFotos, nombre), archivo.buffer);
    return `${config.urlPublica}/uploads/${nombre}`;
  }
  await query(
    'INSERT INTO fotos (id, tipo_mime, datos, tamano) VALUES ($1, $2, $3, $4)',
    [id, archivo.mimetype, archivo.buffer, archivo.size]
  );
  return `${config.urlPublica}/api/fotos/${id}`;
}

// Devuelve una foto guardada en la base de datos (o null si no existe)
export async function leerFoto(id) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { rows: [f] } = await query('SELECT tipo_mime, datos FROM fotos WHERE id = $1', [id]);
  return f || null;
}
