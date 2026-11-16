# Guía de despliegue de MiReporte (gratis)

Al final tendrás, sin pagar nada:
- **Base de datos PostgreSQL + PostGIS** en **Neon** (gratis, no vence)
- **Backend** (Node + Socket.IO) en **Render** (gratis) → `https://mireporte-api.onrender.com` (ejemplo)
- **Frontend** en **Vercel** (gratis) → `https://mireporte.vercel.app` (ejemplo)

Tiempo aproximado: 40 minutos. **Ningún paso debería pedir tarjeta de crédito**: si alguno la pide, detente.

> 🔐 Las llaves (Gemini, contraseñas) se pegan **solo** en los paneles de Render/Vercel, **nunca** en el código. El `.env` está en `.gitignore`.

> ⏱️ El backend gratis de Render **se duerme** tras 15 minutos sin visitas; la primera visita después tarda ~50 segundos. Antes de presentar, abre la página un par de minutos antes.

---

## Paso 0 · El código en GitHub ✅

Ya está en `https://github.com/JulianRengifo27/MiReporte`. Cada vez que se suben cambios (`git push`), Render y Vercel se actualizan solos.

---

## Paso 1 · Base de datos en Neon

1. Entra a https://neon.tech → **Sign up** → **Continue with GitHub**.
2. Crea el proyecto:
   - **Project name:** `mireporte`
   - **Postgres version:** la que venga por defecto
   - **Region:** la más cercana disponible (por ejemplo *AWS US East*)
   - **Create project**
3. En el tablero, botón **Connect**:
   - Desactiva **Connection pooling** (usaremos la conexión directa).
   - Copia la **connection string**. Se ve así:
     `postgresql://neondb_owner:XXXX@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - Guárdala: la necesitas en los pasos 2 y 3. **Es secreta** (tiene la contraseña).

No tienes que activar PostGIS a mano: la primera migración ejecuta `CREATE EXTENSION postgis` sola.

## Paso 2 · Backend en Render

1. Entra a https://render.com → **Get Started** → **GitHub**.
2. Arriba: **New + → Blueprint**.
3. Conecta tu cuenta de GitHub y elige el repositorio **MiReporte**. Render encuentra el archivo `render.yaml`.
4. Render te pide el valor de las variables secretas:
   | Variable | Qué poner |
   |---|---|
   | `DATABASE_URL` | La connection string de Neon (paso 1.3) |
   | `GEMINI_API_KEY` | Tu llave de Gemini (la misma de tu `.env` local). Si no tienes, déjala vacía. |
   | `FRONTEND_URL` | Por ahora `http://localhost:5173` (lo cambiamos en el paso 5) |

   El resto ya viene configurado (`JWT_SECRET` lo genera Render automáticamente y es secreto).
5. **Apply / Deploy Blueprint**. Espera unos 3–5 minutos. En **Logs** debes ver:
   ```
   ✅ Migración aplicada: 001_inicial.sql ... 004_fotos_en_bd.sql
   🚨 API de MiReporte en http://localhost:10000
   ```
6. Arriba aparece la dirección del servicio, por ejemplo `https://mireporte-api.onrender.com`. Ábrela con `/api/salud` al final:
   `https://mireporte-api.onrender.com/api/salud` → `{"ok":true,"db":"conectada"}`

## Paso 3 · Cargar los datos de demostración en Neon

Desde tu computador, en **Command Prompt** (no PowerShell), dentro de la carpeta `backend`.
Cambia la URL por la de Neon y **elige contraseñas nuevas** para las cuentas de la presentación:
```bash
set DATABASE_URL=postgresql://neondb_owner:XXXX@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
set DATABASE_SSL=true
set SEED_PASSWORD_ADMIN=UnaClaveFuerte2026
set SEED_PASSWORD_ENTIDAD=OtraClaveFuerte2026
set SEED_PASSWORD_CIUDADANO=ClaveCiudadano2026
npm run demo
```
Debe decir `✅ Demo lista: ... emergencias activas`.
Las variables `set` solo duran mientras esa ventana esté abierta; tu `.env` local no se toca.
Guarda esas contraseñas en un lugar seguro del equipo (no en el repositorio).

## Paso 4 · Frontend en Vercel

1. Entra a https://vercel.com → **Continue with GitHub** (plan **Hobby**, gratis).
2. **Add New… → Project** → importa **MiReporte**.
3. Configura:
   - **Root Directory:** `frontend` (botón *Edit*)
   - **Framework Preset:** Vite (lo detecta solo)
   - **Environment Variables:** `VITE_API_URL` = la dirección de Render, **sin** `/` al final
     (por ejemplo `https://mireporte-api.onrender.com`)
4. **Deploy**. Al terminar te da la dirección, por ejemplo `https://mireporte.vercel.app`.

## Paso 5 · Conectar el backend con el frontend (CORS)

1. En Render → servicio `mireporte-api` → **Environment** → edita `FRONTEND_URL`:
   `https://mireporte.vercel.app,http://localhost:5173`
2. **Save Changes**: Render vuelve a desplegar solo (~2 min).
3. Abre la página de Vercel: debe cargar el inicio y el mapa con las emergencias.
4. Prueba el tiempo real: abre el mapa en el celular y en el PC, reporta en uno y mira el otro.

## Paso 6 · Código QR

```bash
cd frontend
npm run qr -- https://mireporte.vercel.app
```
Crea `frontend/qr-mireporte.png`. También está la página **Compartir** dentro de la app.

## Paso 7 · Instalar como app (PWA)

- **Android (Chrome):** menú ⋮ → **Instalar aplicación**.
- **iPhone (Safari):** botón Compartir ⬆ → **Agregar a inicio**.

## Paso 8 (opcional) · Dominio

En Vercel → proyecto → **Settings → Domains** puedes cambiar el nombre `.vercel.app` gratis, o conectar un dominio comprado. Si lo cambias, actualiza también `FRONTEND_URL` en Render.

---

## Antes de la presentación ✅

- [ ] **5 minutos antes**, abre `https://TU-BACKEND.onrender.com/api/salud` para despertar el servidor.
- [ ] Si pasaron más de 3 días desde el paso 3, repítelo (`npm run demo`): el cierre automático pasa a "Resuelta" lo que lleva 72 horas sin actividad.
- [ ] Inicia sesión como admin y revisa que haya 2 reportes en **Revisión** para mostrar la IA.
- [ ] Prueba un reporte con foto desde el celular (con datos móviles).
- [ ] Prueba **Ruta segura** con un destino al otro lado de una emergencia.
- [ ] Ten a mano el QR y las contraseñas de las cuentas de demostración.

## Problemas comunes

| Síntoma | Solución |
|---|---|
| La página tarda ~1 minuto la primera vez | Normal en Render gratis: el servidor se estaba despertando. |
| "No hay conexión con el servidor" | `VITE_API_URL` mal escrita en Vercel (sin `https://` o con `/` al final), o `FRONTEND_URL` en Render no coincide con la dirección de Vercel. Tras cambiar `VITE_API_URL` hay que **Redeploy** en Vercel. |
| `/api/salud` dice "sin conexión" | `DATABASE_URL` mal copiada en Render, o falta `?sslmode=require` al final. |
| Logs de Render: `password authentication failed` | Copiaste mal la contraseña de Neon. En Neon → **Connect** puedes copiarla de nuevo. |
| Logs de Render: error con `postgis` | En Neon → **SQL Editor** ejecuta `CREATE EXTENSION postgis;` y en Render haz **Manual Deploy → Deploy latest commit**. |
| La IA siempre dice "reglas de respaldo" | Falta `GEMINI_API_KEY` en Render o la llave no es válida. La app sigue funcionando igual. |
| La ruta segura no calcula | El servidor público de OSRM es de demostración y a veces se satura. Espera unos segundos. |
| El celular muestra la versión vieja | Cierra y vuelve a abrir la app (el service worker se actualiza en la segunda carga). |
