// ===== Comunicación con el backend (API REST + Socket.IO) =====
import { io } from 'socket.io-client';

// Dirección del backend. Se cambia con la variable VITE_API_URL (archivo frontend/.env)
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

// ---------- Token de sesión (JWT) ----------
const CLAVE_TOKEN = 'mireporte-token';
export function leerToken() {
  try { return localStorage.getItem(CLAVE_TOKEN); } catch { return null; }
}
export function guardarToken(token) {
  try { token ? localStorage.setItem(CLAVE_TOKEN, token) : localStorage.removeItem(CLAVE_TOKEN); } catch { /* sin almacenamiento */ }
}

// Se llama cuando el servidor dice que el token ya no sirve (vencido)
let alExpirarSesion = () => {};
export const onSesionExpirada = (fn) => { alExpirarSesion = fn; };

async function pedir(ruta, { metodo = 'GET', json, form } = {}) {
  const headers = {};
  const token = leerToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(json); }
  if (form) body = form;

  let resp;
  try {
    resp = await fetch(`${API_URL}${ruta}`, { method: metodo, headers, body });
  } catch {
    throw new Error('No hay conexión con el servidor. Revisa tu internet o que el backend esté encendido.');
  }
  const datos = await resp.json().catch(() => ({}));
  if (resp.status === 401 && token) alExpirarSesion();
  if (!resp.ok) throw new Error(datos.error || `Error ${resp.status}`);
  return datos;
}

// Convierte un objeto en FormData (para enviar fotos)
function aFormData(obj) {
  const form = new FormData();
  Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') form.append(k, v); });
  return form;
}

// ---------- Público ----------
export const obtenerEventos = ({ lat, lng }, radio = 30000) =>
  pedir(`/api/eventos?${new URLSearchParams({ lat, lng, radio })}`);
export const obtenerAlertasClima = () => pedir('/api/alertas-climaticas');
export const crearReporte = (datos) => pedir('/api/reportes', { metodo: 'POST', form: aFormData(datos) });

// ---------- Sesión ----------
export const registrarse = (datos) => pedir('/api/auth/registro', { metodo: 'POST', json: datos });
export const iniciarSesion = (email, password) => pedir('/api/auth/login', { metodo: 'POST', json: { email, password } });
export const obtenerPerfil = () => pedir('/api/auth/yo');
export const obtenerMisReportes = () => pedir('/api/mis-reportes');

// ---------- Entidad oficial ----------
export const publicarOficial = (datos) => pedir('/api/oficial/reportes', { metodo: 'POST', form: aFormData(datos) });
export const obtenerEventosGestion = (incluirResueltos) =>
  pedir(`/api/oficial/eventos${incluirResueltos ? '?incluir_resueltos=true' : ''}`);
export const actualizarEvento = (id, cambios) => pedir(`/api/oficial/eventos/${id}`, { metodo: 'PATCH', json: cambios });

// ---------- Administrador ----------
export const obtenerRevision = () => pedir('/api/admin/revision');
export const aprobarEvento = (id) => pedir(`/api/admin/eventos/${id}/aprobar`, { metodo: 'POST' });
export const rechazarEvento = (id) => pedir(`/api/admin/eventos/${id}/rechazar`, { metodo: 'POST' });
export const eliminarEvento = (id) => pedir(`/api/admin/eventos/${id}`, { metodo: 'DELETE' });
export const eliminarEventosViejos = (dias) => pedir(`/api/admin/eventos-viejos?dias=${dias}`, { metodo: 'DELETE' });
export const obtenerUsuarios = () => pedir('/api/admin/usuarios');
export const crearUsuario = (datos) => pedir('/api/admin/usuarios', { metodo: 'POST', json: datos });
export const actualizarUsuario = (id, cambios) => pedir(`/api/admin/usuarios/${id}`, { metodo: 'PATCH', json: cambios });
export const obtenerEstadisticas = () => pedir('/api/admin/estadisticas');

// Conexión en tiempo real (se reconecta sola si se cae)
export const socket = io(API_URL, { autoConnect: true });
