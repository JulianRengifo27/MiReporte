// ===== Datos simulados (FASE 1) =====
// En la FASE 2 estos datos vendrán de la API real (PostgreSQL + PostGIS).
// "haceMin" = hace cuántos minutos se reportó. "radio_m" = radio del área de riesgo.

const hace = (min) => new Date(Date.now() - min * 60 * 1000).toISOString();

export const emergenciasMock = [
  {
    id: 1, tipo: 'deslizamiento', lat: 4.5978, lng: -74.0712, radio_m: 300,
    descripcion: 'Desprendimiento de tierra en la ladera junto a la vía a Choachí. Piedras sobre el carril.',
    estado: 'activa', origen: 'oficial', entidad: 'Defensa Civil', creado_en: hace(25),
    via_bloqueada: true, desvio: 'Usa la Av. Circunvalar hacia el norte y baja por la Calle 26.',
  },
  {
    id: 2, tipo: 'accidente', lat: 4.6097, lng: -74.0705, radio_m: 0,
    descripcion: 'Choque entre bus y moto en la Av. Jiménez con Carrera 5. Un carril cerrado.',
    estado: 'en_atencion', origen: 'ciudadano', creado_en: hace(12),
    via_bloqueada: true, desvio: 'Toma la Calle 19 o la Carrera 7 peatonal si vas a pie.',
  },
  {
    id: 3, tipo: 'trancon', lat: 4.6030, lng: -74.0830, radio_m: 0,
    descripcion: 'Trancón fuerte en la Av. Caracas sentido sur por obras.',
    estado: 'activa', origen: 'ciudadano', creado_en: hace(8),
    via_bloqueada: false, desvio: 'Usa la Carrera 14 o la Av. NQS.',
  },
  {
    id: 4, tipo: 'inundacion', lat: 4.6280, lng: -74.1350, radio_m: 500,
    descripcion: 'Calles inundadas en Kennedy por desbordamiento de canal tras el aguacero.',
    estado: 'activa', origen: 'oficial', entidad: 'Alcaldía', creado_en: hace(40),
    via_bloqueada: true, desvio: 'Evita la Av. Primero de Mayo; usa la Av. Américas.',
  },
  {
    id: 5, tipo: 'incendio', lat: 4.6520, lng: -74.0930, radio_m: 150,
    descripcion: 'Incendio en bodega cerca a la Calle 63. Mucho humo negro.',
    estado: 'en_atencion', origen: 'oficial', entidad: 'Bomberos', creado_en: hace(30),
    via_bloqueada: true, desvio: 'Rodea por la Av. 68 o la Calle 68.',
  },
  {
    id: 6, tipo: 'accidente', lat: 4.6760, lng: -74.0480, radio_m: 0,
    descripcion: 'Accidente leve en la Carrera 15 con Calle 85. Sin heridos.',
    estado: 'resuelta', origen: 'ciudadano', creado_en: hace(120),
    via_bloqueada: false,
  },
  {
    id: 7, tipo: 'inundacion', lat: 4.7110, lng: -74.0720, radio_m: 350,
    descripcion: 'Encharcamiento grande en la Autopista Norte con Calle 127.',
    estado: 'activa', origen: 'ciudadano', creado_en: hace(18),
    via_bloqueada: true, desvio: 'Usa la Carrera Séptima o la Av. Boyacá.',
  },
  {
    id: 8, tipo: 'deslizamiento', lat: 4.5600, lng: -74.0900, radio_m: 400,
    descripcion: 'Riesgo de deslizamiento en barrio de San Cristóbal. Grietas en el terreno.',
    estado: 'activa', origen: 'oficial', entidad: 'Defensa Civil', creado_en: hace(60),
    via_bloqueada: false,
  },
  {
    id: 9, tipo: 'trancon', lat: 4.6480, lng: -74.0630, radio_m: 0,
    descripcion: 'Semáforos apagados en la Carrera 7 con Calle 45.',
    estado: 'en_atencion', origen: 'oficial', entidad: 'Tránsito', creado_en: hace(15),
    via_bloqueada: false, desvio: 'Usa la Carrera 13 mientras llegan los agentes.',
  },
  {
    id: 10, tipo: 'otro', lat: 4.6150, lng: -74.0790, radio_m: 0,
    descripcion: 'Cable eléctrico caído sobre el andén en la Calle 22.',
    estado: 'activa', origen: 'ciudadano', creado_en: hace(5),
    via_bloqueada: false,
  },
];

// Alertas climáticas simuladas (en FASE 2 vendrán de /api/alertas-climaticas)
export const alertasClimaMock = [
  {
    id: 1, nivel: 'naranja', titulo: 'Lluvias fuertes esta tarde',
    descripcion: 'Se esperan aguaceros con tormenta eléctrica en el sur y occidente de Bogotá entre las 2 p. m. y las 7 p. m.',
    recomendaciones: ['Limpia canales y desagües', 'No cruces corrientes de agua', 'Lleva sombrilla y sal con tiempo'],
  },
  {
    id: 2, nivel: 'amarilla', titulo: 'Riesgo de deslizamientos en los cerros orientales',
    descripcion: 'El suelo está saturado por las lluvias de los últimos días.',
    recomendaciones: ['Aléjate de laderas', 'Reporta grietas en muros o terreno'],
  },
];
