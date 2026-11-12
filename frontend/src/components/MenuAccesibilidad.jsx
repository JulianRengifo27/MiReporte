import { useState } from 'react';

// Menú de accesibilidad (Ley 1618): tamaño de letra, alto contraste y lectura en voz alta
export default function MenuAccesibilidad({ escala, setEscala, contraste, setContraste, onEscuchar }) {
  const [abierto, setAbierto] = useState(false);
  const cambiar = (d) => setEscala((v) => Math.min(1.5, Math.max(0.85, +(v + d).toFixed(2))));

  return (
    <div className="accesibilidad">
      <button
        type="button"
        className="boton-icono"
        aria-expanded={abierto}
        aria-controls="panel-accesibilidad"
        aria-label="Menú de accesibilidad"
        onClick={() => setAbierto(!abierto)}
      >♿</button>
      {abierto && (
        <div id="panel-accesibilidad" className="panel-accesibilidad" role="group" aria-label="Opciones de accesibilidad">
          <p className="panel-titulo">Accesibilidad</p>
          <div className="fila-botones">
            <button type="button" className="boton boton-secundario" onClick={() => cambiar(-0.1)} aria-label="Reducir tamaño de letra">A−</button>
            <span aria-live="polite">{Math.round(escala * 100)}%</span>
            <button type="button" className="boton boton-secundario" onClick={() => cambiar(0.1)} aria-label="Aumentar tamaño de letra">A+</button>
          </div>
          <button type="button" className="boton boton-secundario" aria-pressed={contraste} onClick={() => setContraste(!contraste)}>
            ◐ Alto contraste: {contraste ? 'Sí' : 'No'}
          </button>
          <button type="button" className="boton boton-primario" onClick={onEscuchar}>🔊 Escuchar alerta</button>
        </div>
      )}
    </div>
  );
}
