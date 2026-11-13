import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { ESTILO_OSM, escaparHTML } from '../utils/mapa.js';
import { TIPOS, TIPOS_CON_AREA, ESTADOS, PRIORIDADES, textoReportes } from '../config.js';
import { circuloGeoJSON, formatoHora, formatoHace, linkRutaAlternativa } from '../utils/geo.js';

// Contenido HTML del popup que aparece al tocar un marcador o un área
function htmlPopup(e, ubicacion) {
  const t = TIPOS[e.tipo];
  const sello = e.origen === 'oficial'
    ? `<span class="sello-oficial">✔ Verificado · ${escaparHTML(e.entidad || 'Oficial')}</span>`
    : '<span class="chip chip-ciudadano">Ciudadano</span>';
  const desvio = e.via_bloqueada || e.desvio
    ? `<div class="popup-desvio"><strong>🛣️ Desvío recomendado:</strong> ${escaparHTML(e.desvio || 'Evita esta vía mientras se atiende la emergencia.')}</div>
       <a class="boton-ruta" href="${linkRutaAlternativa(ubicacion, e)}" target="_blank" rel="noopener noreferrer">Ver ruta alternativa ↗</a>`
    : '';
  return `
    <div class="popup">
      <div class="popup-titulo" style="--color:${t.color}">${t.icono} ${t.etiqueta}</div>
      <div class="popup-chips"><span class="chip ${ESTADOS[e.estado].clase}">${ESTADOS[e.estado].etiqueta}</span>${PRIORIDADES[e.prioridad] ? `<span class="chip ${PRIORIDADES[e.prioridad].clase}">${PRIORIDADES[e.prioridad].etiqueta}</span>` : ''}${sello}</div>
      <p class="popup-conteo">${textoReportes(e.cantidad_reportes || 1)}</p>
      <p>${escaparHTML(e.descripcion || 'Sin descripción.')}</p>
      ${e.foto_url ? `<img class="popup-foto" src="${escaparHTML(e.foto_url)}" alt="Foto del reporte" />` : ''}
      <p class="popup-hora">🕒 ${formatoHora(e.creado_en)} (${formatoHace(e.creado_en)})</p>
      <p class="popup-reco"><strong>Recomendación:</strong> ${t.recomendacion}</p>
      ${desvio}
    </div>`;
}

const VACIO = { type: 'FeatureCollection', features: [] };

export default function Mapa({ emergencias, ubicacion, seleccionada, onSeleccionar, ruta, destino, eligiendoDestino, onElegirDestino }) {
  const marcadorDestino = useRef(null);
  const eligiendoRef = useRef(eligiendoDestino);
  eligiendoRef.current = eligiendoDestino;
  const onElegirRef = useRef(onElegirDestino);
  onElegirRef.current = onElegirDestino;
  const rutaRef = useRef(ruta);
  rutaRef.current = ruta;
  const contenedor = useRef(null);
  const mapa = useRef(null);
  const marcadores = useRef([]);
  const marcadorUsuario = useRef(null);
  const popup = useRef(null);
  const listo = useRef(false);
  const usuarioMovioMapa = useRef(false);

  // Referencias para usar siempre los valores más recientes dentro de los eventos del mapa
  const onSeleccionarRef = useRef(onSeleccionar);
  onSeleccionarRef.current = onSeleccionar;
  const emergenciasRef = useRef(emergencias);
  emergenciasRef.current = emergencias;

  // Dibuja las áreas circulares de riesgo (inundación, deslizamiento, incendio)
  function pintarAreas() {
    const m = mapa.current;
    if (!m || !listo.current) return;
    const features = emergenciasRef.current
      .filter((e) => TIPOS_CON_AREA.includes(e.tipo) && e.radio_m > 0 && e.estado !== 'resuelta')
      .map((e) => ({ type: 'Feature', properties: { id: e.id, color: TIPOS[e.tipo].color }, geometry: circuloGeoJSON(e, e.radio_m) }));
    m.getSource('areas')?.setData({ type: 'FeatureCollection', features });
  }

  function pintarRuta() {
    const m = mapa.current;
    if (!m || !listo.current) return;
    const r = rutaRef.current;
    if (!r) { m.getSource('ruta')?.setData(VACIO); return; }
    m.getSource('ruta')?.setData({
      type: 'FeatureCollection',
      features: [
        ...r.otras.map((o) => ({ type: 'Feature', properties: { tipo: 'otra' }, geometry: o.geometry })),
        { type: 'Feature', properties: { tipo: 'mejor' }, geometry: r.mejor.geometry },
      ],
    });
  }

  // 1) Crear el mapa una sola vez
  useEffect(() => {
    const m = new maplibregl.Map({
      container: contenedor.current,
      style: ESTILO_OSM,
      center: [ubicacion.lng, ubicacion.lat],
      zoom: 13,
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    m.on('load', () => {
      m.addSource('areas', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'areas-relleno', type: 'fill', source: 'areas', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.25 } });
      m.addLayer({ id: 'areas-borde', type: 'line', source: 'areas', paint: { 'line-color': ['get', 'color'], 'line-width': 2, 'line-dasharray': [2, 1] } });
      // Capas de la ruta segura: alternativas descartadas (rojo punteado) y la elegida (verde)
      m.addSource('ruta', { type: 'geojson', data: VACIO });
      m.addLayer({ id: 'ruta-otras', type: 'line', source: 'ruta', filter: ['==', ['get', 'tipo'], 'otra'],
        layout: { 'line-cap': 'round' }, paint: { 'line-color': '#c62828', 'line-width': 4, 'line-opacity': 0.6, 'line-dasharray': [1, 2] } });
      m.addLayer({ id: 'ruta-borde', type: 'line', source: 'ruta', filter: ['==', ['get', 'tipo'], 'mejor'],
        layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 9 } });
      m.addLayer({ id: 'ruta-mejor', type: 'line', source: 'ruta', filter: ['==', ['get', 'tipo'], 'mejor'],
        layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#2e7d32', 'line-width': 6 } });
      m.on('click', 'areas-relleno', (ev) => { if (!eligiendoRef.current) onSeleccionarRef.current?.(ev.features[0].properties.id); });
      m.on('mouseenter', 'areas-relleno', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'areas-relleno', () => { m.getCanvas().style.cursor = ''; });
      listo.current = true;
      pintarAreas();
      pintarRuta();
    });
    // Modo "elegir destino": tocar el mapa fija el destino de la ruta segura
    m.on('click', (ev) => { if (eligiendoRef.current) onElegirRef.current?.({ lat: ev.lngLat.lat, lng: ev.lngLat.lng }); });
    m.on('dragstart', () => { usuarioMovioMapa.current = true; });
    mapa.current = m;
    return () => m.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Dibujar marcadores y áreas cada vez que cambian las emergencias
  useEffect(() => {
    const m = mapa.current;
    marcadores.current.forEach((mk) => mk.remove());
    marcadores.current = emergencias.map((e) => {
      const t = TIPOS[e.tipo];
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `marcador${e.estado === 'resuelta' ? ' marcador-resuelto' : ''}${e.origen === 'oficial' ? ' marcador-oficial' : ''}`;
      el.style.setProperty('--color', t.color);
      el.innerHTML = `<span aria-hidden="true">${t.icono}</span>`;
      el.setAttribute('aria-label', `${t.etiqueta}, ${ESTADOS[e.estado].etiqueta}`);
      el.addEventListener('click', (ev) => { ev.stopPropagation(); onSeleccionarRef.current?.(e.id); });
      return new maplibregl.Marker({ element: el }).setLngLat([e.lng, e.lat]).addTo(m);
    });
    pintarAreas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emergencias]);

  // 3) Punto azul con la ubicación del usuario; se recentra hasta que el usuario mueva el mapa
  useEffect(() => {
    const m = mapa.current;
    if (!marcadorUsuario.current) {
      const el = document.createElement('div');
      el.className = 'marcador-usuario';
      el.title = 'Tu ubicación';
      marcadorUsuario.current = new maplibregl.Marker({ element: el }).setLngLat([ubicacion.lng, ubicacion.lat]).addTo(m);
    } else {
      marcadorUsuario.current.setLngLat([ubicacion.lng, ubicacion.lat]);
    }
    if (!usuarioMovioMapa.current) m.jumpTo({ center: [ubicacion.lng, ubicacion.lat] });
  }, [ubicacion]);

  // 5) Ruta segura: dibujar la línea y ajustar el zoom para que se vea completa
  useEffect(() => {
    pintarRuta();
    if (!ruta) return;
    const c = ruta.mejor.geometry.coordinates;
    const limites = c.reduce((b, p) => b.extend(p), new maplibregl.LngLatBounds(c[0], c[0]));
    usuarioMovioMapa.current = true;
    mapa.current.fitBounds(limites, { padding: { top: 230, bottom: 60, left: 60, right: 60 }, maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruta]);

  // 6) Bandera en el destino elegido
  useEffect(() => {
    marcadorDestino.current?.remove();
    marcadorDestino.current = null;
    if (!destino) return;
    const el = document.createElement('div');
    el.className = 'marcador-destino';
    el.textContent = '🏁';
    el.title = 'Destino';
    marcadorDestino.current = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([destino.lng, destino.lat]).addTo(mapa.current);
  }, [destino]);

  // Cursor en cruz mientras se elige el destino
  useEffect(() => {
    const canvas = mapa.current?.getCanvas();
    if (canvas) canvas.style.cursor = eligiendoDestino ? 'crosshair' : '';
  }, [eligiendoDestino]);

  // 4) Mostrar el popup de la emergencia seleccionada (desde el mapa o desde la lista)
  useEffect(() => {
    const anterior = popup.current;
    popup.current = null;
    anterior?.remove();
    const e = emergenciasRef.current.find((x) => x.id === seleccionada);
    if (!e) return;
    usuarioMovioMapa.current = true;
    mapa.current.flyTo({ center: [e.lng, e.lat], zoom: Math.max(mapa.current.getZoom(), 14) });
    const p = new maplibregl.Popup({ maxWidth: '320px', offset: 22 })
      .setLngLat([e.lng, e.lat])
      .setHTML(htmlPopup(e, ubicacion))
      .addTo(mapa.current);
    // Si el usuario cierra el popup con la X, quitamos la selección
    p.on('close', () => { if (popup.current === p) onSeleccionarRef.current?.(null); });
    popup.current = p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionada]);

  return <div ref={contenedor} className="mapa" role="region" aria-label="Mapa de emergencias" />;
}
