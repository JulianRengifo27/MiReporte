# Pilas · Plataforma Web de Emergencias Urbanas

Proyecto universitario (se completará en la FASE 5).

- `frontend/` → React + Vite + MapLibre (mapa OpenStreetMap)
- `backend/` → Node.js + Express + PostgreSQL/PostGIS + Socket.IO
- `legacy/` → primera versión en HTML/CSS (referencia)
- Cambiar el nombre de la app: `frontend/src/config.js` → `APP_NAME`

## Correr el proyecto localmente

### 1. Base de datos (una sola vez)
1. Tener PostgreSQL instalado y **PostGIS** (en Windows: *Stack Builder* → Spatial Extensions → PostGIS).
2. Crear la base `pilas` (en pgAdmin: clic derecho en *Databases* → *Create* → nombre `pilas`).

### 2. Backend
```bash
cd backend
npm install
copy .env.example .env      # luego edita .env con tu contraseña de PostgreSQL
npm run migrar              # crea las tablas
npm run seed                # carga datos de prueba
npm run dev                 # http://localhost:3000
```

### 3. Frontend (otra terminal)
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

## API (FASE 2)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/salud` | Revisa que el servidor y la base estén vivos |
| POST | `/api/reportes` | Crea un reporte (sin login). `multipart/form-data`: `tipo`, `lat`, `lng`, `descripcion?`, `foto?` (máx. 5 MB). Límite: 5 cada 10 min por IP |
| GET | `/api/eventos?lat=&lng=&radio=` | Emergencias cercanas ordenadas por distancia (radio en metros, por defecto 10 000, máx. 50 000) |
| GET | `/api/eventos/:id` | Detalle de una emergencia |
| GET | `/api/alertas-climaticas` | Alertas climáticas vigentes |

**Tiempo real (Socket.IO):** el servidor emite `nuevo_evento` y `evento_actualizado` con el evento completo.

**Privacidad:** las respuestas públicas nunca incluyen `usuario_id` ni datos personales.
