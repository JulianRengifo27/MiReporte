-- ===== Migración 003: roles, permisos y administración (FASE 4) =====

-- Nuevo estado "rechazado" para eventos que el admin descarta
ALTER TABLE eventos DROP CONSTRAINT IF EXISTS eventos_estado_check;
ALTER TABLE eventos ADD CONSTRAINT eventos_estado_check
  CHECK (estado IN ('activa', 'en_atencion', 'resuelta', 'pendiente_revision', 'rechazado'));

-- Quién revisó / cerró el evento (uso interno, NUNCA se expone en la API pública)
ALTER TABLE eventos  ADD COLUMN IF NOT EXISTS revisado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL;

-- Permite desactivar una cuenta sin borrarla
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_reportes_usuario ON reportes (usuario_id);

-- Tabla de permisos: qué puede hacer cada rol
CREATE TABLE IF NOT EXISTS permisos (
  rol          VARCHAR(20) NOT NULL CHECK (rol IN ('ciudadano', 'entidad_oficial', 'admin')),
  permiso      VARCHAR(50) NOT NULL,
  descripcion  TEXT NOT NULL,
  PRIMARY KEY (rol, permiso)
);

INSERT INTO permisos (rol, permiso, descripcion) VALUES
  -- Ciudadano registrado
  ('ciudadano',       'ver_mis_reportes',   'Ver el historial de sus propios reportes'),
  -- Entidad oficial (Bomberos, Tránsito, Cruz Roja, Defensa Civil, Alcaldía)
  ('entidad_oficial', 'ver_mis_reportes',   'Ver el historial de sus propios reportes'),
  ('entidad_oficial', 'publicar_oficial',   'Publicar reportes oficiales con sello Verificado'),
  ('entidad_oficial', 'gestionar_eventos',  'Confirmar eventos, cambiar estado (En atención / Resuelta) y escribir desvíos'),
  -- Administrador
  ('admin',           'ver_mis_reportes',   'Ver el historial de sus propios reportes'),
  ('admin',           'publicar_oficial',   'Publicar reportes oficiales con sello Verificado'),
  ('admin',           'gestionar_eventos',  'Confirmar eventos, cambiar estado y escribir desvíos'),
  ('admin',           'revisar_reportes',   'Aprobar o rechazar reportes en revisión'),
  ('admin',           'eliminar_eventos',   'Eliminar eventos (uno a uno o los viejos)'),
  ('admin',           'gestionar_usuarios', 'Crear usuarios, cambiar roles y desactivar cuentas'),
  ('admin',           'ver_estadisticas',   'Ver estadísticas de reportes por tipo y por día')
ON CONFLICT (rol, permiso) DO NOTHING;
