// ===== Política de privacidad y Términos (Ley 1581 de 2012) =====
// Texto base para un proyecto universitario: revísenlo con su docente antes de usarlo con datos reales.
import { APP_NAME } from '../config.js';

const Aviso123 = () => (
  <p className="aviso-destacado" role="note">
    ⚠️ <strong>Esta plataforma no reemplaza la línea 123. En una emergencia, llama al <a href="tel:123">123</a>.</strong>
  </p>
);

export function Privacidad() {
  return (
    <div className="pagina pagina-texto">
      <h2>Política de privacidad y tratamiento de datos</h2>
      <Aviso123 />
      <p>En {APP_NAME} cumplimos la <strong>Ley 1581 de 2012</strong> y el Decreto 1377 de 2013 sobre protección de datos personales en Colombia.</p>

      <h3>1. ¿Qué datos recogemos?</h3>
      <ul>
        <li><strong>Si reportas sin cuenta:</strong> el tipo de emergencia, la ubicación del pin, la descripción y la foto (si la envías). No pedimos tu nombre ni tu teléfono.</li>
        <li><strong>Si creas una cuenta:</strong> nombre, correo y contraseña. La contraseña se guarda <strong>cifrada</strong> (bcrypt): nadie, ni los administradores, puede leerla.</li>
        <li>Datos técnicos mínimos (dirección IP) para evitar spam. No se guardan junto a tus reportes.</li>
      </ul>

      <h3>2. ¿Para qué los usamos?</h3>
      <ul>
        <li>Mostrar emergencias en el mapa e informar a la ciudadanía y a las entidades.</li>
        <li>Detectar reportes duplicados o falsos (análisis automático con inteligencia artificial).</li>
        <li>Mostrarte el historial de tus propios reportes si tienes cuenta.</li>
      </ul>

      <h3>3. ¿Quién ve qué?</h3>
      <ul>
        <li><strong>Nunca mostramos públicamente quién hizo un reporte.</strong> El mapa solo muestra la emergencia.</li>
        <li>Si envías una foto, esta puede verse en el mapa. <strong>Evita fotografiar rostros o placas</strong> de vehículos.</li>
        <li>La descripción y la foto se envían a Google Gemini para su análisis automático; no se envían datos de tu cuenta.</li>
        <li>No vendemos ni compartimos tus datos con terceros para publicidad.</li>
      </ul>

      <h3>4. Tus derechos</h3>
      <p>Puedes conocer, actualizar, rectificar y pedir la eliminación de tus datos, y revocar tu autorización, escribiendo al equipo del proyecto. Responderemos en los plazos de la ley (10 días hábiles para consultas y 15 para reclamos).</p>

      <h3>5. Responsables</h3>
      <p>Proyecto universitario desarrollado por Julian Rengifo Forero, José Giraldo Sarmiento, Johan Wilches Olarte, Valerie Rincón Zuluaga y Daniel Galindo Madero.</p>
    </div>
  );
}

export function Terminos() {
  return (
    <div className="pagina pagina-texto">
      <h2>Términos de uso</h2>
      <Aviso123 />
      <ol>
        <li>{APP_NAME} es una herramienta <strong>informativa y gratuita</strong>. No es un servicio oficial de atención de emergencias.</li>
        <li>Los reportes ciudadanos pueden no estar verificados. Los reportes con el sello <strong>“✔ Verificado”</strong> provienen de entidades oficiales.</li>
        <li>Está prohibido enviar reportes falsos, bromas, insultos, publicidad o contenido que vulnere la intimidad de otras personas. Estos reportes se eliminan y pueden bloquearse.</li>
        <li>Las rutas alternativas son recomendaciones. Sigue siempre las indicaciones de las autoridades de tránsito.</li>
        <li>Los reportes sin actividad se cierran automáticamente después de varias horas.</li>
        <li>Al usar la plataforma aceptas la <a href="#/privacidad">Política de privacidad</a>.</li>
      </ol>
    </div>
  );
}
