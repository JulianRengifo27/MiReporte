-- ===== Datos de prueba (los mismos 10 de la FASE 1, en Bogotá) =====
-- OJO: ST_MakePoint recibe (longitud, latitud), en ese orden.
TRUNCATE reportes, eventos, alertas_climaticas RESTART IDENTITY CASCADE;

INSERT INTO eventos (tipo, ubicacion, radio_m, descripcion, estado, prioridad, origen, verificado, entidad, via_bloqueada, desvio, cantidad_reportes, creado_en) VALUES
('deslizamiento', ST_MakePoint(-74.0712, 4.5978)::geography, 300, 'Desprendimiento de tierra en la ladera junto a la vía a Choachí. Piedras sobre el carril.', 'activa', 'alta', 'oficial', TRUE, 'Defensa Civil', TRUE, 'Usa la Av. Circunvalar hacia el norte y baja por la Calle 26.', 4, NOW() - INTERVAL '25 minutes'),
('accidente', ST_MakePoint(-74.0705, 4.6097)::geography, 0, 'Choque entre bus y moto en la Av. Jiménez con Carrera 5. Un carril cerrado.', 'en_atencion', 'alta', 'ciudadano', FALSE, NULL, TRUE, 'Toma la Calle 19 o la Carrera 7 peatonal si vas a pie.', 3, NOW() - INTERVAL '12 minutes'),
('trancon', ST_MakePoint(-74.0830, 4.6030)::geography, 0, 'Trancón fuerte en la Av. Caracas sentido sur por obras.', 'activa', 'baja', 'ciudadano', FALSE, NULL, FALSE, 'Usa la Carrera 14 o la Av. NQS.', 2, NOW() - INTERVAL '8 minutes'),
('inundacion', ST_MakePoint(-74.1350, 4.6280)::geography, 500, 'Calles inundadas en Kennedy por desbordamiento de canal tras el aguacero.', 'activa', 'alta', 'oficial', TRUE, 'Alcaldía', TRUE, 'Evita la Av. Primero de Mayo; usa la Av. Américas.', 6, NOW() - INTERVAL '40 minutes'),
('incendio', ST_MakePoint(-74.0930, 4.6520)::geography, 150, 'Incendio en bodega cerca a la Calle 63. Mucho humo negro.', 'en_atencion', 'alta', 'oficial', TRUE, 'Bomberos', TRUE, 'Rodea por la Av. 68 o la Calle 68.', 5, NOW() - INTERVAL '30 minutes'),
('accidente', ST_MakePoint(-74.0480, 4.6760)::geography, 0, 'Accidente leve en la Carrera 15 con Calle 85. Sin heridos.', 'resuelta', 'baja', 'ciudadano', FALSE, NULL, FALSE, NULL, 1, NOW() - INTERVAL '120 minutes'),
('inundacion', ST_MakePoint(-74.0720, 4.7110)::geography, 350, 'Encharcamiento grande en la Autopista Norte con Calle 127.', 'activa', 'media', 'ciudadano', FALSE, NULL, TRUE, 'Usa la Carrera Séptima o la Av. Boyacá.', 2, NOW() - INTERVAL '18 minutes'),
('deslizamiento', ST_MakePoint(-74.0900, 4.5600)::geography, 400, 'Riesgo de deslizamiento en barrio de San Cristóbal. Grietas en el terreno.', 'activa', 'media', 'oficial', TRUE, 'Defensa Civil', FALSE, NULL, 1, NOW() - INTERVAL '60 minutes'),
('trancon', ST_MakePoint(-74.0630, 4.6480)::geography, 0, 'Semáforos apagados en la Carrera 7 con Calle 45.', 'en_atencion', 'baja', 'oficial', TRUE, 'Tránsito', FALSE, 'Usa la Carrera 13 mientras llegan los agentes.', 1, NOW() - INTERVAL '15 minutes'),
('otro', ST_MakePoint(-74.0790, 4.6150)::geography, 0, 'Cable eléctrico caído sobre el andén en la Calle 22.', 'activa', 'media', 'ciudadano', FALSE, NULL, FALSE, NULL, 1, NOW() - INTERVAL '5 minutes');

-- Un reporte por cada evento (para que haya historial)
INSERT INTO reportes (tipo, descripcion, ubicacion, estado, origen, prioridad, evento_id, creado_en)
SELECT tipo, descripcion, ubicacion, estado, origen, prioridad, id, creado_en FROM eventos;

INSERT INTO alertas_climaticas (titulo, descripcion, zona, nivel, recomendaciones, vigente_hasta) VALUES
('Lluvias fuertes esta tarde', 'Se esperan aguaceros con tormenta eléctrica en el sur y occidente de Bogotá entre las 2 p. m. y las 7 p. m.', 'Sur y occidente de Bogotá', 'naranja',
  ARRAY['Limpia canales y desagües', 'No cruces corrientes de agua', 'Lleva sombrilla y sal con tiempo'], NOW() + INTERVAL '2 days'),
('Riesgo de deslizamientos en los cerros orientales', 'El suelo está saturado por las lluvias de los últimos días.', 'Cerros orientales', 'amarilla',
  ARRAY['Aléjate de laderas', 'Reporta grietas en muros o terreno'], NOW() + INTERVAL '3 days');
