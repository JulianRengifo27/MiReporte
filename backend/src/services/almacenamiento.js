// Guardado de fotos.
// En desarrollo se guardan en una carpeta local (uploads/).
// Para pasar a la nube (S3, Cloudinary, etc.) solo hay que cambiar guardarFoto():
// el resto del código únicamente usa la URL que devuelve.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { config } from '../config.js';

export const carpetaFotos = path.resolve(config.carpetaFotos);
fs.mkdirSync(carpetaFotos, { recursive: true });

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

// Guarda el archivo y devuelve su URL pública
export async function guardarFoto(archivo) {
  if (!archivo) return null;
  // Nombre aleatorio: no revela nada del usuario ni del archivo original
  const nombre = crypto.randomUUID() + EXTENSIONES[archivo.mimetype];
  await fs.promises.writeFile(path.join(carpetaFotos, nombre), archivo.buffer);
  return `${config.urlPublica}/uploads/${nombre}`;
}
