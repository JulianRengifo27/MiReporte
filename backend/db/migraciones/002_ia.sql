-- ===== Migración 002: campos para el análisis con IA (FASE 3) =====

-- Nivel de confianza del evento (0-100) y resumen del análisis
ALTER TABLE eventos  ADD COLUMN IF NOT EXISTS confianza   INTEGER NOT NULL DEFAULT 50 CHECK (confianza BETWEEN 0 AND 100);
ALTER TABLE eventos  ADD COLUMN IF NOT EXISTS analisis_ia JSONB;

-- Resultado del análisis de cada reporte individual (para que el admin lo revise en la FASE 4)
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS analisis_ia JSONB;

-- Los eventos oficiales ya cargados tienen confianza máxima
UPDATE eventos SET confianza = 100 WHERE origen = 'oficial';
UPDATE eventos SET confianza = LEAST(100, 40 + cantidad_reportes * 10) WHERE origen = 'ciudadano';

-- Índice para buscar duplicados recientes del mismo tipo
CREATE INDEX IF NOT EXISTS idx_eventos_tipo_actualizado ON eventos (tipo, actualizado_en DESC);
