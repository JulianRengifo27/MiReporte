// ===== Página de INICIO (presentación de la plataforma) =====
import { useEffect, useState } from 'react';
import { APP_NAME, UBICACION_POR_DEFECTO } from '../config.js';
import { obtenerEventos } from '../api.js';
import { IconoLogo } from '../components/Logo.jsx';
import {
  IconoMapa, IconoEscudo, IconoRuta, IconoAccesible, IconoCamara, IconoChispa, IconoCampana, IconoTelefono, IconoFlecha,
} from '../components/Iconos.jsx';

const PASOS = [
  { icono: IconoCamara, titulo: 'Reporta', texto: 'Con tu cuenta, elige qué pasa, confirma el lugar en el mapa y agrega una foto si quieres. En segundos.' },
  { icono: IconoChispa, titulo: 'Se verifica', texto: 'La inteligencia artificial une los reportes repetidos, filtra los falsos y asigna una prioridad.' },
  { icono: IconoCampana, titulo: 'Todos se enteran', texto: 'La emergencia aparece al instante en el mapa de quienes están cerca, con recomendaciones.' },
];

const FUNCIONES = [
  { icono: IconoMapa, titulo: 'Mapa en tiempo real', texto: 'Accidentes, incendios, inundaciones, deslizamientos y trancones cerca de ti.' },
  { icono: IconoEscudo, titulo: 'Fuentes oficiales', texto: 'Bomberos, Tránsito, Cruz Roja, Defensa Civil y Alcaldía publican reportes verificados.' },
  { icono: IconoRuta, titulo: 'Ruta segura', texto: 'Calcula un camino que evita las zonas afectadas y ábrelo en tu app de mapas.' },
  { icono: IconoAccesible, titulo: 'Para todos', texto: 'Letra ajustable, alto contraste y alertas en voz alta. Gratis y sin descargas.' },
];

export default function Bienvenida() {
  const [activas, setActivas] = useState(null);

  // Dato en vivo: cuántas emergencias activas hay ahora en la ciudad
  useEffect(() => {
    obtenerEventos(UBICACION_POR_DEFECTO, 40000)
      .then((lista) => setActivas(lista.filter((e) => e.estado !== 'resuelta').length))
      .catch(() => setActivas(null));
  }, []);

  return (
    <div className="bienvenida">
      <section className="hero">
        <IconoLogo tam={64} className="hero-logo" />
        <h1 className="hero-titulo">Reporta emergencias en segundos.<br /><span>Entérate de lo que pasa a tu alrededor.</span></h1>
        <p className="hero-texto">{APP_NAME} reúne en un solo mapa los reportes de la ciudadanía y de las entidades oficiales. Gratis y sin descargas: consulta el mapa libremente y crea tu cuenta para reportar.</p>
        <div className="hero-acciones">
          <a className="boton boton-primario boton-grande" href="#/mapa?reportar">Reportar emergencia</a>
          <a className="boton boton-secundario boton-grande" href="#/mapa">Ver el mapa <IconoFlecha tam={18} /></a>
        </div>
        {activas !== null && (
          <p className="hero-vivo" aria-live="polite">
            <span className="punto-vivo" aria-hidden="true" />
            {activas === 0 ? 'Sin emergencias activas en este momento' : `${activas} ${activas === 1 ? 'emergencia activa' : 'emergencias activas'} ahora en Bogotá`}
          </p>
        )}
      </section>

      <p className="aviso-linea">
        <IconoTelefono tam={18} />
        <span>Esta plataforma no reemplaza la línea 123. En una emergencia, llama al <a href="tel:123">123</a>.</span>
      </p>

      <section className="seccion">
        <h2 className="seccion-titulo">Cómo funciona</h2>
        <ol className="pasos-grid">
          {PASOS.map(({ icono: Icono, titulo, texto }, i) => (
            <li key={titulo} className="paso">
              <span className="paso-numero">{i + 1}</span>
              <Icono tam={26} />
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="seccion">
        <h2 className="seccion-titulo">Qué puedes hacer</h2>
        <div className="funciones-grid">
          {FUNCIONES.map(({ icono: Icono, titulo, texto }) => (
            <div key={titulo} className="funcion">
              <span className="funcion-icono"><Icono tam={22} /></span>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="seccion seccion-entidades">
        <div>
          <h2 className="seccion-titulo">¿Eres una entidad oficial?</h2>
          <p>Publica reportes verificados, actualiza el estado de las emergencias y recomienda desvíos a la ciudadanía.</p>
        </div>
        <a className="boton boton-secundario" href="#/ingresar">Ingresar al panel</a>
      </section>
    </div>
  );
}
