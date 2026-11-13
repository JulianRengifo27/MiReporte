import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { ESTILO_OSM } from '../utils/mapa.js';

// Mini mapa con un pin arrastrable para elegir una ubicación.
// Se usa en el formulario ciudadano y en el panel oficial.
export default function SelectorUbicacion({ inicial, onCambio, alto = 180, radioM = 0 }) {
  const contenedor = useRef(null);
  const mapa = useRef(null);
  const onCambioRef = useRef(onCambio);
  onCambioRef.current = onCambio;

  useEffect(() => {
    const m = new maplibregl.Map({ container: contenedor.current, style: ESTILO_OSM, center: [inicial.lng, inicial.lat], zoom: 15 });
    const pin = new maplibregl.Marker({ draggable: true, color: '#bd3a3a' }).setLngLat([inicial.lng, inicial.lat]).addTo(m);
    const mover = (ll) => onCambioRef.current({ lat: ll.lat, lng: ll.lng });
    pin.on('dragend', () => mover(pin.getLngLat()));
    // Tocar el mapa también mueve el pin
    m.on('click', (ev) => { pin.setLngLat(ev.lngLat); mover(ev.lngLat); });
    mapa.current = { m, pin };
    return () => m.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si llega una ubicación nueva desde fuera (por ejemplo el GPS), movemos el pin
  useEffect(() => {
    if (!mapa.current) return;
    mapa.current.pin.setLngLat([inicial.lng, inicial.lat]);
    mapa.current.m.jumpTo({ center: [inicial.lng, inicial.lat] });
  }, [inicial.lat, inicial.lng]);

  return (
    <div
      ref={contenedor}
      className="mini-mapa"
      style={{ height: alto }}
      aria-label={`Mapa para elegir la ubicación. Arrastra el pin o toca el mapa.${radioM ? ` Radio: ${radioM} metros.` : ''}`}
    />
  );
}
