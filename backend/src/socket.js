// Tiempo real con Socket.IO: el servidor avisa a todos los navegadores conectados
// cuando aparece o cambia una emergencia (así se cumple el "máximo 5 segundos").
import { Server } from 'socket.io';
import { config } from './config.js';

let io = null;

export function iniciarSocket(servidorHttp) {
  io = new Server(servidorHttp, { cors: { origin: config.frontends } });
  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado (${io.engine.clientsCount} en total)`);
    socket.on('disconnect', () => console.log('🔌 Cliente desconectado'));
  });
  return io;
}

// Eventos que se emiten: 'nuevo_evento' y 'evento_actualizado'
export function emitir(nombre, datos) {
  io?.emit(nombre, datos);
}
