// Alertas climáticas en una sola línea compacta (diseño minimalista).
// Muestra la más importante; al tocarla se despliegan todas con sus recomendaciones.
import { useEffect, useRef, useState } from 'react';

const ORDEN = { roja: 1, naranja: 2, amarilla: 3 };

export default function AlertasClima({ alertas }) {
  const [abierta, setAbierta] = useState(false);
  const caja = useRef(null);

  // El detalle flota sobre el mapa: se cierra al tocar fuera de él o con la tecla Escape
  useEffect(() => {
    if (!abierta) return;
    const fuera = (e) => { if (caja.current && !caja.current.contains(e.target)) setAbierta(false); };
    const tecla = (e) => { if (e.key === 'Escape') setAbierta(false); };
    document.addEventListener('pointerdown', fuera);
    window.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('pointerdown', fuera); window.removeEventListener('keydown', tecla); };
  }, [abierta]);
  if (!alertas.length) return null;
  const ordenadas = [...alertas].sort((a, b) => (ORDEN[a.nivel] || 9) - (ORDEN[b.nivel] || 9));
  const principal = ordenadas[0];

  return (
    <section ref={caja} className={`clima clima-${principal.nivel}`} aria-label="Alertas climáticas">
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
