# MiReporte · Plataforma Web de Emergencias Urbanas

Proyecto universitario (el README completo se termina en la FASE 5).

- `frontend/` → React + Vite + MapLibre (mapa OpenStreetMap)
- `backend/` → Node.js + Express + PostgreSQL/PostGIS + Socket.IO + Gemini
- `legacy/` → primera versión en HTML/CSS (referencia)
- Cambiar el nombre de la app: `frontend/src/config.js` → `APP_NAME`

## Correr el proyecto localmente

> En Windows PowerShell usa `npm.cmd` en lugar de `npm` (o abre la terminal *Command Prompt*).

### 1. Base de datos (una sola vez)
1. Tener PostgreSQL instalado y **PostGIS** (en Windows: *Stack Builder* → Spatial Extensions → PostGIS).
2. Crear la base `pilas` (en pgAdmin: clic derecho en *Databases* → *Create* → nombre `pilas`).

### 2. Backend
```bash
cd backend
npm install
copy .env.example .env      # luego edita .env (contraseña de PostgreSQL, JWT_SECRET, GEMINI_API_KEY)
npm run migrar              # crea/actualiza las tablas
npm run seed                # carga datos y cuentas de prueba
npm run dev                 # http://localhost:3000
```

### 3. Frontend (otra terminal)
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### Cuentas de prueba (solo desarrollo)
Las crea `npm run seed`. **Cámbienlas (variables `SEED_PASSWORD_*`) antes de desplegar.**

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@mireporte.test` | `Admin2026*` |
| Entidad oficial (Bomberos) | `bomberos@mireporte.test` | `Entidad2026*` |
| Entidad oficial (Tránsito) | `transito@mireporte.test` | `Entidad2026*` |
| Entidad oficial (Defensa Civil) | `defensa@mireporte.test` | `Entidad2026*` |
| Ciudadano | `ciudadano@mireporte.test` | `Ciudadano2026*` |

## Roles y permisos

Los permisos están en la tabla `permisos` de la base de datos (migración `003_roles_permisos.sql`).
El middleware `requierePermiso('...')` revisa en cada petición que el usuario siga activo y que su rol tenga el permiso.

| Permiso | Qué permite | Anónimo | Ciudadano | Entidad oficial | Admin |
|---|---|:-:|:-:|:-:|:-:|
| *(ninguno)* | Ver el mapa y reportar emergencias | ✅ | ✅ | ✅ | ✅ |
| `ver_mis_reportes` | Ver el historial de sus propios reportes | — | ✅ | ✅ | ✅ |
| `publicar_oficial` | Publicar reportes con sello "Verificado" | — | — | ✅ | ✅ |
| `gestionar_eventos` | Confirmar eventos, cambiar estado (En atención / Resuelta), escribir desvíos | — | — | ✅ | ✅ |
| `revisar_reportes` | Aprobar o rechazar reportes en revisión | — | — | — | ✅ |
| `eliminar_eventos` | Eliminar eventos (uno a uno o los viejos) | — | — | — | ✅ |
| `gestionar_usuarios` | Crear cuentas, cambiar roles, desactivar cuentas | — | — | — | ✅ |
| `ver_estadisticas` | Ver estadísticas por tipo y por día | — | — | — | ✅ |

- El registro público solo crea cuentas de **ciudadano**. Las cuentas de entidades y administradores las crea un admin.
- Un admin no puede cambiar su propio rol ni desactivarse (para no quedarse sin administradores).

## API

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/salud` | público | Estado del servidor y la base |
| POST | `/api/reportes` | público | Crear reporte (`multipart/form-data`: `tipo`, `lat`, `lng`, `descripcion?`, `foto?`). Máx. 5 cada 10 min por IP. Si viene token, queda en el historial del usuario |
| GET | `/api/eventos?lat=&lng=&radio=` | público | Emergencias cercanas ordenadas por distancia |
| GET | `/api/eventos/:id` | público | Detalle |
| GET | `/api/alertas-climaticas` | público | Alertas vigentes |
| POST | `/api/auth/registro` | público | Crear cuenta de ciudadano (`nombre`, `email`, `password`, `acepta_politica`) |
| POST | `/api/auth/login` | público | Devuelve `{ token, usuario }`. Máx. 10 intentos cada 15 min |
| GET | `/api/auth/yo` | login | Perfil y permisos del usuario |
| GET | `/api/mis-reportes` | `ver_mis_reportes` | Historial propio |
| POST | `/api/oficial/reportes` | `publicar_oficial` | Reporte oficial (si hay un evento ciudadano igual cerca, lo toma y lo verifica) |
| GET | `/api/oficial/eventos` | `gestionar_eventos` | Eventos activos / en atención (`?incluir_resueltos=true`) |
| PATCH | `/api/oficial/eventos/:id` | `gestionar_eventos` | `{ estado?, prioridad?, desvio?, via_bloqueada?, confirmar? }` |
| GET | `/api/admin/revision` | `revisar_reportes` | Cola de revisión con el análisis de la IA |
| POST | `/api/admin/eventos/:id/aprobar` · `/rechazar` | `revisar_reportes` | Publicar o descartar |
| DELETE | `/api/admin/eventos/:id` | `eliminar_eventos` | Eliminar un evento |
| DELETE | `/api/admin/eventos-viejos?dias=30` | `eliminar_eventos` | Eliminar resueltos/rechazados viejos |
| GET · POST | `/api/admin/usuarios` | `gestionar_usuarios` | Listar / crear cuentas |
| PATCH | `/api/admin/usuarios/:id` | `gestionar_usuarios` | `{ rol?, entidad?, activo? }` |
| GET | `/api/admin/estadisticas` | `ver_estadisticas` | Reportes por tipo, por día y por estado |

Las rutas protegidas usan la cabecera `Authorization: Bearer <token>`.

**Tiempo real (Socket.IO):** `nuevo_evento`, `evento_actualizado`, `evento_eliminado`.

## Seguridad y privacidad (Ley 1581)
- Contraseñas cifradas con **bcrypt**; sesión con **JWT** que vence (por defecto 8 h).
- Las respuestas públicas **nunca** incluyen `usuario_id` ni datos personales. El admin solo ve si un reporte vino de una cuenta registrada (sí/no), no de quién.
- Validación y limpieza de todas las entradas, CORS limitado a `FRONTEND_URL`, cabeceras de seguridad con **helmet** y *rate limiting*.
- **Cierre automático:** los eventos sin actividad por `CIERRE_AUTOMATICO_HORAS` (6 por defecto) pasan a "Resuelta"; los que siguen en revisión se rechazan.
- Páginas de **Política de privacidad** y **Términos**, y el aviso visible: *"Esta plataforma no reemplaza la línea 123. En una emergencia, llama al 123."*
