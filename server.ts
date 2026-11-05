import http from 'http';
import path from 'path';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { RoomManager } from './server/RoomManager';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Initialize Socket.io with permissive CORS for development iframe & cross-origin previews
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 30000,
  pingInterval: 10000
});

const roomManager = new RoomManager(io);
roomManager.initialize();

app.use(express.json());

// API route to get public rooms list
app.get('/api/rooms', (req, res) => {
  res.json({
    rooms: roomManager.getPublicRooms()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function setupServer() {
  if (!isProduction) {
    // Development mode: attach Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built client assets
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`> Skribbl.io Server ready on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
