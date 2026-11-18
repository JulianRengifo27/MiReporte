-- ===== Migración 005: para reportar se necesita una cuenta =====
-- Nuevo permiso "reportar" para todos los roles. Las rutas de reportes lo exigen,
-- así una cuenta desactivada por el administrador ya no puede reportar.
INSERT INTO permisos (rol, permiso, descripcion) VALUES
  ('ciudadano',       'reportar', 'Crear reportes de emergencias'),
  ('entidad_oficial', 'reportar', 'Crear reportes de emergencias'),
  ('admin',           'reportar', 'Crear reportes de emergencias')
ON CONFLICT (rol, permiso) DO NOTHING;
