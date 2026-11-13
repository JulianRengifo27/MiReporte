// ===== Configuración general de la app =====
// Cambia aquí el nombre y todo el sitio se actualiza.
export const APP_NAME = 'Pilas';
export const APP_LEMA = 'Emergencias urbanas en tiempo real';

// Si el usuario niega el GPS, centramos el mapa en Bogotá (Plaza de Bolívar)
export const UBICACION_POR_DEFECTO = { lat: 4.5981, lng: -74.0760 };

// Radio (en metros) para el aviso "Hay N emergencias a menos de 2 km"
export const RADIO_AVISO_M = 2000;

// Margen extra (en metros) alrededor de una zona de riesgo para la alerta de proximidad
export const MARGEN_PROXIMIDAD_M = 300;

// Catálogo de tipos de emergencia: etiqueta, ícono, color y recomendaciones
export const TIPOS = {
  accidente:     { etiqueta: 'Accidente',     icono: '🚗', color: '#d32f2f', recomendacion: 'Evita la zona y no te detengas a grabar. Deja paso a las ambulancias.' },
  incendio:      { etiqueta: 'Incendio',      icono: '🔥', color: '#f57c00', recomendacion: 'Aléjate del humo, no uses ascensores y sigue las rutas de evacuación.' },
  inundacion:    { etiqueta: 'Inundación',    icono: '🌊', color: '#1976d2', recomendacion: 'No cruces calles inundadas a pie ni en vehículo. Busca zonas altas.' },
  deslizamiento: { etiqueta: 'Deslizamiento', icono: '⛰️', color: '#795548', recomendacion: 'Aléjate de laderas y taludes. Atiende las indicaciones de evacuación.' },
  trancon:       { etiqueta: 'Trancón',       icono: '🚦', color: '#fbc02d', recomendacion: 'Toma una vía alterna y considera salir más tarde.' },
  otro:          { etiqueta: 'Otro',          icono: '⚠️', color: '#616161', recomendacion: 'Mantén la calma y sigue las indicaciones de las autoridades.' },
};

// Tipos que se dibujan como un área circular de riesgo (además del marcador)
export const TIPOS_CON_AREA = ['inundacion', 'deslizamiento', 'incendio'];

export const PRIORIDADES = {
  alta:  { etiqueta: 'Prioridad alta',  clase: 'prioridad-alta' },
  media: { etiqueta: 'Prioridad media', clase: 'prioridad-media' },
  baja:  { etiqueta: 'Prioridad baja',  clase: 'prioridad-baja' },
};

// Texto "N personas reportaron esto"
export const textoReportes = (n) => (n > 1 ? `👥 ${n} personas reportaron esto` : '👤 1 persona reportó esto');

export const ESTADOS = {
  activa:      { etiqueta: 'Activa',      clase: 'estado-activa' },
  en_atencion: { etiqueta: 'En atención', clase: 'estado-atencion' },
  resuelta:    { etiqueta: 'Resuelta',    clase: 'estado-resuelta' },
};
