import { useCallback, useEffect, useMemo, useState } from 'react';
import { APP_NAME, APP_LEMA, RADIO_AVISO_M, MARGEN_PROXIMIDAD_M, TIPOS, TIPOS_CON_AREA } from './config.js';
import { emergenciasMock, alertasClimaMock } from './data/mockData.js';
import { distanciaMetros } from './utils/geo.js';
import { useUbicacion, usePreferencia } from './hooks.js';
import Mapa from './components/Mapa.jsx';
import Feed from './components/Feed.jsx';
import AlertasClima from './components/AlertasClima.jsx';
import AlertaProximidad, { mensajeProximidad } from './components/AlertaProximidad.jsx';
import MenuAccesibilidad from './components/MenuAccesibilidad.jsx';
import FormularioReporte from './components/FormularioReporte.jsx';

// Lee un texto en voz alta con la Web Speech API del navegador
function hablar(texto) {
  if (!('speechSynthesis' in window)) { alert(texto); return; }
  window.speechSynthesis.cancel();
  const voz = new SpeechSynthesisUtterance(texto);
  voz.lang = 'es-CO';
  window.speechSynthesis.speak(voz);
}

export default function App() {
  const { ubicacion, estadoGPS } = useUbicacion();
  const [emergencias, setEmergencias] = useState(emergenciasMock);
  const [seleccionada, setSeleccionada] = useState(null);
  const [formAbierto, setFormAbierto] = useState(false);
  const [vista, setVista] = useState('mapa'); // en celular: 'mapa' o 'lista'
  const [confirmacion, setConfirmacion] = useState('');
  const [zonasAvisadas, setZonasAvisadas] = useState([]);
  const [escala, setEscala] = usePreferencia('pilas-escala', 1);
  const [contraste, setContraste] = usePreferencia('pilas-contraste', false);

  // Aplicar preferencias de accesibilidad a toda la página
  useEffect(() => {
    document.documentElement.style.fontSize = `${escala * 100}%`;
    document.documentElement.classList.toggle('alto-contraste', contraste);
  }, [escala, contraste]);

  // Calcular distancia al usuario y ordenar (activas primero, luego por distancia)
  const conDistancia = useMemo(() => {
    const peso = { activa: 0, en_atencion: 1, resuelta: 2 };
    return emergencias
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
    alertasClimaMock.forEach((a) => partes.push(`Alerta ${a.nivel}: ${a.titulo}.`));
    hablar(partes.join(' '));
  }, [textoAviso, cercanas, conDistancia]);

  // Nuevo reporte (FASE 1: solo se agrega en memoria y aparece al instante en el mapa)
  function enviarReporte(datos) {
    const nueva = {
      id: Date.now(),
      ...datos,
      radio_m: TIPOS_CON_AREA.includes(datos.tipo) ? 200 : 0,
      estado: 'activa',
      origen: 'ciudadano',
      creado_en: new Date().toISOString(),
      via_bloqueada: ['accidente', 'trancon', 'inundacion', 'deslizamiento'].includes(datos.tipo),
    };
    setEmergencias((lista) => [nueva, ...lista]);
    setFormAbierto(false);
    setSeleccionada(nueva.id);
    setVista('mapa');
    setConfirmacion('✅ ¡Gracias! Tu reporte ya aparece en el mapa.');
    setTimeout(() => setConfirmacion(''), 4000);
  }

  return (
    <div className="app">
      <header className="encabezado">
        <div className="marca">
          <span className="marca-logo" aria-hidden="true">!</span>
          <div>
            <h1>{APP_NAME}</h1>
            <p className="lema">{APP_LEMA}</p>
          </div>
        </div>
        <MenuAccesibilidad
          escala={escala} setEscala={setEscala}
          contraste={contraste} setContraste={setContraste}
          onEscuchar={escucharAlertas}
        />
      </header>

      <div className={`aviso-superior ${cercanas.length ? 'aviso-peligro' : 'aviso-ok'}`} role="status" aria-live="polite">
        <span aria-hidden="true">{cercanas.length ? '⚠️' : '✅'}</span> {textoAviso}
        {estadoGPS === 'denegado' && <small> · Sin GPS: mostrando Bogotá</small>}
      </div>

      <AlertasClima alertas={alertasClimaMock} />

      {/* Pestañas solo visibles en celular */}
      <div className="pestanas" role="tablist">
        <button type="button" role="tab" aria-selected={vista === 'mapa'} onClick={() => setVista('mapa')}>🗺️ Mapa</button>
        <button type="button" role="tab" aria-selected={vista === 'lista'} onClick={() => setVista('lista')}>📋 Lista ({conDistancia.length})</button>
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
          <Mapa emergencias={conDistancia} ubicacion={ubicacion} seleccionada={seleccionada} onSeleccionar={setSeleccionada} />
          <div className="leyenda" aria-label="Leyenda de colores">
            {Object.values(TIPOS).map((t) => (
              <span key={t.etiqueta}><i style={{ background: t.color }} />{t.etiqueta}</span>
            ))}
          </div>
        </section>
      </main>

      <footer className="pie">
        Esta plataforma no reemplaza la línea 123. En una emergencia, llama al <a href="tel:123">123</a>.
      </footer>

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
    </div>
  );
}
