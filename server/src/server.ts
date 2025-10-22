import http from 'http';
import { connectDatabase } from './config/db';
import { config } from './config/env';
import { createApp } from './app';
import { initWebsocket } from './services/websocketService';

/**
 * Application entry point: connects dependencies, boots Express, and wires Socket.IO.
 */
const bootstrap = async () => {
  await connectDatabase();
  const app = createApp();
  const server = http.createServer(app);
  initWebsocket(server);

  server.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
};

bootstrap().catch(error => {
  console.error('Failed to start server', error);
  process.exit(1);
});
