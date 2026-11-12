-- ===== Migración 001: tablas iniciales de Pilas =====
-- PostGIS permite guardar puntos (lat/lng) y buscar por distancia en metros.
CREATE EXTENSION IF NOT EXISTS postgis;

-- Usuarios (se usará de verdad en la FASE 4: login y roles)
CREATE TABLE IF NOT EXISTS usuarios (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  rol            VARCHAR(20)  NOT NULL DEFAULT 'ciudadano'
                 CHECK (rol IN ('ciudadano', 'entidad_oficial', 'admin')),
  entidad        VARCHAR(100),               -- ej: "Bomberos" (solo para entidad_oficial)
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Eventos: emergencias consolidadas que se muestran en el mapa.
-- Varios reportes del mismo hecho se unen en un solo evento (FASE 3).
CREATE TABLE IF NOT EXISTS eventos (
  id                 SERIAL PRIMARY KEY,
  tipo               VARCHAR(20) NOT NULL
                     CHECK (tipo IN ('accidente','incendio','inundacion','deslizamiento','trancon','otro')),
  descripcion        TEXT,
  foto_url           TEXT,
  ubicacion          GEOGRAPHY(Point, 4326) NOT NULL,
  radio_m            INTEGER NOT NULL DEFAULT 0,          -- radio del área de riesgo
  estado             VARCHAR(20) NOT NULL DEFAULT 'activa'
                     CHECK (estado IN ('activa','en_atencion','resuelta','pendiente_revision')),
  prioridad          VARCHAR(10) NOT NULL DEFAULT 'media' CHECK (prioridad IN ('alta','media','baja')),
  origen             VARCHAR(20) NOT NULL DEFAULT 'ciudadano' CHECK (origen IN ('ciudadano','oficial')),
  verificado         BOOLEAN NOT NULL DEFAULT FALSE,
  entidad            VARCHAR(100),                        -- entidad que lo publicó/verificó
  via_bloqueada      BOOLEAN NOT NULL DEFAULT FALSE,
  desvio             TEXT,                                -- recomendación de ruta alterna
  cantidad_reportes  INTEGER NOT NULL DEFAULT 1,
  creado_en          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reportes: lo que envía cada persona. usuario_id es opcional (se puede reportar sin registro).
CREATE TABLE IF NOT EXISTS reportes (
  id              SERIAL PRIMARY KEY,
  tipo            VARCHAR(20) NOT NULL
                  CHECK (tipo IN ('accidente','incendio','inundacion','deslizamiento','trancon','otro')),
  descripcion     TEXT,
  foto_url        TEXT,
  ubicacion       GEOGRAPHY(Point, 4326) NOT NULL,
  estado          VARCHAR(20) NOT NULL DEFAULT 'activa'
                  CHECK (estado IN ('activa','en_atencion','resuelta','pendiente_revision','rechazado')),
  origen          VARCHAR(20) NOT NULL DEFAULT 'ciudadano' CHECK (origen IN ('ciudadano','oficial')),
  prioridad       VARCHAR(10) CHECK (prioridad IN ('alta','media','baja')),
  confianza       INTEGER CHECK (confianza BETWEEN 0 AND 100),
  evento_id       INTEGER REFERENCES eventos(id) ON DELETE SET NULL,
  usuario_id      INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,  -- NUNCA se expone en la API pública
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alertas climáticas
CREATE TABLE IF NOT EXISTS alertas_climaticas (
  id               SERIAL PRIMARY KEY,
  titulo           VARCHAR(150) NOT NULL,
  descripcion      TEXT,
  zona             VARCHAR(150),
  nivel            VARCHAR(10) NOT NULL CHECK (nivel IN ('amarilla','naranja','roja')),
  recomendaciones  TEXT[] NOT NULL DEFAULT '{}',
  vigente_hasta    TIMESTAMPTZ NOT NULL
);

-- Índices espaciales (GIST): hacen rápidas las búsquedas por distancia
CREATE INDEX IF NOT EXISTS idx_eventos_ubicacion  ON eventos  USING GIST (ubicacion);
CREATE INDEX IF NOT EXISTS idx_reportes_ubicacion ON reportes USING GIST (ubicacion);
CREATE INDEX IF NOT EXISTS idx_eventos_estado     ON eventos (estado);
CREATE INDEX IF NOT EXISTS idx_reportes_evento    ON reportes (evento_id);

-- Tabla de control: qué migraciones ya se aplicaron
CREATE TABLE IF NOT EXISTS migraciones (nombre TEXT PRIMARY KEY, aplicada_en TIMESTAMPTZ DEFAULT NOW());
