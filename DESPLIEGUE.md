# Guía de despliegue de MiReporte (paso a paso)

Al final tendrás:
- **Backend + base de datos PostGIS** en **Railway** → `https://mireporte-api.up.railway.app` (ejemplo)
- **Frontend** en **Vercel** → `https://mireporte.vercel.app` (ejemplo)

Tiempo aproximado: 40 minutos. Todo se puede hacer con planes gratuitos o de prueba.

> 🔐 **Regla de oro:** las llaves (Gemini, JWT, contraseñas) se pegan **solo** en los paneles de Railway/Vercel, **nunca** en el código ni en GitHub. El `.env` ya está en `.gitignore`.

---

## Paso 0 · Subir el código a GitHub

1. Crea una cuenta en https://github.com (si no tienes).
2. Arriba a la derecha **+ → New repository** → nombre `mireporte` → **Private** → *Create repository* (sin README).
3. En la terminal, en la carpeta del proyecto (copia la URL que te muestra GitHub):
   ```bash
   git remote add origin https://github.com/TU_USUARIO/mireporte.git
   git branch -M main
   git push -u origin main
   ```
4. Revisa en GitHub que **no** aparezca ningún archivo `.env` (solo `.env.example`).

---

## Paso 1 · Base de datos PostGIS en Railway

1. Entra a https://railway.com → **Login with GitHub**.
2. **New Project → Deploy a Template** → busca **"PostGIS"** → elige la plantilla de PostGIS → **Deploy**.
   *(Usa la plantilla de PostGIS, no la de PostgreSQL normal: necesitamos la extensión para buscar por distancia.)*
3. Espera a que el cuadro de la base quede en verde (**Active**).

## Paso 2 · Backend en Railway

1. Dentro del mismo proyecto: **+ Create → GitHub Repo** → elige `mireporte`.
   (La primera vez Railway te pide permiso para ver tus repositorios: dale acceso a `mireporte`.)
2. Haz clic en el nuevo servicio → **Settings**:
   - **Root Directory:** `backend`
   - (El archivo `backend/railway.json` ya le dice a Railway que antes de arrancar ejecute `npm run migrar` y que revise `/api/salud`.)
3. Pestaña **Variables → Raw Editor**, pega esto y cambia lo que está en MAYÚSCULAS:
   ```
   DATABASE_URL=${{PostGIS.DATABASE_URL}}
   DATABASE_SSL=false
   JWT_SECRET=PEGA_AQUI_UNA_LLAVE_LARGA
   JWT_DURACION=8h
   GEMINI_API_KEY=PEGA_AQUI_TU_LLAVE_DE_GEMINI
   GEMINI_MODEL=gemini-2.5-flash
   UPLOAD_DIR=/app/uploads
   PUBLIC_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
   FRONTEND_URL=http://localhost:5173
   CIERRE_AUTOMATICO_HORAS=6
   ```
   - `${{PostGIS.DATABASE_URL}}` conecta con la base del paso 1. Si tu base tiene otro nombre en el tablero (por ejemplo `Postgres`), cambia `PostGIS` por ese nombre. Al escribir `${{` Railway te sugiere las opciones.
   - Para crear el `JWT_SECRET`, ejecuta esto en tu terminal y copia el resultado (usa uno **distinto** al de tu `.env` local):
     ```bash
     node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
     ```
   - `FRONTEND_URL` lo cambiaremos en el paso 5, cuando exista la página de Vercel.
4. **Volumen para las fotos** (si no, las fotos se borran en cada despliegue):
   clic derecho sobre el servicio del backend → **Attach Volume** → *Mount path*: `/app/uploads`.
5. **Settings → Networking → Generate Domain**. Copia la dirección, por ejemplo `https://mireporte-api.up.railway.app`.
6. Espera el despliegue (pestaña **Deployments** en verde) y abre en el navegador:
   `https://TU-BACKEND.up.railway.app/api/salud` → debe decir `{"ok":true,"db":"conectada"}`.

## Paso 3 · Cargar los datos de demostración en Railway

Las tablas ya se crearon solas (`npm run migrar` en el pre-deploy). Falta cargar los datos y las cuentas:

1. En Railway, abre la base **PostGIS → Variables** y copia `DATABASE_PUBLIC_URL` (la que termina en `.proxy.rlwy.net:NÚMERO/railway`).
2. En tu computador, abre **Command Prompt** (no PowerShell) en la carpeta `backend` y ejecuta (cambia la URL y **elige contraseñas nuevas**: estas serán las de la presentación):
   ```bash
   set DATABASE_URL=postgresql://postgres:XXXX@XXXX.proxy.rlwy.net:12345/railway
   set SEED_PASSWORD_ADMIN=UnaClaveFuerte2026
   set SEED_PASSWORD_ENTIDAD=OtraClaveFuerte2026
   set SEED_PASSWORD_CIUDADANO=ClaveCiudadano2026
   npm run demo
   ```
   Debe decir `✅ Demo lista: ... emergencias activas`.
   Las variables `set` solo duran mientras esa ventana esté abierta; tu `.env` local no se toca.
3. Guarda esas contraseñas en un lugar seguro del equipo (no en el repositorio).

> Si sale un error de SSL, repite con `set DATABASE_SSL=true` antes de `npm run demo`.

## Paso 4 · Frontend en Vercel

1. Entra a https://vercel.com → **Continue with GitHub**.
2. **Add New… → Project** → importa `mireporte`.
3. Configura:
   - **Root Directory:** `frontend` (botón *Edit*)
   - **Framework Preset:** Vite (lo detecta solo; `frontend/vercel.json` ya trae la configuración)
   - **Environment Variables:** `VITE_API_URL` = `https://TU-BACKEND.up.railway.app` (sin `/` al final)
4. **Deploy**. Al terminar te da la dirección, por ejemplo `https://mireporte.vercel.app`.

## Paso 5 · Conectar el backend con el frontend (CORS)

1. En Railway → backend → **Variables**: cambia
   `FRONTEND_URL=https://mireporte.vercel.app`
   (puedes poner varias separadas por coma, por ejemplo también `http://localhost:5173` para seguir probando en local).
2. Railway vuelve a desplegar solo. Abre la página de Vercel: debe cargar el mapa con las emergencias.
3. Prueba el tiempo real: abre la página en el celular y en el PC, reporta en uno y mira el otro.

## Paso 6 · Código QR

```bash
cd frontend
npm run qr -- https://mireporte.vercel.app
```
Crea `frontend/qr-mireporte.png` (para la diapositiva o para imprimir). También está la página **📲 Compartir** dentro de la app, que muestra el QR de la dirección donde esté publicada.

## Paso 7 · Instalar como app (PWA)

- **Android (Chrome):** abre la página → menú ⋮ → **Instalar aplicación**.
- **iPhone (Safari):** botón Compartir ⬆ → **Agregar a inicio**.

Necesita HTTPS, que Vercel ya da gratis.

## Paso 8 (opcional) · Dominio propio

- **Gratis:** en Vercel → proyecto → **Settings → Domains** puedes cambiar `mireporte-xxxx.vercel.app` por otro nombre libre `.vercel.app`.
- **Dominio comprado** (por ejemplo `mireporte.co`): Vercel → **Settings → Domains → Add** y sigue las instrucciones para crear el registro DNS en la página donde lo compraste. Después agrégalo también a `FRONTEND_URL` en Railway.

---

## Antes de la presentación ✅

- [ ] Abre `/api/salud` del backend: `"db":"conectada"`.
- [ ] **El mismo día**, vuelve a ejecutar el **Paso 3** (`npm run demo`): el cierre automático pasa a "Resuelta" lo que lleva más de 6 horas sin actividad. Otra opción: subir `CIERRE_AUTOMATICO_HORAS` a `72` en Railway.
- [ ] Inicia sesión con la cuenta de admin y revisa que haya 2 reportes en **Revisión** para mostrar la IA.
- [ ] Prueba un reporte desde el celular (con datos móviles, no solo Wi-Fi).
- [ ] Prueba **🧭 Ruta segura** con un destino al otro lado de una emergencia.
- [ ] Ten a mano el QR y las contraseñas de las cuentas de demostración.

## Problemas comunes

| Síntoma | Solución |
|---|---|
| La página dice "No hay conexión con el servidor" | `VITE_API_URL` en Vercel mal escrita (sin `https://` o con `/` al final), o `FRONTEND_URL` en Railway no coincide con la dirección de Vercel. Tras cambiar `VITE_API_URL` hay que **redesplegar** en Vercel. |
| `/api/salud` dice "sin conexión" | `DATABASE_URL` no apunta a la base. Revisa la referencia `${{...}}`. |
| Error `type "geography" does not exist` | La base no tiene PostGIS: usa la plantilla PostGIS del paso 1. |
| Las fotos desaparecen | Falta el volumen en `/app/uploads` (paso 2.4) o `UPLOAD_DIR` distinto. |
| Las fotos no cargan (imagen rota) | `PUBLIC_URL` debe ser la dirección pública del backend con `https://`. |
| La IA siempre dice "reglas de respaldo" | Falta `GEMINI_API_KEY` o la llave no es válida. La app sigue funcionando igual. |
| La ruta segura no calcula | El servidor público de OSRM es de demostración y a veces se satura. Espera unos segundos e intenta de nuevo. |
| Cambié algo y el celular muestra la versión vieja | Cierra y vuelve a abrir la app (el service worker se actualiza en la segunda carga). |
