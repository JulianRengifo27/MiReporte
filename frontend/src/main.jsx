import React from 'react';
import ReactDOM from 'react-dom/client';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles/app.css';
import './styles/paginas.css';
import App from './App.jsx';
import { ProveedorSesion } from './sesion.jsx';

// PWA: registrar el service worker (solo en la versión publicada, no en desarrollo)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('Service worker no registrado:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ProveedorSesion>
      <App />
    </ProveedorSesion>
  </React.StrictMode>
);
