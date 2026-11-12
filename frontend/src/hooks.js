import { useEffect, useState } from 'react';
import { UBICACION_POR_DEFECTO } from './config.js';

// Pide permiso de GPS y sigue la ubicación del usuario.
// Si lo niega (o no hay GPS), usa Bogotá como ubicación por defecto.
export function useUbicacion() {
  const [ubicacion, setUbicacion] = useState(UBICACION_POR_DEFECTO);
  const [estadoGPS, setEstadoGPS] = useState('buscando'); // buscando | ok | denegado

  useEffect(() => {
    if (!('geolocation' in navigator)) { setEstadoGPS('denegado'); return; }
    const id = navigator.geolocation.watchPosition(
      (pos) => { setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setEstadoGPS('ok'); },
      () => setEstadoGPS('denegado'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { ubicacion, estadoGPS };
}

// Preferencias de accesibilidad guardadas en el navegador
export function usePreferencia(clave, inicial) {
  const [valor, setValor] = useState(() => {
    try { const v = localStorage.getItem(clave); return v != null ? JSON.parse(v) : inicial; } catch { return inicial; }
  });
  useEffect(() => {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento: no pasa nada */ }
  }, [clave, valor]);
  return [valor, setValor];
}
