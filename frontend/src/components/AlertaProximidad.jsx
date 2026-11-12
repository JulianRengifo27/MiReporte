import { useEffect, useRef } from 'react';
import { TIPOS } from '../config.js';

// Mensajes específicos por tipo de zona de riesgo
const MENSAJES = {
  deslizamiento: 'Estás cerca de una zona de deslizamiento. Aléjate de laderas y taludes.',
  inundacion: 'Estás cerca de una zona inundada. No cruces calles con agua.',
  incendio: 'Estás cerca de un incendio. Aléjate del humo y deja paso a los bomberos.',
};

export const mensajeProximidad = (e) => MENSAJES[e.tipo] || TIPOS[e.tipo].recomendacion;

// Aviso emergente cuando el usuario está dentro (o muy cerca) de un área de riesgo
export default function AlertaProximidad({ emergencia, onCerrar, onVer, onEscuchar }) {
  const boton = useRef(null);
  useEffect(() => { boton.current?.focus(); }, [emergencia]);
  if (!emergencia) return null;
  const t = TIPOS[emergencia.tipo];

  return (
    <div className="modal-fondo" role="alertdialog" aria-modal="true" aria-labelledby="prox-titulo" aria-describedby="prox-texto">
      <div className="modal modal-alerta" style={{ '--color': t.color }}>
        <div className="modal-alerta-icono" aria-hidden="true">{t.icono}</div>
        <h2 id="prox-titulo">¡Pilas! Zona de riesgo cerca</h2>
        <p id="prox-texto">{mensajeProximidad(emergencia)}</p>
        <div className="modal-acciones">
          <button type="button" className="boton boton-secundario" onClick={() => onEscuchar(mensajeProximidad(emergencia))}>🔊 Escuchar</button>
          <button type="button" className="boton boton-secundario" onClick={onVer}>Ver en el mapa</button>
          <button type="button" className="boton boton-primario" ref={boton} onClick={onCerrar}>Entendido</button>
        </div>
      </div>
    </div>
  );
}
