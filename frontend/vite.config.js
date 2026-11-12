import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de Vite: usa el plugin de React y abre el navegador al iniciar
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
});
