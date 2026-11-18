import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { TIPOS } from '../config.js';
import { ESTILO_OSM } from '../utils/mapa.js';

const MAX_DESC = 280;

// Formulario rápido para reportar: 1) abrir  2) elegir tipo  3) enviar.
// La ubicación se toma del GPS y se puede ajustar arrastrando el pin.
export default function FormularioReporte({ ubicacion, estadoGPS, onEnviar, onCerrar }) {
  const [tipo, setTipo] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState(null); // { archivo, url }
  const [punto, setPunto] = useState(ubicacion);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const contMapa = useRef(null);

  // Mini mapa con un pin arrastrable para ajustar la ubicación
  useEffect(() => {
    const m = new maplibregl.Map({ container: contMapa.current, style: ESTILO_OSM, center: [ubicacion.lng, ubicacion.lat], zoom: 16 });
    const pin = new maplibregl.Marker({ draggable: true, color: '#bd3a3a' }).setLngLat([ubicacion.lng, ubicacion.lat]).addTo(m);
    pin.on('dragend', () => { const p = pin.getLngLat(); setPunto({ lat: p.lat, lng: p.lng }); });
    // Tocar el mapa también mueve el pin
    m.on('click', (ev) => { pin.setLngLat(ev.lngLat); setPunto({ lat: ev.lngLat.lat, lng: ev.lngLat.lng }); });
    return () => m.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Liberar la vista previa de la foto al cambiarla o cerrar
  useEffect(() => () => { if (foto) URL.revokeObjectURL(foto.url); }, [foto]);

  // Cerrar con la tecla Escape
  useEffect(() => {
    const tecla = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onCerrar]);

  function elegirFoto(ev) {
    const archivo = ev.target.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) { setError('El archivo debe ser una imagen.'); return; }
    if (archivo.size > 5 * 1024 * 1024) { setError('La foto no puede pesar más de 5 MB.'); return; }
    setError('');
    setFoto({ archivo, url: URL.createObjectURL(archivo) });
  }

  async function enviar(ev) {
    ev.preventDefault();
    if (enviando) return;
    if (!tipo) { setError('Elige el tipo de emergencia.'); return; }
    // Se necesita al menos una descripción o una foto para que la IA pueda revisar el reporte
    if (!descripcion.trim() && !foto) { setError('Escribe una descripción corta o adjunta una foto.'); return; }
    setEnviando(true);
    setError('');
    try {
      // La foto se sube al servidor junto con los datos
      await onEnviar({ tipo, descripcion: descripcion.trim(), lat: punto.lat, lng: punto.lng, foto: foto?.archivo || null });
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-labelledby="form-titulo" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <form className="modal modal-formulario" onSubmit={enviar} noValidate>
        <div className="modal-cabecera">
          <h2 id="form-titulo">Reportar emergencia</h2>
          <button type="button" className="boton-icono" onClick={onCerrar} aria-label="Cerrar formulario">✕</button>
        </div>

        <fieldset className="tipos">
          <legend>1. ¿Qué está pasando?</legend>
          <div className="tipos-grid">
            {Object.entries(TIPOS).map(([clave, t]) => (
              <button
                key={clave}
                type="button"
                className={`tipo-boton ${tipo === clave ? 'tipo-elegido' : ''}`}
                style={{ '--color': t.color }}
                aria-pressed={tipo === clave}
                onClick={() => { setTipo(clave); setError(''); }}
              >
                <span aria-hidden="true">{t.icono}</span>{t.etiqueta}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="campo">
          <span className="campo-etiqueta">
            2. Ubicación {estadoGPS === 'ok' ? '(tu GPS)' : '(GPS no disponible: mueve el pin)'}
          </span>
          <div ref={contMapa} className="mini-mapa" aria-label="Mapa para ajustar la ubicación. Arrastra el pin o toca el mapa." />
          <small>Arrastra el pin o toca el mapa para ajustar el lugar exacto.</small>
        </div>

        <p className="nota-requisito">Escribe una descripción corta <strong>o</strong> adjunta una foto (al menos una de las dos), para que podamos verificar el reporte.</p>

        <label className="campo">
          <span className="campo-etiqueta">3. Descripción corta</span>
          <textarea
            value={descripcion}
            maxLength={MAX_DESC}
            rows={3}
            placeholder="Ej: Choque entre dos carros, un carril cerrado."
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <small>{descripcion.length}/{MAX_DESC}</small>
        </label>

        <div className="campo">
          <span className="campo-etiqueta">4. Foto</span>
          <label className="boton boton-secundario boton-foto">
            📷 {foto ? 'Cambiar foto' : 'Tomar o adjuntar foto'}
            <input type="file" accept="image/*" capture="environment" onChange={elegirFoto} hidden />
          </label>
          {foto && <img src={foto.url} alt="Vista previa de la foto" className="foto-previa" />}
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        <button type="submit" className="boton boton-primario boton-enviar" disabled={enviando} aria-busy={enviando}>
          {enviando ? 'Enviando…' : 'Enviar reporte'}
        </button>
        <p className="aviso-123">Esta plataforma no reemplaza la línea 123. En una emergencia, llama al <a href="tel:123">123</a>.</p>
      </form>
    </div>
  );
}
