// ===== Esqueleto de la app: encabezado, menú, página actual y pie =====
import { useEffect, useState } from 'react';
import { APP_NAME } from './config.js';
import Logo from './components/Logo.jsx';
import Bienvenida from './pages/Bienvenida.jsx';
import { useUbicacion, usePreferencia } from './hooks.js';
import { useRuta } from './ruta.js';
import { useSesion } from './sesion.jsx';
import { hablar } from './utils/voz.js';
import MenuAccesibilidad from './components/MenuAccesibilidad.jsx';
import Inicio from './pages/Inicio.jsx';
import Ingresar from './pages/Ingresar.jsx';
import MisReportes from './pages/MisReportes.jsx';
import PanelOficial from './pages/PanelOficial.jsx';
import PanelAdmin from './pages/PanelAdmin.jsx';
import { Privacidad, Terminos } from './pages/Legal.jsx';
import Compartir from './pages/Compartir.jsx';

const AVISO_123 = 'Esta plataforma no reemplaza la línea 123. En una emergencia, llama al 123.';

export default function App() {
  const ruta = useRuta();
  const { usuario, verificando, salir, tiene } = useSesion();
  const { ubicacion, estadoGPS } = useUbicacion();
  const [escala, setEscala] = usePreferencia('mireporte-escala', 1);
  const [contraste, setContraste] = usePreferencia('mireporte-contraste', false);
  const [escucharPagina, setEscucharPagina] = useState(null);

  // Aplicar preferencias de accesibilidad a toda la página
  useEffect(() => {
    document.documentElement.style.fontSize = `${escala * 100}%`;
    document.documentElement.classList.toggle('alto-contraste', contraste);
  }, [escala, contraste]);

  // Página protegida: si no tiene el permiso, se le pide iniciar sesión
  const protegida = (permiso, pagina) => {
    if (verificando) return <div className="pagina"><p>Verificando sesión…</p></div>;
    if (!usuario) return <Ingresar mensaje="Inicia sesión para entrar a esta sección." />;
    if (!tiene(permiso)) return <div className="pagina"><h2>Sin acceso</h2><p>Tu cuenta no tiene permiso para ver esta sección.</p><a className="boton boton-primario" href="#/mapa">Ir al mapa</a></div>;
    return pagina;
  };

  let pagina;
  switch (ruta) {
    case '/ingresar': pagina = <Ingresar />; break;
    case '/mis-reportes': pagina = protegida('ver_mis_reportes', <MisReportes />); break;
    case '/oficial': pagina = protegida('publicar_oficial', <PanelOficial ubicacion={ubicacion} />); break;
    case '/admin': pagina = protegida('revisar_reportes', <PanelAdmin />); break;
    case '/privacidad': pagina = <Privacidad />; break;
    case '/terminos': pagina = <Terminos />; break;
    case '/compartir': pagina = <Compartir />; break;
    case '/mapa': pagina = <Inicio ubicacion={ubicacion} estadoGPS={estadoGPS} registrarEscuchar={setEscucharPagina} />; break;
    default: pagina = <Bienvenida />;
  }
  const esMapa = ruta === '/mapa';

  const enlace = (href, texto) => (
    <a href={`#${href}`} aria-current={ruta === href ? 'page' : undefined}>{texto}</a>
  );

  return (
    <div className={`app ${esMapa ? 'app-mapa' : 'app-pagina'}`}>
      <a className="saltar" href="#contenido" onClick={(e) => { e.preventDefault(); document.getElementById('contenido')?.focus(); }}>Saltar al contenido</a>
      <header className="encabezado">
        <a className="marca" href="#/" aria-label={`${APP_NAME}, ir al inicio`}><Logo /></a>

        <nav className="navegacion" aria-label="Menú principal">
          {enlace('/', 'Inicio')}
          {enlace('/mapa', 'Mapa')}
          {usuario && tiene('ver_mis_reportes') && enlace('/mis-reportes', 'Mis reportes')}
          {tiene('publicar_oficial') && enlace('/oficial', 'Panel oficial')}
          {tiene('revisar_reportes') && enlace('/admin', 'Administración')}
          {enlace('/compartir', 'Compartir')}
        </nav>

        <div className="encabezado-acciones">
          {usuario
            ? <button type="button" className="boton-texto" onClick={() => { salir(); window.location.hash = '/'; }}>Salir</button>
            : <a className="boton-texto" href="#/ingresar" aria-current={ruta === '/ingresar' ? 'page' : undefined}>Ingresar</a>}
          <MenuAccesibilidad
            escala={escala} setEscala={setEscala}
            contraste={contraste} setContraste={setContraste}
            onEscuchar={() => (esMapa && escucharPagina ? escucharPagina() : hablar(AVISO_123))}
          />
        </div>
      </header>

      <div id="contenido" tabIndex={-1} className="contenido">{pagina}</div>

      <footer className="pie">
        <span>Esta plataforma no reemplaza la línea 123. En una emergencia, llama al <a href="tel:123">123</a>.</span>
        <span className="pie-enlaces"><a href="#/privacidad">Privacidad</a><a href="#/terminos">Términos</a></span>
      </footer>
    </div>
  );
}
