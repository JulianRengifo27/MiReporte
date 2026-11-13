// ===== Navegación simple por "hash" (#/login, #/admin, ...) =====
// No necesita librerías y funciona en cualquier hosting estático.
import { useEffect, useState } from 'react';

const leer = () => (window.location.hash.replace(/^#/, '') || '/').split('?')[0];

export function useRuta() {
  const [ruta, setRuta] = useState(leer);
  useEffect(() => {
    const cambio = () => { setRuta(leer()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', cambio);
    return () => window.removeEventListener('hashchange', cambio);
  }, []);
  return ruta;
}

export const ir = (ruta) => { window.location.hash = ruta; };
