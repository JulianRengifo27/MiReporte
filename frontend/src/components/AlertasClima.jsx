import { useState } from 'react';

// Banner de alertas climáticas (lluvias fuertes, etc.) con recomendaciones desplegables
export default function AlertasClima({ alertas }) {
  const [abierta, setAbierta] = useState(null);
  if (!alertas.length) return null;

  return (
    <section className="clima" aria-label="Alertas climáticas">
      {alertas.map((a) => (
        <div key={a.id} className={`clima-alerta clima-${a.nivel}`}>
          <button
            type="button"
            className="clima-cabecera"
            aria-expanded={abierta === a.id}
            onClick={() => setAbierta(abierta === a.id ? null : a.id)}
          >
            <span aria-hidden="true">🌧️</span>
            <span><strong>Alerta {a.nivel}:</strong> {a.titulo}</span>
            <span aria-hidden="true">{abierta === a.id ? '▲' : '▼'}</span>
          </button>
          {abierta === a.id && (
            <div className="clima-detalle">
              <p>{a.descripcion}</p>
              <ul>{a.recomendaciones.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
