// ===== Panel "Ruta segura" =====
// El usuario toca el mapa para elegir su destino y la app calcula (con OSRM) una ruta que evita las emergencias.
import { TIPOS } from '../config.js';
import { formatoDistancia } from '../utils/geo.js';
import { IconoRuta } from './Iconos.jsx';

export default function PanelRuta({ estado, resultado, error, onCerrar, onOtroDestino }) {
  return (
    <div className="panel-ruta" role="region" aria-label="Ruta segura" aria-live="polite">
      <div className="panel-ruta-cabecera">
        <strong><IconoRuta tam={18} /> Ruta segura</strong>
        <button type="button" className="boton-icono" onClick={onCerrar} aria-label="Cerrar ruta segura">✕</button>
      </div>

      {estado === 'eligiendo' && <p>👆 Toca en el mapa el lugar al que quieres ir.</p>}
      {estado === 'calculando' && <p>Calculando la mejor ruta…</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {estado === 'lista' && resultado && (
        <>
          <p className="panel-ruta-datos">
            <span>{formatoDistancia(resultado.mejor.distance)}</span>
            <span>⏱ {Math.round(resultado.mejor.duration / 60)} min</span>
            {resultado.minutosExtra > 0 && <span>+{resultado.minutosExtra} min por el desvío</span>}
          </p>
          {resultado.mejor.cruza.length === 0
            ? <p className="exito">✅ Esta ruta no pasa por ninguna emergencia activa{resultado.zonasEvitadas.length ? ` (evita ${resultado.zonasEvitadas.length})` : ''}.</p>
            : <p className="error">⚠️ No encontramos una ruta que evite todo: pasa cerca de {resultado.mejor.cruza.map((z) => TIPOS[z.tipo].etiqueta.toLowerCase()).join(', ')}. Ten precaución.</p>}
          {resultado.otras.length > 0 && <p className="nota">En rojo punteado: otras rutas posibles.</p>}
          <div className="acciones">
            <a className="boton boton-primario" href={resultado.linkGoogle} target="_blank" rel="noopener noreferrer">Abrir en Google Maps ↗</a>
            <button type="button" className="boton boton-secundario" onClick={onOtroDestino}>Otro destino</button>
          </div>
          <p className="nota">Rutas: OSRM / OpenStreetMap. Son una recomendación; sigue las señales de tránsito.</p>
        </>
      )}
    </div>
  );
}
