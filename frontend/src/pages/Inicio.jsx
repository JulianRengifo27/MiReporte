// ===== Página principal: mapa, lista, alertas y botón de reportar =====
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RADIO_AVISO_M, MARGEN_PROXIMIDAD_M, TIPOS, TIPOS_CON_AREA } from '../config.js';
import { obtenerEventos, obtenerAlertasClima, crearReporte, socket } from '../api.js';
import { distanciaMetros } from '../utils/geo.js';
import { hablar } from '../utils/voz.js';
import { useSesion } from '../sesion.jsx';
import Mapa from '../components/Mapa.jsx';
import Feed from '../components/Feed.jsx';
import AlertasClima from '../components/AlertasClima.jsx';
import AlertaProximidad, { mensajeProximidad } from '../components/AlertaProximidad.jsx';
import FormularioReporte from '../components/FormularioReporte.jsx';
import PanelRuta from '../components/PanelRuta.jsx';
import { IconoRuta } from '../components/Iconos.jsx';
import { calcularRutaSegura } from '../utils/rutas.js';

export default function Inicio({ ubicacion, estadoGPS, registrarEscuchar }) {
  const { usuario } = useSesion();
  const [emergencias, setEmergencias] = useState([]);
  const [alertasClima, setAlertasClima] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [conectado, setConectado] = useState(socket.connected);
  const [seleccionada, setSeleccionada] = useState(null);
  const [formAbierto, setFormAbierto] = useState(false);
  const [vista, setVista] = useState('mapa'); // en celular: 'mapa' o 'lista'
  const [confirmacion, setConfirmacion] = useState('');
  const [zonasAvisadas, setZonasAvisadas] = useState([]);
  // Ruta segura (OSRM): null | 'eligiendo' | 'calculando' | 'lista'
  const [rutaEstado, setRutaEstado] = useState(null);
  const [destino, setDestino] = useState(null);
  const [ruta, setRuta] = useState(null);
  const [errorRuta, setErrorRuta] = useState('');

  function empezarRuta() {
    setRutaEstado('eligiendo'); setDestino(null); setRuta(null); setErrorRuta('');
    setSeleccionada(null); setVista('mapa');
  }
  function cerrarRuta() {
    setRutaEstado(null); setDestino(null); setRuta(null); setErrorRuta('');
  }
  async function elegirDestino(punto) {
    setDestino(punto); setRutaEstado('calculando'); setErrorRuta('');
    try {
      setRuta(await calcularRutaSegura(ubicacion, punto, emergencias));
      setRutaEstado('lista');
    } catch (err) {
      setErrorRuta(err.message);
      setRutaEstado('eligiendo');
    }
  }

  // Si se llega desde el botón "Reportar emergencia" del inicio (#/mapa?reportar), abrir el formulario de una vez
  // (también si ya estábamos en el mapa y cambia la dirección)
  useEffect(() => {
    const revisar = () => {
      if (window.location.hash.includes('reportar')) {
        setFormAbierto(true);
        window.history.replaceState(null, '', '#/mapa');
      }
    };
    revisar();
    window.addEventListener('hashchange', revisar);
    return () => window.removeEventListener('hashchange', revisar);
  }, []);

  // Cargar emergencias de la API cuando ya sabemos dónde está el usuario
  const cargarEventos = useCallback(async (punto) => {
    try {
      setEmergencias(await obtenerEventos(punto));
      setErrorCarga('');
    } catch (err) {
      setErrorCarga(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  const ubicacionRef = useRef(ubicacion);
  ubicacionRef.current = ubicacion;

  useEffect(() => {
    if (estadoGPS === 'buscando') return; // esperamos la respuesta del GPS (o la negación)
    cargarEventos(ubicacionRef.current);
  }, [estadoGPS, cargarEventos]);

  useEffect(() => {
    obtenerAlertasClima().then(setAlertasClima).catch(() => {});
  }, []);

  // Tiempo real: Socket.IO avisa cuando hay un evento nuevo o actualizado
  useEffect(() => {
    // Inserta o reemplaza un evento en la lista
    const guardar = (ev) => setEmergencias((lista) => [ev, ...lista.filter((x) => x.id !== ev.id)]);
    const alConectar = () => {
      setConectado(true);
      cargarEventos(ubicacionRef.current); // por si nos perdimos algo mientras estábamos desconectados
    };
    const alDesconectar = () => setConectado(false);
    const quitar = ({ id }) => setEmergencias((lista) => lista.filter((x) => x.id !== id));
    socket.on('nuevo_evento', guardar);
    socket.on('evento_actualizado', guardar);
    socket.on('evento_eliminado', quitar);
    socket.on('connect', alConectar);
    socket.on('disconnect', alDesconectar);
    return () => {
      socket.off('nuevo_evento', guardar);
      socket.off('evento_actualizado', guardar);
      socket.off('evento_eliminado', quitar);
      socket.off('connect', alConectar);
      socket.off('disconnect', alDesconectar);
    };
  }, [cargarEventos]);

  // Calcular distancia al usuario y ordenar (activas primero, luego por distancia)
  const conDistancia = useMemo(() => {
    const peso = { activa: 0, en_atencion: 1, resuelta: 2 };
    return emergencias
      .filter((e) => e.estado in peso) // por si llega algún estado no público
      .map((e) => ({ ...e, distancia: distanciaMetros(ubicacion, e) }))
      .sort((a, b) => peso[a.estado] - peso[b.estado] || a.distancia - b.distancia);
  }, [emergencias, ubicacion]);

  const cercanas = conDistancia.filter((e) => e.estado !== 'resuelta' && e.distancia <= RADIO_AVISO_M);

  // Zona de riesgo en la que está el usuario (si hay alguna que no se haya avisado aún)
  const zonaCerca = conDistancia.find(
    (e) => TIPOS_CON_AREA.includes(e.tipo) && e.estado !== 'resuelta' && e.radio_m > 0 &&
      e.distancia <= e.radio_m + MARGEN_PROXIMIDAD_M && !zonasAvisadas.includes(e.id)
  );

  const textoAviso = cercanas.length === 0
    ? 'No hay emergencias activas a menos de 2 km'
    : `Hay ${cercanas.length} ${cercanas.length === 1 ? 'emergencia' : 'emergencias'} a menos de 2 km`;

  // "Escuchar alerta": lee el aviso principal, las zonas cercanas y las alertas climáticas
  const escucharAlertas = useCallback(() => {
    const partes = [textoAviso + '.'];
    cercanas.slice(0, 3).forEach((e) => partes.push(`${TIPOS[e.tipo].etiqueta} a ${Math.round(e.distancia)} metros.`));
    const zona = conDistancia.find((e) => TIPOS_CON_AREA.includes(e.tipo) && e.estado !== 'resuelta' && e.distancia <= e.radio_m + MARGEN_PROXIMIDAD_M);
    if (zona) partes.push(mensajeProximidad(zona));
    alertasClima.forEach((a) => partes.push(`Alerta ${a.nivel}: ${a.titulo}.`));
    hablar(partes.join(' '));
  }, [textoAviso, cercanas, conDistancia, alertasClima]);

  // Le pasamos al menú de accesibilidad (que está en el encabezado) qué debe leer en esta página.
  // Se registra UNA sola vez una función estable que siempre llama a la versión más reciente
  // (si registráramos escucharAlertas directamente, cambiaría en cada render y causaría un bucle).
  const escucharRef = useRef(escucharAlertas);
  escucharRef.current = escucharAlertas;
  useEffect(() => {
    registrarEscuchar(() => () => escucharRef.current());
    return () => registrarEscuchar(null);
  }, [registrarEscuchar]);

  // Nuevo reporte: se envía a la API. Si falla, el formulario muestra el error.
  async function enviarReporte(datos) {
    const r = await crearReporte(datos);
    setFormAbierto(false);
    if (r.en_revision || !r.evento) {
      // La IA lo marcó como dudoso: no sale en el mapa hasta que lo revise un administrador
      setConfirmacion('🕵️ Gracias. Tu reporte quedó en revisión antes de publicarse.');
    } else {
      const nueva = r.evento;
      // Lo agregamos de una vez (el socket también lo traerá; no se duplica porque se reemplaza por id)
      setEmergencias((lista) => [nueva, ...lista.filter((x) => x.id !== nueva.id)]);
      setSeleccionada(nueva.id);
      setVista('mapa');
      setConfirmacion(r.unido_a_evento_existente
        ? `✅ ¡Gracias! Ya estaba reportado: ahora ${nueva.cantidad_reportes} personas lo confirman.`
        : '✅ ¡Gracias! Tu reporte ya aparece en el mapa.');
    }
    if (usuario) setConfirmacion((t) => `${t} Lo verás en "Mis reportes".`);
    setTimeout(() => setConfirmacion(''), 5000);
  }

  return (
    <>
      <div className={`aviso-superior ${cercanas.length ? 'aviso-peligro' : 'aviso-ok'}`} role="status" aria-live="polite">
        <span aria-hidden="true">{cercanas.length ? '⚠️' : '✅'}</span> {textoAviso}
        {estadoGPS === 'denegado' && <small> · Sin GPS: mostrando Bogotá</small>}
        {!conectado && !errorCarga && !cargando && <small> · Reconectando tiempo real…</small>}
      </div>

      {errorCarga && (
        <div className="aviso-superior aviso-error" role="alert">
          {errorCarga} <button type="button" className="boton boton-secundario" onClick={() => cargarEventos(ubicacion)}>Reintentar</button>
        </div>
      )}
      {cargando && <div className="aviso-superior aviso-ok" role="status">Cargando emergencias…</div>}

      <AlertasClima alertas={alertasClima} />

      {/* Pestañas solo visibles en celular */}
      <div className="pestanas" role="tablist">
        <button type="button" role="tab" aria-selected={vista === 'mapa'} onClick={() => setVista('mapa')}>Mapa</button>
        <button type="button" role="tab" aria-selected={vista === 'lista'} onClick={() => setVista('lista')}>Lista ({conDistancia.length})</button>
      </div>

      <main className={`principal vista-${vista}`}>
        <aside className="lateral" aria-label="Emergencias cercanas">
          <h2 className="lateral-titulo">Emergencias cercanas</h2>
          <Feed
            emergencias={conDistancia}
            seleccionada={seleccionada}
            onSeleccionar={(id) => { setSeleccionada(id); setVista('mapa'); }}
          />
        </aside>
        <section className="zona-mapa">
          <Mapa
            emergencias={conDistancia} ubicacion={ubicacion}
            seleccionada={seleccionada} onSeleccionar={setSeleccionada}
            ruta={ruta} destino={destino}
            eligiendoDestino={rutaEstado === 'eligiendo'} onElegirDestino={elegirDestino}
          />
          {rutaEstado
            ? <PanelRuta estado={rutaEstado} resultado={ruta} error={errorRuta} onCerrar={cerrarRuta} onOtroDestino={empezarRuta} />
            : <button type="button" className="boton-ruta-segura" onClick={empezarRuta}><IconoRuta tam={18} /> Ruta segura</button>}
          <div className="leyenda" aria-label="Leyenda de colores">
            {Object.values(TIPOS).map((t) => (
              <span key={t.etiqueta}><i style={{ background: t.color }} />{t.etiqueta}</span>
            ))}
          </div>
        </section>
      </main>

      <button type="button" className="boton-reportar-flotante" onClick={() => setFormAbierto(true)}>
        <span aria-hidden="true">＋</span> Reportar emergencia
      </button>

      {confirmacion && <div className="toast" role="status">{confirmacion}</div>}

      {formAbierto && (
        <FormularioReporte ubicacion={ubicacion} estadoGPS={estadoGPS} onEnviar={enviarReporte} onCerrar={() => setFormAbierto(false)} />
      )}

      {!formAbierto && zonaCerca && (
        <AlertaProximidad
          emergencia={zonaCerca}
          onEscuchar={hablar}
          onCerrar={() => setZonasAvisadas((z) => [...z, zonaCerca.id])}
          onVer={() => { setZonasAvisadas((z) => [...z, zonaCerca.id]); setSeleccionada(zonaCerca.id); setVista('mapa'); }}
        />
      )}
    </>
  );
}
