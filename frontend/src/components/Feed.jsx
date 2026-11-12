import { TIPOS, ESTADOS } from '../config.js';
import { formatoDistancia, formatoHora, formatoHace } from '../utils/geo.js';

// Lista lateral de emergencias, ordenada por distancia al usuario
export default function Feed({ emergencias, seleccionada, onSeleccionar }) {
  if (emergencias.length === 0) return <p className="feed-vacio">No hay emergencias reportadas cerca. 🙌</p>;

  return (
    <ul className="feed" aria-label="Lista de emergencias">
      {emergencias.map((e) => {
        const t = TIPOS[e.tipo];
        return (
          <li key={e.id}>
            <button
              type="button"
              className={`tarjeta ${seleccionada === e.id ? 'tarjeta-activa' : ''} ${e.estado === 'resuelta' ? 'tarjeta-resuelta' : ''}`}
              style={{ '--color': t.color }}
              onClick={() => onSeleccionar(e.id)}
            >
              <span className="tarjeta-icono" aria-hidden="true">{t.icono}</span>
              <span className="tarjeta-cuerpo">
                <span className="tarjeta-fila">
                  <strong>{t.etiqueta}</strong>
                  <span className="tarjeta-distancia">{formatoDistancia(e.distancia)}</span>
                </span>
                <span className="tarjeta-desc">{e.descripcion || 'Sin descripción.'}</span>
                <span className="tarjeta-fila tarjeta-meta">
                  <span title={formatoHace(e.creado_en)}>🕒 {formatoHora(e.creado_en)}</span>
                  <span className={`chip ${ESTADOS[e.estado].clase}`}>{ESTADOS[e.estado].etiqueta}</span>
                  {e.origen === 'oficial'
                    ? <span className="sello-oficial">✔ Oficial</span>
                    : <span className="chip chip-ciudadano">Ciudadano</span>}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
