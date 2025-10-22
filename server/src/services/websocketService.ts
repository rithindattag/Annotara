import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { config } from '../config/env';

let io: Server;

/**
 * Creates a Socket.IO server instance on top of the HTTP server.
 */
export const initWebsocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: config.clientUrl,
      credentials: true
    }
  });
  io.on('connection', socket => {
    console.log('WebSocket client connected', socket.id);
  });
  return io;
};

/**
 * Broadcasts a task update to all connected clients if the socket server is ready.
 */
export const emitTaskUpdate = (task: unknown) => {
  if (!io) {
    console.warn('WebSocket server not initialised; skipping broadcast');
    return;
  }
  io.emit('task:update', task);
};
