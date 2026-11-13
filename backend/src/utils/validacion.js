// ===== Validación y limpieza de entradas =====
// Regla de oro: nunca confiar en lo que llega del navegador.

export const TIPOS = ['accidente', 'incendio', 'inundacion', 'deslizamiento', 'trancon', 'otro'];
export const ESTADOS_GESTION = ['activa', 'en_atencion', 'resuelta'];
export const PRIORIDADES = ['alta', 'media', 'baja'];
export const ROLES = ['ciudadano', 'entidad_oficial', 'admin'];
export const ENTIDADES = ['Bomberos', 'Tránsito', 'Cruz Roja', 'Defensa Civil', 'Alcaldía'];

// Quita caracteres de control, espacios sobrantes y corta al largo máximo.
// (El HTML no se borra aquí: React y el popup del mapa lo escapan al mostrarlo.)
export function limpiarTexto(valor, max = 280) {
  if (valor == null) return null;
  const t = String(valor)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
  return t || null;
}

export function validarCoordenadas(lat, lng) {
  const la = Number(lat), lo = Number(lng);
  if (!Number.isFinite(la) || la < -90 || la > 90) return { error: 'Latitud no válida.' };
  if (!Number.isFinite(lo) || lo < -180 || lo > 180) return { error: 'Longitud no válida.' };
  return { lat: la, lng: lo };
}

export function validarEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 150 ? e : null;
}

// Contraseña: mínimo 8 caracteres, con letras y números
export function validarPassword(p) {
  const s = String(p || '');
  if (s.length < 8 || s.length > 72) return 'La contraseña debe tener entre 8 y 72 caracteres.';
  if (!/[a-zA-Z]/.test(s) || !/\d/.test(s)) return 'La contraseña debe tener letras y números.';
  return null;
}

export const esBooleanoVerdadero = (v) => v === true || v === 'true' || v === '1' || v === 'on';

export function idValido(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}
