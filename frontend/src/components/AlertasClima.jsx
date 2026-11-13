// Alertas climáticas en una sola línea compacta (diseño minimalista).
// Muestra la más importante; al tocarla se despliegan todas con sus recomendaciones.
import { useState } from 'react';

const ORDEN = { roja: 1, naranja: 2, amarilla: 3 };

export default function AlertasClima({ alertas }) {
  const [abierta, setAbierta] = useState(false);
  if (!alertas.length) return null;
  const ordenadas = [...alertas].sort((a, b) => (ORDEN[a.nivel] || 9) - (ORDEN[b.nivel] || 9));
  const principal = ordenadas[0];

  return (
    <section className={`clima clima-${principal.nivel}`} aria-label="Alertas climáticas">
      <button type="button" className="clima-cabecera" aria-expanded={abierta} onClick={() => setAbierta(!abierta)}>
        <span className="clima-punto" aria-hidden="true" />
        <span className="clima-resumen">
          <strong>Alerta {principal.nivel}</strong> · {principal.titulo}
          {ordenadas.length > 1 && <span className="clima-mas"> +{ordenadas.length - 1} más</span>}
        </span>
        <span className="clima-flecha" aria-hidden="true">{abierta ? '−' : '+'}</span>
      </button>
      {abierta && (
        <div className="clima-detalle">
          {ordenadas.map((a) => (
            <div key={a.id} className={`clima-item clima-${a.nivel}`}>
              <p><span className="clima-punto" aria-hidden="true" /> <strong>Alerta {a.nivel}: {a.titulo}</strong></p>
              {a.descripcion && <p>{a.descripcion}</p>}
              {a.recomendaciones?.length > 0 && <ul>{a.recomendaciones.map((r) => <li key={r}>{r}</li>)}</ul>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
