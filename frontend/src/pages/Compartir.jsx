// ===== Compartir: código QR que lleva a la página =====
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { APP_NAME } from '../config.js';

export default function Compartir() {
  // La dirección de la página donde está publicada (sirve igual en local que en Vercel)
  const url = `${window.location.origin}/`;
  const [imagen, setImagen] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, { errorCorrectionLevel: 'H', margin: 2, width: 640, color: { dark: '#8f2626', light: '#ffffff' } })
      .then(setImagen)
      .catch(() => setImagen(''));
  }, [url]);

  async function copiar() {
    try { await navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* sin permiso */ }
  }

  return (
    <div className="pagina pagina-angosta compartir">
      <h2>Comparte {APP_NAME}</h2>
      <p>Escanea el código con la cámara del celular para abrir la plataforma. No necesitas descargar nada.</p>
      {imagen && <img className="qr" src={imagen} alt={`Código QR que abre ${url}`} width="320" height="320" />}
      <p className="url-compartir">{url}</p>
      <div className="acciones acciones-centradas">
        <button type="button" className="boton boton-secundario" onClick={copiar}>{copiado ? '✅ Copiado' : '📋 Copiar enlace'}</button>
        {imagen && <a className="boton boton-primario" href={imagen} download="qr-mireporte.png">⬇ Descargar QR</a>}
      </div>
      <h3>📲 Instálala como app</h3>
      <ul className="pasos">
        <li><strong>Android (Chrome):</strong> menú ⋮ → <em>Instalar aplicación</em> o <em>Agregar a pantalla principal</em>.</li>
        <li><strong>iPhone (Safari):</strong> botón Compartir ⬆ → <em>Agregar a inicio</em>.</li>
      </ul>
    </div>
  );
}
