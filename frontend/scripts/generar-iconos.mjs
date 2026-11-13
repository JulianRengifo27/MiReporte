// Genera los íconos PNG de la PWA con el logo de MiReporte (pin blanco con "!" sobre fondo rojo),
// sin librerías externas. Usa supermuestreo (4x4 por píxel) para que los bordes se vean suaves.
// Uso: npm run iconos   → crea public/icono-192.png, icono-512.png, icono-maskable-512.png y apple-touch-icon.png
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const publico = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const ACENTO = [214, 56, 47], BLANCO = [255, 255, 255];

// ---------- PNG mínimo ----------
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
function png(tam, pixel) {
  const filas = [];
  for (let y = 0; y < tam; y++) {
    const fila = Buffer.alloc(1 + tam * 4);
    for (let x = 0; x < tam; x++) fila.set(pixel(x, y), 1 + x * 4);
    filas.push(fila);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tam, 0); ihdr.writeUInt32BE(tam, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloque('IHDR', ihdr), bloque('IDAT', zlib.deflateSync(Buffer.concat(filas))), bloque('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Formas del logo (en un espacio de 32 x 32, igual que el SVG) ----------
// Pin = círculo (centro 16,13.3; radio 10.8) + triángulo hasta la punta (16, 29.2).
// Los lados del triángulo son tangentes al círculo: pendiente r/√(d²−r²) ≈ 0.925, desde y ≈ 20.6.
const enPin = (x, y) => Math.hypot(x - 16, y - 13.3) <= 10.8 || (y >= 20.6 && y <= 29.2 && Math.abs(x - 16) <= (29.2 - y) * 0.925);
const enSigno = (x, y) =>
  (Math.abs(x - 16) <= 1.4 && y >= 8.4 && y <= 14) || Math.hypot(x - 16, y - 8.4) <= 1.4 || Math.hypot(x - 16, y - 14) <= 1.4 ||
  Math.hypot(x - 16, y - 19) <= 1.7;
// Cuadrado con esquinas redondeadas (radio r) que ocupa todo el ícono (coordenadas 0..1)
function enCuadradoRedondeado(u, v, r) {
  const dx = Math.max(r - u, 0, u - (1 - r)), dy = Math.max(r - v, 0, v - (1 - r));
  return Math.hypot(dx, dy) <= r;
}

// relleno=true → ícono "maskable" (fondo completo, el sistema le pone su propia forma)
function icono(tam, relleno) {
  const escalaPin = relleno ? 0.5 : 0.62; // qué fracción del ícono ocupa el pin
  const S = 4; // supermuestreo
  return png(tam, (px, py) => {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
      const u = (px + (sx + 0.5) / S) / tam, v = (py + (sy + 0.5) / S) / tam;
      if (!relleno && !enCuadradoRedondeado(u, v, 0.22)) continue;
      // Pasar a coordenadas del pin (32 x 32), centrado
      const x = 16 + ((u - 0.5) / escalaPin) * 32, y = 16 + ((v - 0.5) / escalaPin) * 32;
      const color = enPin(x, y) && !enSigno(x, y) ? BLANCO : ACENTO;
      r += color[0]; g += color[1]; b += color[2]; a += 255;
    }
    const n = S * S;
    return a ? [Math.round(r / (a / 255)), Math.round(g / (a / 255)), Math.round(b / (a / 255)), Math.round(a / n)] : [0, 0, 0, 0];
  });
}

fs.writeFileSync(path.join(publico, 'icono-192.png'), icono(192, false));
fs.writeFileSync(path.join(publico, 'icono-512.png'), icono(512, false));
fs.writeFileSync(path.join(publico, 'icono-maskable-512.png'), icono(512, true));
fs.writeFileSync(path.join(publico, 'apple-touch-icon.png'), icono(180, true));
console.log('✅ Íconos generados en frontend/public/');
