import { useCallback, useEffect, useRef, useState } from 'react';
import { UBICACION_POR_DEFECTO } from './config.js';

// Pide permiso de GPS y sigue la ubicación del usuario.
// Si lo niega (o no hay GPS), usa Bogotá como ubicación por defecto.
// Devuelve también la precisión (en metros) y una función para pedir la ubicación de nuevo.
export function useUbicacion() {
  const [ubicacion, setUbicacion] = useState(UBICACION_POR_DEFECTO);
  const [precision, setPrecision] = useState(null);
  const [estadoGPS, setEstadoGPS] = useState('buscando'); // buscando | ok | denegado
  const tieneUbicacion = useRef(false);

  const alRecibir = useCallback((pos) => {
    tieneUbicacion.current = true;
    setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    setPrecision(Math.round(pos.coords.accuracy));
    setEstadoGPS('ok');
  }, []);

  // Un error de "tiempo agotado" no significa que el usuario negó el permiso:
  // si ya teníamos una ubicación, la conservamos.
  const alFallar = useCallback((err) => {
    if (err.code === err.PERMISSION_DENIED || !tieneUbicacion.current) setEstadoGPS('denegado');
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) { setEstadoGPS('denegado'); return; }
    const id = navigator.geolocation.watchPosition(alRecibir, alFallar,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
    return () => navigator.geolocation.clearWatch(id);
  }, [alRecibir, alFallar]);

  // Pide la ubicación una vez más (botón "Mi ubicación"). Resuelve con la ubicación o con un error.
  const pedirUbicacion = useCallback(() => new Promise((resolver, rechazar) => {
    if (!('geolocation' in navigator)) { rechazar(new Error('Este navegador no permite conocer tu ubicación.')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { alRecibir(pos); resolver({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      (err) => {
        alFallar(err);
        rechazar(new Error(err.code === err.PERMISSION_DENIED
          ? 'No diste permiso de ubicación. Actívalo en el candado de la barra de direcciones.'
          : 'No pudimos obtener tu ubicación. Intenta de nuevo.'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }), [alRecibir, alFallar]);

  return { ubicacion, estadoGPS, precision, pedirUbicacion };
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
