# Guion de presentación – MiReporte

Plataforma web de información de emergencias urbanas
Página: https://mi-reporte.vercel.app
Duración aproximada: 16 minutos (4 minutos por persona)

## Distribución

| Persona | Funcionalidades que explica | Tiempo |
|---|---|---|
| Persona 1: ________________ | Qué es MiReporte, página de inicio, mapa, lista de emergencias y alertas | 0:00 – 4:00 |
| Persona 2: ________________ | Reportar una emergencia, análisis con inteligencia artificial y tiempo real | 4:00 – 8:00 |
| Persona 3: ________________ | Ruta segura, cuenta de ciudadano, accesibilidad e instalación como app | 8:00 – 12:00 |
| Persona 4: ________________ | Panel de entidades oficiales, panel de administrador, seguridad y tecnología | 12:00 – 16:00 |

Convención: el texto normal es lo que se dice. Las líneas que empiezan con **[Pantalla]** indican lo que se hace en el computador.

## Preparación (antes de empezar)

- Abrir https://mireporte-production.up.railway.app/api/salud y confirmar que diga "conectada" (despierta el servidor).
- Abrir https://mi-reporte.vercel.app en el computador del proyector, en la página de inicio.
- Dejar abiertas dos pestañas más con sesión iniciada: una como **Bomberos** (bomberos@mireporte.test) y otra como **administrador** (admin@mireporte.test). No mostrar contraseñas.
- Tener la página abierta en un celular (Persona 2) con permiso de ubicación.
- Si pasaron más de 3 días desde la última carga de datos de demostración, volver a cargarlos (ver DESPLIEGUE.md, paso 3).

---

## Persona 1 – Qué es MiReporte y cómo se consulta la información (4 min)

### 1. Presentación de la plataforma

**[Pantalla]** Página de inicio.

MiReporte es una plataforma web para reportar y consultar emergencias urbanas: accidentes, incendios, inundaciones, deslizamientos, trancones y otros eventos.

Nace de un problema concreto: hoy la información sobre emergencias está dispersa en redes sociales, no está verificada y muchas veces está repetida o es falsa. Además, la ayuda depende casi siempre de una llamada y las entidades se coordinan poco entre ellas.

La plataforma reúne en un solo lugar los reportes de los ciudadanos y los de las entidades oficiales. Es gratuita, no hay que descargar nada y no es obligatorio registrarse para reportar.

### 2. Página de inicio

**[Pantalla]** Bajar despacio por la página de inicio.

En la parte superior está el acceso a las dos acciones principales: reportar una emergencia y ver el mapa. Debajo se muestra un dato en vivo con el número de emergencias activas en la ciudad.

La página explica el funcionamiento en tres pasos: el ciudadano reporta, la inteligencia artificial verifica el reporte, y la emergencia aparece en el mapa de todos.

En todas las páginas está visible el aviso: "Esta plataforma no reemplaza la línea 123". MiReporte es una herramienta de información, no un servicio de atención de emergencias.

### 3. El mapa

**[Pantalla]** Clic en "Ver el mapa".

El mapa usa OpenStreetMap. Se centra en la ubicación del usuario, que aparece como un punto azul con la etiqueta "Tú" y un círculo que indica el margen de error del GPS. Si el usuario no da permiso de ubicación, el mapa se centra en Bogotá.

**[Pantalla]** Mover el mapa y luego tocar el botón "Mi ubicación" (debajo de los botones de zoom).

Si el usuario se desplaza por el mapa, el botón "Mi ubicación" lo regresa a su posición actual.

En la parte superior aparece un resumen con el número de emergencias a menos de 2 kilómetros.

Cada tipo de emergencia tiene un ícono y un color: rojo para accidentes, naranja para incendios, azul para inundaciones, café para deslizamientos y amarillo para trancones. Las inundaciones, los deslizamientos y los incendios se dibujan además como un área circular, que representa la zona de riesgo.

### 4. Detalle de una emergencia

**[Pantalla]** Clic en un marcador, por ejemplo el accidente de la Avenida 68.

Al tocar una emergencia se abre su detalle: la descripción, la hora del reporte, el estado, la prioridad, cuántas personas la reportaron y una recomendación de seguridad según el tipo.

El estado puede ser Activa, En atención o Resuelta. Si la publicó una entidad oficial, aparece el sello azul "Verificado" con el nombre de la entidad.

Cuando la emergencia bloquea una vía, se muestra el desvío recomendado por la entidad y el botón "Ver ruta alternativa", que abre Google Maps.

### 5. Lista de emergencias y alertas

**[Pantalla]** Señalar la lista lateral (en celular, la pestaña "Lista").

Las mismas emergencias aparecen en una lista ordenada por cercanía, con su tipo, hora, distancia, estado y origen (ciudadano u oficial).

**[Pantalla]** Abrir la barra de alertas climáticas.

En la parte superior están las alertas climáticas, por ejemplo lluvias fuertes, con sus recomendaciones.

Además, si el usuario está dentro o muy cerca de una zona de riesgo, la plataforma muestra un aviso automático, por ejemplo: "Estás cerca de una zona de deslizamiento. Aléjate de laderas".

---

## Persona 2 – Reportar una emergencia, inteligencia artificial y tiempo real (4 min)

### 1. Reportar una emergencia

**[Pantalla]** Clic en el botón rojo "Reportar emergencia".

Reportar está pensado para hacerse en segundos, en tres toques: abrir el formulario, elegir el tipo de emergencia y enviar.

El formulario tiene cuatro partes:
- El tipo de emergencia, con botones grandes.
- La ubicación, que se toma automáticamente del GPS. Si no es exacta, se puede ajustar arrastrando el pin o tocando el mapa.
- Una descripción corta, opcional.
- Una foto, opcional, que se puede tomar en el momento con la cámara del celular.

**[Pantalla]** Elegir "Accidente", escribir "Choque entre un carro y una moto, un carril cerrado" y enviar.

No es necesario tener cuenta. Si el usuario inició sesión, el reporte también queda guardado en su historial.

### 2. Análisis con inteligencia artificial

Cada reporte pasa por un filtro de cuatro capas antes de publicarse:

**Capa 1 – Duplicados.** La base de datos busca si ya existe un reporte del mismo tipo a menos de 200 metros en la última hora. Si existe, el nuevo reporte se une al mismo evento y aumenta el contador. Así, si diez personas reportan el mismo choque, en el mapa aparece un solo evento.

**[Pantalla]** Mostrar en el mapa un evento con "7 personas reportaron esto".

**Capa 2 – Texto.** Google Gemini analiza la descripción: revisa si tiene sentido, si corresponde al tipo elegido y qué tan grave es en una escala de 1 a 5.

**Capa 3 – Imagen.** Si hay foto, Gemini revisa si la imagen corresponde a la emergencia reportada.

**Capa 4 – Reglas.** Con esta información se calcula un nivel de confianza de 0 a 100 y una prioridad: Alta, Media o Baja.

Si la confianza es baja, el reporte no se publica en el mapa: queda en una cola de revisión para el administrador.

**[Pantalla]** En el celular, reportar un incendio con la descripción "jajaja prueba". Mostrar el mensaje "Tu reporte quedó en revisión".

Si el servicio de inteligencia artificial no responde, la plataforma usa reglas de respaldo basadas en palabras clave, así que nunca deja de funcionar.

### 3. Tiempo real

**[Pantalla]** Mostrar el celular junto al computador.

La plataforma funciona en tiempo real. Cuando alguien publica o actualiza una emergencia, el servidor avisa a todos los que tienen el mapa abierto mediante WebSockets. La emergencia aparece en menos de 5 segundos, sin recargar la página.

---

## Persona 3 – Ruta segura, cuenta de ciudadano, accesibilidad e instalación (4 min)

### 1. Ruta segura

**[Pantalla]** En el mapa, clic en "Ruta segura".

Ruta segura calcula un camino hasta un destino evitando las emergencias reportadas en la plataforma.

**[Pantalla]** En "¿A dónde vas?" escribir "Estadio El Campín" y elegir la primera sugerencia.

El destino se puede escribir como dirección o nombre de lugar; la plataforma muestra sugerencias mientras se escribe. También se puede elegir tocando el mapa.

La plataforma pide varias rutas posibles, descarta las que pasan por emergencias activas y muestra en verde la más rápida que las evita. Las rutas descartadas se ven en rojo punteado. El panel indica la distancia, el tiempo estimado y cuántos minutos agrega el desvío.

**[Pantalla]** Clic en "Abrir en Google Maps".

Con el botón "Abrir en Google Maps", el usuario continúa la navegación en la aplicación que ya conoce.

Es importante aclarar que es una recomendación: evita las emergencias reportadas en MiReporte, pero no tiene en cuenta el tráfico en tiempo real ni los incidentes que nadie haya reportado.

### 2. Cuenta de ciudadano

**[Pantalla]** Clic en "Ingresar" y mostrar el formulario de registro.

Registrarse es opcional. El ciudadano registrado tiene la sección "Mis reportes", donde ve el historial de sus reportes y su estado: publicado, en atención, resuelto o en revisión.

Para registrarse se pide nombre, correo y contraseña, y se debe aceptar la política de privacidad.

### 3. Accesibilidad

**[Pantalla]** Abrir el menú de accesibilidad (ícono de persona, arriba a la derecha).

La plataforma sigue la Ley 1618 de accesibilidad. El menú permite:
- Aumentar o disminuir el tamaño de la letra.
- Activar el modo de alto contraste.
- Escuchar las alertas en voz alta.

**[Pantalla]** Activar el alto contraste y luego desactivarlo.

Además, todos los botones son grandes para facilitar su uso en el celular, y la página se puede recorrer con el teclado.

### 4. Instalación como aplicación y código QR

**[Pantalla]** Clic en "Compartir".

MiReporte se puede instalar en el celular como una aplicación, sin pasar por ninguna tienda. En Android se instala desde el menú de Chrome, y en iPhone desde el botón Compartir de Safari, con la opción "Agregar a inicio".

En esta sección está el código QR que lleva directamente a la plataforma.

---

## Persona 4 – Entidades oficiales, administración, seguridad y tecnología (4 min)

### 1. Panel de entidad oficial

**[Pantalla]** Cambiar a la pestaña con la sesión de Bomberos y abrir "Panel oficial".

Las entidades autorizadas —Bomberos, Tránsito, Cruz Roja, Defensa Civil y Alcaldía— tienen un panel propio. Sus cuentas solo las puede crear el administrador.

En la pestaña "Gestionar eventos" ven las emergencias activas ordenadas por prioridad. Por cada una pueden:
- Confirmarla, lo que le agrega el sello "Verificado".
- Cambiar su estado a "En atención" o "Resuelta".
- Escribir el desvío recomendado para los ciudadanos.

**[Pantalla]** Buscar el accidente que reportó la Persona 2. Clic en "Confirmar", luego en "En atención", escribir un desvío y guardar.

Estos cambios se ven al instante en el mapa de todos los usuarios.

**[Pantalla]** Abrir la pestaña "Publicar reporte oficial".

Las entidades también pueden publicar reportes oficiales directamente. Estos salen verificados y tienen prioridad sobre los reportes ciudadanos: si ya había reportes ciudadanos del mismo hecho, el evento pasa a ser oficial.

### 2. Panel de administrador

**[Pantalla]** Cambiar a la pestaña con la sesión de administrador y abrir "Administración".

El administrador tiene cuatro secciones:
- **Revisión:** los reportes que la inteligencia artificial marcó como dudosos. Para cada uno se muestra el análisis y la razón. El administrador decide si lo aprueba o lo rechaza.
- **Eventos:** lista de todos los eventos, con opción de eliminar uno o eliminar los antiguos.
- **Usuarios:** creación de cuentas para las entidades, cambio de roles y desactivación de cuentas.
- **Estadísticas:** reportes por tipo y por día.

**[Pantalla]** En "Revisión", rechazar el reporte "jajaja prueba" de la Persona 2. Luego abrir "Estadísticas".

Además, las emergencias que pasan varias horas sin actividad se cierran automáticamente.

### 3. Seguridad y privacidad

La plataforma cumple la Ley 1581 de protección de datos personales:
- Nunca se muestra públicamente quién hizo un reporte.
- Las contraseñas se guardan cifradas con bcrypt.
- Las sesiones usan tokens JWT que vencen.
- Cada rol solo puede hacer lo que le corresponde: ciudadano, entidad oficial o administrador.
- Hay límites contra el envío masivo de reportes y una política de privacidad y términos de uso.

### 4. Tecnología

La plataforma está construida con:
- **Frontend:** React con Vite, publicado en Vercel.
- **Mapa:** MapLibre con OpenStreetMap; rutas con OSRM y búsqueda de lugares con Photon.
- **Backend:** Node.js con Express, publicado en Railway.
- **Base de datos:** PostgreSQL con PostGIS, que permite buscar emergencias por distancia.
- **Tiempo real:** WebSockets con Socket.IO.
- **Inteligencia artificial:** Google Gemini.

### 5. Cierre

En resumen, MiReporte permite reportar una emergencia en segundos, filtra los reportes falsos y repetidos con inteligencia artificial, muestra la información en tiempo real en un mapa, ofrece rutas que evitan las zonas afectadas y conecta a los ciudadanos con las entidades oficiales.

La plataforma está disponible en https://mi-reporte.vercel.app. Muchas gracias.

---

## Si algo falla durante la presentación

| Situación | Qué hacer |
|---|---|
| El mapa no carga datos | Abrir /api/salud en otra pestaña, esperar 30 segundos y recargar. |
| No aparece el aviso de zona de riesgo | Continuar; solo aparece si el usuario está cerca de una zona de riesgo. |
| El reporte no llega al celular | Recargar la página del celular. |
| Ruta segura no calcula | Esperar unos segundos y repetir; si sigue fallando, mostrar el desvío escrito por la entidad. |
| Se cierra una sesión | Volver a iniciarla sin mostrar la contraseña en pantalla. |
