# Guía de despliegue de MiReporte

Así está publicada la plataforma:

| Pieza | Servicio | Dirección |
|---|---|---|
| **Frontend** (React + Vite, PWA) | **Vercel** (plan Hobby, gratis) | https://mi-reporte.vercel.app |
| **Backend** (Node.js + Express + Socket.IO) | **Railway** | https://mireporte-production.up.railway.app |
| **Base de datos** (PostgreSQL + PostGIS, incluye las fotos) | **Railway** (plantilla PostGIS) | Red interna de Railway |
| **Código** | **GitHub** | https://github.com/JulianRengifo27/MiReporte |

Cada `git push` a la rama `main` actualiza solos el backend (Railway) y el frontend (Vercel).

> 🔐 Las llaves y contraseñas (Gemini, JWT, base de datos) se pegan **solo** en los paneles de Railway/Vercel, **nunca** en el código ni en capturas que se compartan. El `.env` está en `.gitignore`.

> 💳 **Railway** se usa con el período de prueba (30 días o 5 USD de crédito, lo que pase primero). Cuando termine, el backend se detiene: hay que pasar al plan *Hobby* (≈ 5 USD/mes) o mudarlo a otro servicio.

---

## Paso 0 · Código en GitHub

```bash
git remote add origin https://github.com/JulianRengifo27/MiReporte.git
git branch -M main
git push -u origin main
```
Comprobar en GitHub que **no** aparezca ningún archivo `.env` (solo `.env.example`).

---

## Paso 1 · Base de datos PostGIS en Railway

1. https://railway.com → **Login with GitHub**.
2. **New Project** → **Deploy a Template** → buscar **PostGIS** → **Deploy**.
   *(Debe ser **PostGIS**, no "PostgreSQL" ni "MySQL": la app necesita la extensión para buscar por distancia.)*
3. Esperar a que el cuadro quede **Online** (verde). Si aparece "Ready to deploy", hay que darle **Deploy** primero.
4. Abrir el cuadro **PostGIS** → **Variables** y ubicar dos valores (son secretos):
   - `DATABASE_PRIVATE_URL` → `postgres://postgres:CLAVE@postgis.railway.internal:5432/railway` (la usa el backend)
   - `DATABASE_URL` → `postgres://postgres:CLAVE@xxxx.proxy.rlwy.net:PUERTO/railway` (la pública: para cargar datos desde el PC)

## Paso 2 · Backend en Railway

1. En el mismo proyecto: **+ Create → GitHub Repo → MiReporte**.
2. Cuadro **MiReporte → Settings**:
   | Campo | Valor |
   |---|---|
   | **Root Directory** | `backend` |
   | **Custom Start Command** | `npm run migrar && npm start` *(crea/actualiza las tablas al arrancar)* |
   | **Healthcheck Path** | `/api/salud` |
3. Cuadro **MiReporte → Variables → Raw Editor** (variables **del servicio**, no "Shared Variables"):
   ```
   DATABASE_URL=PEGA_AQUI_LA_DATABASE_PRIVATE_URL_DE_POSTGIS
   DATABASE_SSL=false
   JWT_SECRET=PEGA_AQUI_UNA_LLAVE_LARGA
   JWT_DURACION=8h
   GEMINI_API_KEY=PEGA_AQUI_TU_LLAVE_DE_GEMINI
   GEMINI_MODEL=gemini-2.5-flash
   FOTOS_EN=bd
   PUBLIC_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
   FRONTEND_URL=https://mi-reporte.vercel.app,http://localhost:5173
   CIERRE_AUTOMATICO_HORAS=72
   ```
   - `DATABASE_URL`: pegar **el valor completo** de `DATABASE_PRIVATE_URL` (paso 1.4). Usamos la privada porque va por la red interna de Railway (más rápida y sin SSL). *Nota: la referencia `${{PostGIS.DATABASE_URL}}` nos llegó vacía porque el servicio interno se llama `postgis`; pegar el valor directo evita ese problema.*
   - `JWT_SECRET`: generarlo con
     ```bash
     node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
     ```
   - `GEMINI_API_KEY`: crearla gratis en https://aistudio.google.com/apikey. Si se deja vacía, la app usa reglas de respaldo.
   - `FOTOS_EN=bd`: las fotos se guardan dentro de PostgreSQL, así que **no hace falta volumen**.
   - `CIERRE_AUTOMATICO_HORAS=72`: para que los datos de la demo no se cierren solos antes de presentar.
4. **Settings → Networking → Generate Domain** (puerto `8080`). Resultado: `mireporte-production.up.railway.app`.
5. Aplicar los cambios con el botón morado **Deploy** (arriba en el lienzo) y esperar a que quede **Active**.
6. Comprobar: https://mireporte-production.up.railway.app/api/salud → `{"ok":true,"db":"conectada"}`.
   En **Deploy Logs** deben verse las 4 migraciones (`001_inicial.sql` … `004_fotos_en_bd.sql`) y `🚨 API de MiReporte`.

## Paso 3 · Cargar los datos de demostración

Desde el PC, en **PowerShell**, dentro de la carpeta `backend`. Usar la URL **pública** de PostGIS (paso 1.4) y **elegir contraseñas nuevas** para las cuentas de la presentación:
```bash
$env:DATABASE_URL="postgres://postgres:CLAVE@xxxx.proxy.rlwy.net:PUERTO/railway"
$env:SEED_PASSWORD_ADMIN="ClaveAdmin2026"
$env:SEED_PASSWORD_ENTIDAD="ClaveEntidad2026"
$env:SEED_PASSWORD_CIUDADANO="ClaveCiudadano2026"
npm.cmd run demo
```
Debe terminar con `✅ Demo lista: 14 emergencias activas, 2 en revisión, 103 reportes en total.`

- En **PowerShell** se usa `$env:NOMBRE="valor"` (no `set`, que no crea variables de entorno) y `npm.cmd` (no `npm`, que PowerShell bloquea).
- En **Command Prompt** (cmd) sería `set NOMBRE=valor` y `npm run demo`.
- Estas variables solo duran mientras la ventana esté abierta; el `.env` local no se toca.
- Si aparece un error de SSL: `$env:DATABASE_SSL="true"` y repetir.

**Cuentas que se crean** (las contraseñas son las que se eligieron arriba):
`admin@mireporte.test` · `bomberos@mireporte.test` · `transito@mireporte.test` · `defensa@mireporte.test` · `ciudadano@mireporte.test`

## Paso 4 · Frontend en Vercel

1. https://vercel.com → **Continue with GitHub** (plan **Hobby**).
2. **Add New… → Project** → importar **MiReporte**.
3. Configurar:
   - **Root Directory:** `frontend`
   - **Application Preset:** Vite (lo toma de `frontend/vercel.json`)
   - **Environment Variables:** `VITE_API_URL` = `https://mireporte-production.up.railway.app` (sin `/` al final)
4. **Deploy** → https://mi-reporte.vercel.app

## Paso 5 · Conectar frontend y backend (CORS)

El backend solo acepta peticiones de las páginas que estén en `FRONTEND_URL`. Después de crear la página en Vercel, en Railway → **MiReporte → Variables**:
```
FRONTEND_URL=https://mi-reporte.vercel.app,http://localhost:5173
```
Aplicar con **Deploy**. Sin este paso, la página carga pero no muestra datos ni deja registrarse.

## Paso 6 · Código QR

```bash
cd frontend
npm.cmd run qr -- https://mi-reporte.vercel.app
```
Crea `frontend/qr-mireporte.png` y `.svg`. También está la página **Compartir** dentro de la app.

## Paso 7 · Instalar como app (PWA)

- **Android (Chrome):** menú ⋮ → **Instalar aplicación**.
- **iPhone (Safari):** botón Compartir ⬆ → **Agregar a inicio**.

## Paso 8 (opcional) · Cambiar el dominio

Vercel → proyecto → **Settings → Domains**. Si se cambia, agregar la nueva dirección a `FRONTEND_URL` en Railway.

---

## Antes de la presentación ✅

- [ ] Abrir https://mireporte-production.up.railway.app/api/salud → `"db":"conectada"`.
- [ ] Verificar que queden días o crédito en el período de prueba de Railway (arriba a la derecha del panel).
- [ ] Si pasaron más de 3 días desde el paso 3, repetirlo (`npm.cmd run demo`).
- [ ] Iniciar sesión como admin y revisar que haya 2 reportes en **Revisión**.
- [ ] Probar un reporte con foto desde el celular con datos móviles.
- [ ] Ver también [GUION_PRESENTACION.md](GUION_PRESENTACION.md).

## Problemas que nos encontramos (y la solución)

| Síntoma | Causa | Solución |
|---|---|---|
| `npm : No se puede cargar el archivo ... npm.ps1` | PowerShell bloquea los scripts | Usar `npm.cmd` en lugar de `npm` (o abrir Command Prompt). |
| Deploy Logs: `❌ Falta DATABASE_URL` | La referencia `${{PostGIS.DATABASE_URL}}` llegaba vacía | Pegar el valor completo de `DATABASE_PRIVATE_URL` de PostGIS. |
| `Network › Healthcheck failure` | El backend arrancó antes que la base o sin `DATABASE_URL` | Desplegar primero PostGIS, corregir la variable y hacer **Redeploy**. |
| `Application not found` en el dominio | Los cambios no se habían aplicado | Botón **Deploy** / **Apply changes** en el lienzo. |
| La página carga pero no hay datos ni registro | CORS: el backend no conocía la página de Vercel | Agregar `https://mi-reporte.vercel.app` a `FRONTEND_URL`. |
| `npm run demo` cargó los datos en la base local | En PowerShell se usó `set` (no crea variables de entorno) | Usar `$env:DATABASE_URL="..."`. |
| La IA siempre dice "reglas de respaldo" | Falta `GEMINI_API_KEY` o no es válida | Revisar la variable en Railway. La app sigue funcionando. |
| La ruta segura no calcula | El servidor público de OSRM está saturado | Esperar unos segundos y repetir. |
| El celular muestra la versión vieja | Caché del service worker | Cerrar y volver a abrir la app. |
