// ===== Historial del ciudadano registrado =====
import { useEffect, useState } from 'react';
import { obtenerMisReportes } from '../api.js';
import { TIPOS, ESTADOS, PRIORIDADES } from '../config.js';
import { formatoHora } from '../utils/geo.js';

const ESTADO_REPORTE = {
  pendiente_revision: { etiqueta: 'En revisión', clase: 'estado-atencion' },
  rechazado: { etiqueta: 'No publicado', clase: 'chip-ciudadano' },
};

export default function MisReportes() {
  const [reportes, setReportes] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { obtenerMisReportes().then(setReportes).catch((e) => setError(e.message)); }, []);

  return (
    <div className="pagina">
      <h2>Mis reportes</h2>
      {error && <p className="error" role="alert">{error}</p>}
      {!reportes && !error && <p>Cargando…</p>}
      {reportes?.length === 0 && <p>Aún no has hecho reportes con tu cuenta. ¡Gracias por estar atento!</p>}
      <ul className="lista-simple">
        {reportes?.map((r) => {
          const t = TIPOS[r.tipo];
          // Estado que le mostramos: el del evento si está publicado, o el del reporte si quedó en revisión
          const est = ESTADO_REPORTE[r.estado_evento] || ESTADOS[r.estado_evento] || ESTADO_REPORTE[r.estado_reporte] || ESTADOS.activa;
          return (
            <li key={r.id} className="tarjeta" style={{ '--color': t.color }}>
              <span className="tarjeta-icono" aria-hidden="true">{t.icono}</span>
              <span className="tarjeta-cuerpo">
                <span className="tarjeta-fila"><strong>{t.etiqueta}</strong><span>{new Date(r.creado_en).toLocaleDateString('es-CO')} · {formatoHora(r.creado_en)}</span></span>
                <span className="tarjeta-desc">{r.descripcion || 'Sin descripción.'}</span>
                <span className="tarjeta-fila tarjeta-meta">
                  <span className={`chip ${est.clase}`}>{est.etiqueta}</span>
                  {PRIORIDADES[r.prioridad] && <span className={`chip ${PRIORIDADES[r.prioridad].clase}`}>{PRIORIDADES[r.prioridad].etiqueta}</span>}
                  {r.cantidad_reportes > 1 && <span>👥 {r.cantidad_reportes} personas lo reportaron</span>}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
