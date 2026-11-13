// ===== Sesión del usuario (quién está logueado y qué puede hacer) =====
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { guardarToken, leerToken, obtenerPerfil, onSesionExpirada } from './api.js';

const SesionContexto = createContext(null);

export function ProveedorSesion({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(Boolean(leerToken()));

  const salir = useCallback(() => { guardarToken(null); setUsuario(null); }, []);

  // Al abrir la página, si hay un token guardado, pedimos el perfil para saber si sigue siendo válido
  useEffect(() => {
    onSesionExpirada(salir);
    if (!leerToken()) return;
    obtenerPerfil().then(setUsuario).catch(salir).finally(() => setVerificando(false));
  }, [salir]);

  const entrar = useCallback((token, datosUsuario) => { guardarToken(token); setUsuario(datosUsuario); }, []);
  const tiene = useCallback((permiso) => Boolean(usuario?.permisos?.includes(permiso)), [usuario]);

  return (
    <SesionContexto.Provider value={{ usuario, verificando, entrar, salir, tiene }}>
      {children}
    </SesionContexto.Provider>
  );
}

export const useSesion = () => useContext(SesionContexto);
