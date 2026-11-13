-- ===== Datos extra para la PRESENTACIÓN (se cargan con: npm run demo) =====
-- Se ejecuta DESPUÉS de seed.sql. Agrega:
--   · más emergencias por toda Bogotá (incluido un evento con 7 reportes unidos)
--   · 2 reportes dudosos en la cola de revisión del admin (con análisis de IA)
--   · historial de 14 días para que las estadísticas se vean llenas
--   · una alerta climática roja

-- 1) Más emergencias activas
INSERT INTO eventos (tipo, ubicacion, radio_m, descripcion, estado, prioridad, origen, verificado, entidad, via_bloqueada, desvio, cantidad_reportes, confianza, creado_en, actualizado_en) VALUES
('accidente', ST_MakePoint(-74.0995, 4.6590)::geography, 0, 'Choque múltiple en la Av. 68 con Calle 53, sentido norte. Dos carriles cerrados.', 'en_atencion', 'alta', 'oficial', TRUE, 'Tránsito', TRUE, 'Toma la Av. Boyacá o la NQS. Evita la Av. 68 entre Calle 26 y Calle 63.', 7, 100, NOW() - INTERVAL '35 minutes', NOW() - INTERVAL '3 minutes'),
('inundacion', ST_MakePoint(-74.1700, 4.6100)::geography, 450, 'Desbordamiento del río Tunjuelo afecta viviendas en Bosa.', 'activa', 'alta', 'oficial', TRUE, 'Alcaldía', TRUE, 'Usa la Autopista Sur; evita la Av. Ciudad de Cali al sur de la Calle 59 sur.', 9, 100, NOW() - INTERVAL '50 minutes', NOW() - INTERVAL '6 minutes'),
('incendio', ST_MakePoint(-74.0420, 4.6950)::geography, 120, 'Incendio forestal pequeño en los cerros de Usaquén, visible desde la Séptima.', 'activa', 'alta', 'ciudadano', FALSE, NULL, FALSE, NULL, 5, 93, NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '2 minutes'),
('trancon', ST_MakePoint(-74.1050, 4.6400)::geography, 0, 'Trancón por manifestación en la Av. Américas con Carrera 50.', 'activa', 'media', 'ciudadano', FALSE, NULL, TRUE, 'Desvíate por la Calle 13 o la Av. Primero de Mayo.', 4, 81, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '4 minutes'),
('accidente', ST_MakePoint(-74.0560, 4.6280)::geography, 0, 'Moto accidentada en la Carrera 7 con Calle 32. Motociclista herido.', 'activa', 'alta', 'ciudadano', FALSE, NULL, TRUE, NULL, 2, 72, NOW() - INTERVAL '7 minutes', NOW() - INTERVAL '7 minutes');

-- 2) Cola de revisión del administrador (reportes dudosos que la IA no publicó)
INSERT INTO eventos (tipo, ubicacion, radio_m, descripcion, estado, prioridad, origen, cantidad_reportes, confianza, analisis_ia, creado_en, actualizado_en) VALUES
('incendio', ST_MakePoint(-74.0880, 4.6330)::geography, 100, 'jajaja se quema mi casa xd prueba', 'pendiente_revision', 'media', 'ciudadano', 1, 10,
  '{"texto":{"fuente":"gemini","tipo_sugerido":"otro","coherente":false,"razon":"Tono de broma y palabra de prueba; no describe una emergencia real.","gravedad":1},"imagen":{"fuente":"sin_foto","corresponde":null},"confianza":10}',
  NOW() - INTERVAL '9 minutes', NOW() - INTERVAL '9 minutes'),
('deslizamiento', ST_MakePoint(-74.1150, 4.6700)::geography, 200, 'Hay mucho tráfico en la calle 80', 'pendiente_revision', 'baja', 'ciudadano', 1, 20,
  '{"texto":{"fuente":"gemini","tipo_sugerido":"trancon","coherente":false,"razon":"Describe un trancón, no un deslizamiento de tierra.","gravedad":1},"imagen":{"fuente":"sin_foto","corresponde":null},"confianza":20}',
  NOW() - INTERVAL '4 minutes', NOW() - INTERVAL '4 minutes');

-- Reportes de los eventos nuevos (los 7 del choque cuentan como 7 reportes)
INSERT INTO reportes (tipo, descripcion, ubicacion, estado, origen, prioridad, confianza, evento_id, analisis_ia, creado_en)
SELECT e.tipo, e.descripcion, e.ubicacion, e.estado, e.origen, e.prioridad, e.confianza, e.id, e.analisis_ia,
       e.creado_en + (n * INTERVAL '2 minutes')
  FROM eventos e
  CROSS JOIN LATERAL generate_series(1, e.cantidad_reportes) AS n
 WHERE NOT EXISTS (SELECT 1 FROM reportes r WHERE r.evento_id = e.id);

-- 3) Historial de 14 días (eventos ya resueltos) para las estadísticas
INSERT INTO eventos (tipo, ubicacion, radio_m, descripcion, estado, prioridad, origen, cantidad_reportes, confianza, creado_en, actualizado_en)
SELECT (ARRAY['accidente','accidente','trancon','trancon','trancon','inundacion','incendio','deslizamiento','otro'])[1 + (i % 9)],
       ST_MakePoint(-74.16 + random() * 0.13, 4.55 + random() * 0.18)::geography,
       0, 'Reporte histórico de demostración', 'resuelta', 'media', 'ciudadano', 1, 60,
       NOW() - (1 + (i % 13)) * INTERVAL '1 day' - random() * INTERVAL '10 hours',
       NOW() - (1 + (i % 13)) * INTERVAL '1 day'
  FROM generate_series(1, 64) AS i;

INSERT INTO reportes (tipo, descripcion, ubicacion, estado, origen, prioridad, confianza, evento_id, creado_en)
SELECT tipo, descripcion, ubicacion, estado, origen, prioridad, confianza, id, creado_en
  FROM eventos e WHERE NOT EXISTS (SELECT 1 FROM reportes r WHERE r.evento_id = e.id);

-- 4) Alerta climática roja
INSERT INTO alertas_climaticas (titulo, descripcion, zona, nivel, recomendaciones, vigente_hasta) VALUES
('Creciente súbita del río Tunjuelo', 'El IDIGER reporta aumento rápido del nivel del río por lluvias en la parte alta de la cuenca.', 'Bosa, Kennedy y Tunjuelito', 'roja',
  ARRAY['Si vives cerca del río, ten lista tu maleta de emergencia', 'Sigue las rutas de evacuación señalizadas', 'No intentes cruzar el río'], NOW() + INTERVAL '1 day');
