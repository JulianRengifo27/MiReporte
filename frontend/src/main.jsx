import React from 'react';
import ReactDOM from 'react-dom/client';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles/app.css';
import './styles/paginas.css';
import App from './App.jsx';
import { ProveedorSesion } from './sesion.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ProveedorSesion>
      <App />
    </ProveedorSesion>
  </React.StrictMode>
);
