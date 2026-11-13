# MiReporte · Plataforma Web de Emergencias Urbanas

Plataforma web **gratuita, sin descargas y sin registro obligatorio** para reportar y consultar emergencias urbanas en Colombia (accidentes, incendios, inundaciones, deslizamientos, trancones).

**Equipo:** Julian Rengifo Forero, José Giraldo Sarmiento, Johan Wilches Olarte, Valerie Rincón Zuluaga y Daniel Galindo Madero.

> ⚠️ Esta plataforma no reemplaza la línea 123. En una emergencia, llama al 123.

## El problema y la solución
La información sobre emergencias está dispersa en redes sociales, sin verificar y con reportes falsos o duplicados, y la ayuda depende de llamadas. **MiReporte** permite reportar en segundos (GPS automático, tipo, descripción y foto) y ver en un **mapa en tiempo real** las emergencias cercanas, su estado y **rutas que las evitan**. Una **IA** filtra duplicados y reportes falsos y asigna prioridad, y las **entidades oficiales** publican reportes verificados.

## Funcionalidades
| Requerimiento | Cómo se cumple |
|---|---|
| **RF01** Reportar | Botón flotante → tipo, pin GPS ajustable, descripción y foto. 3 toques. Sin cuenta. |
| **RF02** Mapa en tiempo real | MapLibre + OpenStreetMap, íconos y colores por tipo, áreas circulares de riesgo, Socket.IO |
| **RF03** Integración oficial | Panel oficial: reportes con sello "✔ Verificado" que toman el control de los eventos ciudadanos |
| **RF04** Rutas alternativas | Desvío escrito por la entidad + **🧭 Ruta segura** (OSRM) que calcula y dibuja una ruta que esquiva las emergencias, con link a Google Maps |
| **RF05** IA | Duplicados con PostGIS (200 m / 60 min), Gemini para texto e imagen, confianza 0–100, prioridad Alta/Media/Baja, cola de revisión |
| **RNF01** ≤ 5 s | Socket.IO empuja cada evento nuevo; la IA tiene un límite de 4 s y reglas de respaldo |
| **RNF02** Escalable | API sin estado (JWT), pool de conexiones, índices espaciales GIST, fotos listas para pasar a la nube |
| **RNF03** Ley 1581 | La API pública nunca expone quién reporta; bcrypt; política de privacidad |
| **RNF04** Ley 1618 | Botones ≥ 48 px, alto contraste, A+/A−, "Escuchar alerta" (voz) |
| Extra | PWA instalable, código QR, cierre automático de eventos inactivos |

## Arquitectura

```
                      ┌──────────────────────────────┐
  Celular / PC  ───▶  │  Frontend (Vercel)           │  React + Vite + MapLibre, PWA
                      │  mapa · reportes · paneles   │
                      └──────┬───────────────┬───────┘
              REST (HTTPS)   │               │  WebSocket (Socket.IO)
                             ▼               ▼
                      ┌──────────────────────────────┐      ┌─────────────────────┐
                      │  Backend (Railway)           │ ───▶ │ Google Gemini (IA)  │
                      │  Node.js + Express           │      └─────────────────────┘
                      │  JWT · helmet · rate limit   │
                      │  services/ia.js · cierre     │      ┌─────────────────────┐
                      └──────┬───────────────┬───────┘      │ OSRM (rutas)        │◀── el frontend
                             ▼               ▼              └─────────────────────┘
               ┌───────────────────┐   ┌───────────────┐    ┌─────────────────────┐
               │ PostgreSQL+PostGIS│   │ Volumen fotos │    │ OpenStreetMap tiles │◀── el frontend
               │ (Railway)         │   │ (Railway)     │    └─────────────────────┘
               └───────────────────┘   └───────────────┘
```

**Flujo de un reporte:** el navegador envía el reporte → la IA analiza texto e imagen (máx. 4 s) → PostGIS busca duplicados → se guarda (nuevo evento o +1 a uno existente) → Socket.IO lo envía a todos los mapas abiertos. Si la confianza es baja, queda en revisión para el admin.

## Estructura
```
frontend/   React + Vite
  src/pages/        Inicio (mapa), Ingresar, MisReportes, PanelOficial, PanelAdmin, Legal, Compartir
  src/components/   Mapa, Feed, FormularioReporte, PanelRuta, AlertasClima, AlertaProximidad, ...
  src/utils/        geo.js (distancias), rutas.js (OSRM), voz.js
  public/           manifest.webmanifest, sw.js, íconos
  scripts/          generar-qr.mjs, generar-iconos.mjs
backend/    Node.js + Express
  src/routes/       reportes, eventos, alertas, auth, misReportes, oficial, admin
  src/services/     ia.js, eventos.js, almacenamiento.js, cierre.js
  src/middleware/   auth.js (JWT + permisos)
  db/migraciones/   001 inicial, 002 IA, 003 roles y permisos
  db/seed.sql · db/demo.sql
legacy/     primera versión en HTML/CSS (referencia)
DESPLIEGUE.md   guía paso a paso para publicar en Railway y Vercel
```

## Tecnologías
React 18 · Vite · MapLibre GL JS · OpenStreetMap · OSRM · Node.js · Express · PostgreSQL · PostGIS · Socket.IO · Google Gemini · JWT · bcrypt · helmet · express-rate-limit · multer · Railway · Vercel · PWA (service worker) · qrcode

Cambiar el nombre de la app: `frontend/src/config.js` → `APP_NAME`.

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
npm run demo                # (opcional) seed + datos extra para la presentación
npm run dev                 # http://localhost:3000
```

### 3. Frontend (otra terminal)
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
npm run qr -- https://tu-app.vercel.app   # genera qr-mireporte.png
```

## Publicar en internet
Sigue [DESPLIEGUE.md](DESPLIEGUE.md): backend + PostGIS en **Railway** y frontend en **Vercel**.

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
