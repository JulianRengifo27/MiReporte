// ===== Iniciar sesión / Crear cuenta =====
import { useState } from 'react';
import { iniciarSesion, registrarse } from '../api.js';
import { useSesion } from '../sesion.jsx';
import { ir, useRuta } from '../ruta.js';

export default function Ingresar({ mensaje }) {
  const { entrar } = useSesion();
  const ruta = useRuta();
  // Si viene del aviso "Crea tu cuenta para reportar", la dirección trae ?registro y/o ?reportar
  const opciones = window.location.hash.split('?')[1] || '';
  const vieneAReportar = opciones.includes('reportar');
  const [modo, setModo] = useState(opciones.includes('registro') ? 'registro' : 'login'); // 'login' | 'registro'
  const [datos, setDatos] = useState({ nombre: '', email: '', password: '', acepta: false });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const r = modo === 'login'
        ? await iniciarSesion(datos.email, datos.password)
        : await registrarse({ nombre: datos.nombre, email: datos.email, password: datos.password, acepta_politica: datos.acepta });
      entrar(r.token, r.usuario);
      // Lleva a cada rol a su sección principal (si venía de una página protegida, se queda en ella)
      // Si venía a reportar, vuelve al mapa con el formulario abierto
      if (vieneAReportar) ir('/mapa?reportar');
      else if (ruta === '/ingresar') {
        const p = r.usuario.permisos;
        ir(p.includes('revisar_reportes') ? '/admin' : p.includes('publicar_oficial') ? '/oficial' : '/mapa');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pagina pagina-angosta">
      <h2>{modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta de ciudadano'}</h2>
      {mensaje && <p className="nota">{mensaje}</p>}
      <p className="nota">
        {vieneAReportar
          ? 'Inicia sesión o crea tu cuenta y volverás directo al formulario de reporte.'
          : 'Con una cuenta puedes reportar emergencias y ver el historial de tus reportes. Ver el mapa no requiere cuenta.'}
      </p>

      <form className="formulario" onSubmit={enviar}>
        {modo === 'registro' && (
          <label className="campo"><span className="campo-etiqueta">Nombre</span>
            <input value={datos.nombre} onChange={cambiar('nombre')} autoComplete="name" required maxLength={100} />
          </label>
        )}
        <label className="campo"><span className="campo-etiqueta">Correo</span>
          <input type="email" value={datos.email} onChange={cambiar('email')} autoComplete="email" required />
        </label>
        <label className="campo"><span className="campo-etiqueta">Contraseña</span>
          <input type="password" value={datos.password} onChange={cambiar('password')} required minLength={8}
            autoComplete={modo === 'login' ? 'current-password' : 'new-password'} />
          {modo === 'registro' && <small>Mínimo 8 caracteres, con letras y números.</small>}
        </label>
        {modo === 'registro' && (
          <label className="casilla">
            <input type="checkbox" checked={datos.acepta} onChange={cambiar('acepta')} required />
            <span>Acepto la <a href="#/privacidad" target="_blank" rel="noopener">Política de privacidad</a> y los <a href="#/terminos" target="_blank" rel="noopener">Términos</a>.</span>
          </label>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="boton boton-primario" disabled={enviando}>
          {enviando ? 'Un momento…' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      <button type="button" className="boton-enlace" onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); setError(''); }}>
        {modo === 'login' ? '¿No tienes cuenta? Créala aquí' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
      <p className="nota">Las cuentas de entidades oficiales las crea el administrador.</p>
    </div>
  );
}
