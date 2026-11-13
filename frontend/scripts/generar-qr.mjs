// Genera el código QR de la página para imprimirlo o ponerlo en la presentación.
// Uso:  npm run qr -- https://tu-app.vercel.app
// Crea: frontend/qr-mireporte.png (1024 px) y frontend/qr-mireporte.svg
import QRCode from 'qrcode';

const url = process.argv[2];
if (!url || !/^https?:\/\//.test(url)) {
  console.error('❌ Escribe la dirección de la página. Ejemplo:  npm run qr -- https://mireporte.vercel.app');
  process.exit(1);
}

const opciones = { errorCorrectionLevel: 'H', margin: 2, color: { dark: '#8f2626', light: '#ffffff' } };
await QRCode.toFile('qr-mireporte.png', url, { ...opciones, width: 1024 });
await QRCode.toFile('qr-mireporte.svg', url, { ...opciones, type: 'svg' });
console.log(`✅ QR generado para ${url}`);
console.log('   Archivos: frontend/qr-mireporte.png y frontend/qr-mireporte.svg');
