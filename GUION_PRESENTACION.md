# Guion de presentación · MiReporte

**Duración total:** 15 minutos (+ 5 de preguntas)
**Página:** https://mi-reporte.vercel.app
**Presentan:** 3 personas

| Rol | Quién | Parte | Tiempo |
|---|---|---|---|
| **Persona 1** · El problema y el ciudadano | _(nombre)_ | Problema, solución, demo del ciudadano | 0:00 – 5:00 |
| **Persona 2** · La inteligencia | _(nombre)_ | IA, tiempo real, ruta segura | 5:00 – 10:00 |
| **Persona 3** · Las entidades y la tecnología | _(nombre)_ | Panel oficial, administrador, seguridad, cierre | 10:00 – 15:00 |

> 💡 **Cómo leer este guion:** lo que está en *cursiva* es lo que se **dice**. Lo que está en **🖱️** es lo que se **hace** en pantalla. Los recuadros 🛟 son el plan B si algo falla.

---

## ✅ Antes de empezar (10 minutos antes)

- [ ] Abrir https://mireporte-production.up.railway.app/api/salud → debe decir `"db":"conectada"`.
- [ ] Abrir https://mi-reporte.vercel.app en el **computador del proyector**.
- [ ] Abrir la misma página en **un celular** (de la Persona 2) con datos móviles. Dar permiso de ubicación.
- [ ] Tener una **segunda pestaña** con la sesión de **Bomberos** ya iniciada (`bomberos@mireporte.test`).
- [ ] Tener una **tercera pestaña** con la sesión de **admin** ya iniciada (`admin@mireporte.test`).
- [ ] Tener a mano una **foto de un incendio o choque** en el celular (sacada de internet y guardada).
- [ ] Si pasaron más de 3 días desde que se cargó la demo: volver a cargarla (`npm.cmd run demo`, ver DESPLIEGUE.md).
- [ ] Imprimir o poner en la diapositiva el **código QR** (`frontend/qr-mireporte.png`).

> ⚠️ **No mostrar las contraseñas en pantalla.** Iniciar las sesiones antes de que empiece la presentación.

---

## PARTE 1 · El problema y el ciudadano (Persona 1 · 5 min)

### 1.1 Gancho (30 s)
🖱️ *Pantalla: página de inicio de MiReporte.*

> *"Levanten la mano quienes se enteraron de un trancón, una inundación o un accidente en Bogotá por un grupo de WhatsApp o por Twitter… ¿Y cuántas veces esa información era vieja, exagerada o simplemente falsa?"*

### 1.2 El problema (1 min)
> *"Hoy la información sobre emergencias urbanas está **dispersa** en redes sociales, **sin verificar**, con reportes **falsos o repetidos**. Y cuando alguien necesita ayuda, todo depende de una llamada, mientras las entidades se coordinan poco entre ellas."*

> *"Por eso creamos **MiReporte**: una plataforma web **gratuita, sin descargas y sin registro obligatorio**, donde cualquier persona reporta una emergencia en segundos y todos ven en un mapa, en tiempo real, qué está pasando cerca."*

🖱️ *Señalar el logo:* *"Nuestro logo es un pin de mapa con un signo de alerta: 'reporto lo que pasa aquí'."*

### 1.3 Recorrido por el inicio (45 s)
🖱️ *Bajar despacio por la página de inicio.*

> *"Aquí arriba ven un dato en vivo: cuántas emergencias activas hay ahora en Bogotá. Más abajo explicamos cómo funciona en tres pasos: **reportas, la IA verifica y todos se enteran**."*

🖱️ *Señalar el aviso de la línea 123.*
> *"Y algo muy importante: **la plataforma no reemplaza la línea 123**. Lo dejamos visible en todas las páginas."*

### 1.4 Demo: el mapa (1 min)
🖱️ *Clic en **Ver el mapa**.*

> *"El mapa usa **OpenStreetMap**. Se centra en tu ubicación —o en Bogotá si no das permiso— y arriba te dice cuántas emergencias hay a menos de 2 kilómetros."*

🖱️ *Si aparece la alerta "¡Atención! Zona de riesgo cerca", dejarla un segundo y explicarla:*
> *"Como estamos cerca de una zona de deslizamiento, la app nos avisa sola. Incluso puede **leer la alerta en voz alta**."* 🖱️ *Clic en **Escuchar**, luego **Entendido**.*

🖱️ *Señalar los colores:* *"Cada tipo tiene su color: incendio naranja, inundación azul —que se dibuja como un **área de riesgo**—, deslizamiento café…"*

🖱️ *Clic en un marcador (por ejemplo, el **choque de la Av. 68**).*
> *"Al tocar una emergencia vemos qué pasa, a qué hora, su estado, cuántas personas la reportaron, la recomendación de seguridad y el **desvío sugerido** por la entidad. Este tiene el sello azul **Verificado**: lo publicó Tránsito."*

### 1.5 Demo: reportar en 3 toques (1 min 30 s)
🖱️ *Clic en **Reportar emergencia** (botón rojo).*

> *"Reportar toma tres toques: abrir, elegir qué pasa y enviar. La ubicación sale sola del GPS y se puede ajustar arrastrando el pin. La descripción y la foto son opcionales."*

🖱️ *Elegir **Accidente**, escribir: `Choque entre un carro y una moto en la Calle 26 con Carrera 30, un carril cerrado`. Clic en **Enviar reporte**.*

> *"Listo. Sin cuenta, sin descargar nada… y ya aparece en el mapa."*

> 🎤 *"Ahora mi compañero(a) les va a contar qué pasó **por dentro** en esos dos segundos."* → **pasa a Persona 2**

---

## PARTE 2 · La inteligencia (Persona 2 · 5 min)

### 2.1 Tiempo real (1 min)
🖱️ *Mostrar el **celular** a la cámara/al público (o pasarlo a la pantalla si se puede).*

> *"Mientras mi compañero reportaba en el computador, yo tenía la página abierta en mi celular. **Sin recargar**, el reporte apareció aquí en menos de 5 segundos. Eso es porque usamos **WebSockets**: el servidor le avisa al instante a todos los que tienen el mapa abierto."*

🛟 *Si el celular no lo muestra: recargar la página y explicar que la conexión en tiempo real se recupera sola.*

### 2.2 La IA: filtro por capas (2 min)
> *"El gran problema de las redes es la información falsa o repetida. Por eso cada reporte pasa por un **filtro de cuatro capas**:"*

> *"**Capa 1 · Duplicados.** Si 10 personas reportan el mismo choque, no queremos 10 puntos en el mapa. La base de datos, con **PostGIS**, busca si ya hay un reporte igual a menos de 200 metros en la última hora, y si lo hay, lo **une** al mismo evento."*

🖱️ *En el mapa, abrir el **choque de la Av. 68**: señalar "**7 personas reportaron esto**".*

> *"**Capa 2 · Texto.** Usamos **Google Gemini** para leer la descripción: ¿tiene sentido?, ¿corresponde al tipo elegido?, ¿qué tan grave es del 1 al 5?"*

> *"**Capa 3 · Foto.** Si hay foto, Gemini la mira y dice si corresponde a la emergencia."*

> *"**Capa 4 · Reglas.** Con todo eso calculamos un **nivel de confianza de 0 a 100** y una **prioridad Alta, Media o Baja**. Si la confianza es muy baja, el reporte **no se publica**: queda en revisión para un administrador."*

### 2.3 Demo: un reporte falso (1 min)
🖱️ *En el **celular**: Reportar emergencia → **Incendio** → descripción `jajaja prueba xd` → Enviar.*

> *"Miren: escribí un reporte en broma. La IA detectó que no tiene sentido y **no salió en el mapa**. Me dice que quedó **en revisión**. Así evitamos que la plataforma se llene de bromas."*

> *"Y si Gemini falla o se cae, tenemos **reglas de respaldo**: la app nunca deja de funcionar."*

### 2.4 Demo: Ruta segura (1 min)
🖱️ *En el computador: clic en **Ruta segura** (botón arriba a la izquierda del mapa). En **"¿A dónde vas?"** escribir `Estadio El Campin` y elegir la primera sugerencia.*

> *"Escribo a dónde voy —una dirección o un lugar— y la app lo encuentra. También puedo tocar el destino directamente en el mapa."*

> *"Si una emergencia bloquea una vía, **Ruta segura** calcula un camino que la **esquiva**. Pedimos varias rutas, descartamos las que pasan por emergencias reportadas y dibujamos en **verde** la que las evita y es más rápida. En rojo punteado quedan las que descartamos."*

🖱️ *Señalar los datos: distancia, tiempo, minutos extra por el desvío y "esquiva 1". Clic en **Abrir en Google Maps**.*
> *"Y con un toque la abres en Google Maps para que te guíe."*

> ⚠️ *Decirlo con precisión:* *"Es la ruta más rápida que **evita las emergencias reportadas en MiReporte**. No conoce accidentes que nadie haya reportado ni el tráfico en tiempo real; por eso es una recomendación."* (No decir "la mejor vía sin accidentes".)

🛟 *Si la ruta no calcula (el servidor de rutas está saturado): esperar 5 segundos y repetir. Si sigue fallando, mostrar el botón **Ver ruta alternativa** dentro de un popup y explicar que el desvío también lo escriben las entidades.*

> 🎤 *"Y hablando de entidades…"* → **pasa a Persona 3**

---

## PARTE 3 · Las entidades y la tecnología (Persona 3 · 5 min)

### 3.1 Panel de entidad oficial (1 min 30 s)
🖱️ *Cambiar a la pestaña con la sesión de **Bomberos** → **Panel oficial**.*

> *"Las entidades —Bomberos, Tránsito, Cruz Roja, Defensa Civil, Alcaldía— tienen su propio panel. Aquí ven las emergencias ordenadas por prioridad."*

🖱️ *Buscar el **accidente** que reportó la Persona 1. Clic en **✔ Confirmar** y luego **En atención**. Escribir en "Desvío recomendado": `Tome la Av. Américas y retome por la Carrera 50` → **Guardar**.*

> *"Con un clic confirmamos el reporte ciudadano —ahora sale con el sello **Verificado**—, lo marcamos **En atención** y escribimos el desvío. Todos los que tengan el mapa abierto lo ven al instante."*

🖱️ *Volver a la pestaña del mapa y abrir ese evento: mostrar el sello y el desvío.*

> *"Además pueden publicar reportes oficiales desde cero, y esos tienen prioridad sobre los ciudadanos."*

### 3.2 Panel de administrador (1 min 30 s)
🖱️ *Cambiar a la pestaña con la sesión de **admin** → **Administración** → pestaña **Revisión**.*

> *"Aquí llega lo que la IA marcó como dudoso. Miren el reporte en broma de hace un momento: la IA explica **por qué** lo marcó —'no describe una emergencia real'— y el administrador decide: **aprobar o rechazar**."*

🖱️ *Clic en **✕ Rechazar** sobre el reporte en broma.*

🖱️ *Pestaña **Estadísticas**.*
> *"El administrador también ve estadísticas —reportes por tipo y por día—, gestiona usuarios y roles, y elimina eventos viejos. Y los eventos sin actividad se cierran solos."*

### 3.3 Seguridad y privacidad (1 min)
> *"Cumplimos la **Ley 1581** de protección de datos:"*
> - *"**Nunca** mostramos públicamente quién hizo un reporte."*
> - *"Las contraseñas se guardan **cifradas** con bcrypt; ni nosotros podemos leerlas."*
> - *"Cada rol solo puede hacer lo que le corresponde: un ciudadano no entra al panel de Bomberos."*
> - *"Tenemos política de privacidad, términos y límites contra el spam."*

> *"Y la **Ley 1618** de accesibilidad:"* 🖱️ *Abrir el menú de **accesibilidad** (icono de persona arriba a la derecha) y mostrar **A+**, **Alto contraste** y **Escuchar alerta**.*
> *"Botones grandes, letra ajustable, alto contraste y lectura en voz alta."*

### 3.4 Tecnología (30 s)
🖱️ *(Opcional) Diapositiva con el diagrama de arquitectura del README.*

> *"Por dentro: **React** en el frontend publicado en **Vercel**; **Node.js con Express** en el backend en **Railway**; **PostgreSQL con PostGIS** para buscar por distancia; **WebSockets** para el tiempo real; **Google Gemini** para la IA; y **OpenStreetMap** para el mapa y las rutas."*

### 3.5 Cierre (30 s)
🖱️ *Página **Compartir** (o diapositiva con el QR).*

> *"MiReporte se puede **instalar en el celular** como una app, sin pasar por ninguna tienda. Los invitamos a escanear este código y probarla ahora mismo."*

> *"Información verificada, en tiempo real y en un solo lugar. Porque en una emergencia, **cada segundo cuenta**. Muchas gracias."*

> **Los tres:** *"¿Preguntas?"*

---

## 🙋 Preguntas frecuentes (repartidas)

| Pregunta | Responde | Respuesta corta |
|---|---|---|
| ¿Qué pasa si alguien reporta algo falso? | Persona 2 | La IA lo detecta y queda en revisión; el admin lo rechaza. Además hay límite de 5 reportes cada 10 minutos por conexión. |
| ¿Y si la IA se equivoca? | Persona 2 | Nunca decide sola si hay duda: lo dudoso va al administrador. Y si 3 personas reportan lo mismo, se publica igual. |
| ¿Cómo saben que una entidad es real? | Persona 3 | Las cuentas oficiales solo las crea el administrador; nadie puede registrarse como Bomberos. |
| ¿Se puede usar sin internet? | Persona 1 | La página abre sin señal (es una app web instalable), pero para reportar y ver datos nuevos se necesita conexión. |
| ¿Cuánto cuesta? | Persona 3 | Para el usuario, nada. Usamos servicios con planes gratuitos o de prueba; para una ciudad real habría que pagar servidores más grandes. |
| ¿Por qué web y no una app de celular? | Persona 1 | Sin descargas: cualquiera la abre con un link o un QR, en cualquier celular. Y aun así se puede instalar. |
| ¿Qué datos personales guardan? | Persona 3 | Si reportas sin cuenta, solo el reporte. Si te registras: nombre, correo y contraseña cifrada. Nunca se muestran. |
| ¿Funciona fuera de Bogotá? | Persona 2 | Sí: el mapa se centra donde estés. Bogotá es solo el punto por defecto y donde están los datos de demostración. |
| ¿La ruta segura es la mejor vía sin accidentes? | Persona 2 | Es la más rápida que evita las emergencias **reportadas en la plataforma**. No ve tráfico en tiempo real ni lo que nadie reportó; Google Maps complementa eso. |
| ¿Por qué tarda la primera vez? | Persona 3 | Si el servidor estuvo un rato sin uso puede tardar unos segundos en arrancar; luego responde al instante. |

---

## 🛟 Si algo falla en vivo

| Problema | Qué hacer |
|---|---|
| El mapa no carga datos | Abrir `.../api/salud` en otra pestaña para despertar el servidor; esperar 30 s y recargar. |
| No aparece la alerta de zona de riesgo | No pasa nada: saltar ese punto. Solo sale si estás cerca de una zona (o sin GPS, en el centro de Bogotá). |
| El reporte en tiempo real no llega al celular | Recargar el celular; explicar que la conexión se reconecta sola. |
| La IA tarda | Tiene un límite de 4 s; si Gemini no responde, entran las reglas de respaldo. Decirlo como una ventaja. |
| Ruta segura no responde | Esperar y repetir; o mostrar el desvío escrito por la entidad. |
| Se cierra la sesión | Tener las contraseñas anotadas **fuera de la pantalla** para volver a entrar. |

---

## 📋 Resumen para recordar (una línea por persona)

- **Persona 1:** *"El problema es la información dispersa y falsa; MiReporte permite reportar en 3 toques y ver todo en un mapa."*
- **Persona 2:** *"La IA une duplicados, filtra falsos y prioriza; todo llega en tiempo real y te da una ruta segura."*
- **Persona 3:** *"Las entidades verifican y coordinan, el admin modera, y todo protege los datos y es accesible."*
