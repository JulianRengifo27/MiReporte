// Genera los íconos PNG de la PWA (círculo rojo con "!" blanco) sin librerías externas.
// Uso: node scripts/generar-iconos.mjs   → crea public/icono-192.png, icono-512.png e icono-maskable-512.png
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const publico = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const ROJO = [189, 58, 58], BLANCO = [255, 255, 255];

// Tabla CRC32 (necesaria para el formato PNG)
const TABLA = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = TABLA[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function bloque(tipo, datos) {
  const largo = Buffer.alloc(4); largo.writeUInt32BE(datos.length);
  const td = Buffer.concat([Buffer.from(tipo), datos]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([largo, td, crc]);
}

// Dibuja el ícono. "relleno" = true para el ícono maskable (fondo completo, sin transparencia)
function icono(tam, relleno) {
  const filas = [];
  const c = tam / 2, radio = relleno ? tam : tam * 0.48;
  const escala = relleno ? 0.8 : 1; // el maskable deja margen de seguridad
  for (let y = 0; y < tam; y++) {
    const fila = Buffer.alloc(1 + tam * 4); // byte de filtro + RGBA
    for (let x = 0; x < tam; x++) {
      const dx = x + 0.5 - c, dy = y + 0.5 - c;
      const dentro = Math.hypot(dx, dy) <= radio;
      // Signo "!": barra vertical y punto
      const u = dx / (tam * escala), v = dy / (tam * escala);
      const barra = Math.abs(u) < 0.06 && v > -0.3 && v < 0.12;
      const punto = Math.hypot(u, v - 0.24) < 0.07;
      const color = barra || punto ? BLANCO : ROJO;
      const i = 1 + x * 4;
      if (dentro) { fila[i] = color[0]; fila[i + 1] = color[1]; fila[i + 2] = color[2]; fila[i + 3] = 255; }
    }
    filas.push(fila);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tam, 0); ihdr.writeUInt32BE(tam, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8 bits, RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloque('IHDR', ihdr),
    bloque('IDAT', zlib.deflateSync(Buffer.concat(filas))),
    bloque('IEND', Buffer.alloc(0)),
  ]);
}

fs.writeFileSync(path.join(publico, 'icono-192.png'), icono(192, false));
fs.writeFileSync(path.join(publico, 'icono-512.png'), icono(512, false));
fs.writeFileSync(path.join(publico, 'icono-maskable-512.png'), icono(512, true));
fs.writeFileSync(path.join(publico, 'apple-touch-icon.png'), icono(180, true));
console.log('✅ Íconos generados en frontend/public/');
