// ===== Panel "Ruta segura" =====
// El usuario escribe una dirección o lugar (o toca el mapa) para elegir su destino,
// y la app calcula (con OSRM) una ruta que evita las emergencias reportadas.
import { useEffect, useId, useRef, useState } from 'react';
import { TIPOS } from '../config.js';
import { formatoDistancia } from '../utils/geo.js';
import { buscarDirecciones } from '../utils/direcciones.js';
import { IconoRuta } from './Iconos.jsx';

export default function PanelRuta({ estado, resultado, error, ubicacion, nombreDestino, onElegirDestino, onCerrar, onOtroDestino }) {
  return (
    <div className="panel-ruta" role="region" aria-label="Ruta segura">
      <div className="panel-ruta-cabecera">
        <strong><IconoRuta tam={18} /> Ruta segura</strong>
        <button type="button" className="boton-icono" onClick={onCerrar} aria-label="Cerrar ruta segura">✕</button>
      </div>

      {estado === 'eligiendo' && (
        <>
          <BuscadorDireccion ubicacion={ubicacion} onElegir={onElegirDestino} />
          <p className="nota">o toca en el mapa el lugar al que quieres ir.</p>
        </>
      )}
      {estado === 'calculando' && <p aria-live="polite">Calculando la ruta{nombreDestino ? ` a ${nombreDestino}` : ''}…</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {estado === 'lista' && resultado && (
        <div aria-live="polite">
          {nombreDestino && <p className="panel-ruta-destino">Hacia <strong>{nombreDestino}</strong></p>}
          <p className="panel-ruta-datos">
            <span>{formatoDistancia(resultado.mejor.distance)}</span>
            <span>⏱ {Math.round(resultado.mejor.duration / 60)} min</span>
            {resultado.minutosExtra > 0 && <span>+{resultado.minutosExtra} min por el desvío</span>}
          </p>
          {resultado.mejor.cruza.length === 0
            ? <p className="exito">✅ Evita las emergencias reportadas en {`MiReporte`}{resultado.zonasEvitadas.length ? ` (esquiva ${resultado.zonasEvitadas.length})` : ''}.</p>
            : <p className="error">⚠️ No encontramos una ruta que evite todo: pasa cerca de {resultado.mejor.cruza.map((z) => TIPOS[z.tipo].etiqueta.toLowerCase()).join(', ')}. Ten precaución.</p>}
          {resultado.otras.length > 0 && <p className="nota">En rojo punteado: otras rutas posibles.</p>}
          <div className="acciones">
            <a className="boton boton-primario" href={resultado.linkGoogle} target="_blank" rel="noopener noreferrer">Abrir en Google Maps ↗</a>
            <button type="button" className="boton boton-secundario" onClick={onOtroDestino}>Otro destino</button>
          </div>
          <p className="nota">Es una recomendación: no incluye tráfico en tiempo real ni emergencias sin reportar. Sigue las señales de tránsito.</p>
        </div>
      )}
    </div>
  );
}

// Campo de texto con sugerencias mientras se escribe (combobox accesible)
function BuscadorDireccion({ ubicacion, onElegir }) {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const [activo, setActivo] = useState(-1); // sugerencia resaltada con el teclado
  const idLista = useId();
  const entrada = useRef(null);

  useEffect(() => { entrada.current?.focus(); }, []);

  // Busca 400 ms después de que el usuario deja de escribir (no en cada letra)
  useEffect(() => {
    setError('');
    if (texto.trim().length < 3) { setResultados([]); setBuscando(false); return; }
    const control = new AbortController();
    setBuscando(true);
    const espera = setTimeout(() => {
      buscarDirecciones(texto, ubicacion, control.signal)
        .then((r) => { setResultados(r); setActivo(-1); if (!r.length) setError('No encontramos ese lugar. Prueba con otro nombre o agrega la ciudad.'); })
        .catch((e) => { if (e.name !== 'AbortError') setError(e.message); })
        .finally(() => { if (!control.signal.aborted) setBuscando(false); });
    }, 400);
    return () => { clearTimeout(espera); control.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const elegir = (r) => onElegir({ lat: r.lat, lng: r.lng }, r.titulo);

  function teclas(e) {
    if (!resultados.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActivo((a) => (a + 1) % resultados.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActivo((a) => (a <= 0 ? resultados.length - 1 : a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); elegir(resultados[Math.max(activo, 0)]); }
    else if (e.key === 'Escape') { setResultados([]); }
  }

  return (
    <div className="buscador">
      <label className="campo">
        <span className="campo-etiqueta">¿A dónde vas?</span>
        <input
          ref={entrada}
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={teclas}
          placeholder="Dirección o lugar (ej: Universidad Nacional)"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={resultados.length > 0}
          aria-controls={idLista}
          aria-activedescendant={activo >= 0 ? `${idLista}-${activo}` : undefined}
        />
      </label>
      {buscando && <p className="nota" aria-live="polite">Buscando…</p>}
      {error && !buscando && <p className="nota" role="status">{error}</p>}
      {resultados.length > 0 && (
        <ul className="buscador-lista" id={idLista} role="listbox" aria-label="Lugares encontrados">
          {resultados.map((r, i) => (
            <li
              key={`${r.titulo}-${r.lat}-${r.lng}`}
              id={`${idLista}-${i}`}
              role="option"
              aria-selected={i === activo}
              className={i === activo ? 'activo' : ''}
              onMouseDown={(e) => { e.preventDefault(); elegir(r); }}
            >
              <span className="buscador-titulo">{r.titulo}</span>
              {r.detalle && <span className="buscador-detalle">{r.detalle}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
