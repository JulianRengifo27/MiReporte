// Aviso que aparece al tocar "Reportar emergencia" sin haber iniciado sesión.
// Lleva a crear la cuenta o a iniciar sesión, y luego regresa directo al formulario.
import { useEffect, useRef } from 'react';

export default function AvisoCuenta({ onCerrar }) {
  const boton = useRef(null);
  useEffect(() => { boton.current?.focus(); }, []);
  useEffect(() => {
    const tecla = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onCerrar]);

  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-labelledby="cuenta-titulo"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal modal-alerta">
        <h2 id="cuenta-titulo">Crea tu cuenta para reportar</h2>
        <p>
          Para reportar una emergencia necesitas una cuenta. Así evitamos reportes falsos y puedes ver
          el historial de tus reportes. Tu nombre <strong>nunca</strong> se muestra en el mapa.
        </p>
        <p className="nota">Crearla toma menos de un minuto. Ver el mapa sigue siendo libre.</p>
        <div className="modal-acciones">
          <a className="boton boton-secundario" href="#/ingresar?reportar">Ya tengo cuenta</a>
          <a className="boton boton-primario" href="#/ingresar?registro&reportar" ref={boton}>Crear cuenta</a>
        </div>
        <p className="aviso-123">En una emergencia, llama al <a href="tel:123">123</a>.</p>
      </div>
    </div>
  );
}
