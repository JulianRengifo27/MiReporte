-- ===== Migración 004: fotos guardadas dentro de la base de datos =====
-- Los servidores gratuitos (Render) borran sus archivos al reiniciarse,
-- así que guardamos las fotos en PostgreSQL (columna BYTEA) en vez de en una carpeta.
CREATE TABLE IF NOT EXISTS fotos (
  id         UUID PRIMARY KEY,
  tipo_mime  VARCHAR(30) NOT NULL,
  datos      BYTEA NOT NULL,
  tamano     INTEGER NOT NULL,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
