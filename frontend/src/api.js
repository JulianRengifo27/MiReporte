// ===== Comunicación con el backend (API REST + Socket.IO) =====
import { io } from 'socket.io-client';

// Dirección del backend. Se cambia con la variable VITE_API_URL (archivo frontend/.env)
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

async function pedir(ruta, opciones) {
  let resp;
  try {
    resp = await fetch(`${API_URL}${ruta}`, opciones);
  } catch {
    throw new Error('No hay conexión con el servidor. Revisa tu internet o que el backend esté encendido.');
  }
  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(datos.error || `Error ${resp.status}`);
  return datos;
}

export const obtenerEventos = ({ lat, lng }, radio = 30000) =>
  pedir(`/api/eventos?${new URLSearchParams({ lat, lng, radio })}`);

export const obtenerAlertasClima = () => pedir('/api/alertas-climaticas');

// Envía el reporte como formulario (multipart) para poder incluir la foto
export function crearReporte({ tipo, descripcion, lat, lng, foto }) {
  const form = new FormData();
  form.append('tipo', tipo);
  form.append('descripcion', descripcion || '');
  form.append('lat', lat);
  form.append('lng', lng);
  if (foto) form.append('foto', foto);
  return pedir('/api/reportes', { method: 'POST', body: form });
}

// Conexión en tiempo real (se reconecta sola si se cae)
export const socket = io(API_URL, { autoConnect: true });
