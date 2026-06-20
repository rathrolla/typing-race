import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { registerGameHandlers } from './game/GameEngine.js';
import { getLocalIp } from './network.js';

const PORT = Number(process.env.PORT) || 3002;
const HOST = '0.0.0.0';

const app = express();
app.use(cors());
app.get('/health', (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  registerGameHandlers(io, socket);
});

httpServer.listen(PORT, HOST, () => {
  const lanIp = getLocalIp();
  console.log(`Typing Race server running on http://localhost:${PORT}`);
  if (lanIp !== '127.0.0.1') {
    console.log(`LAN access:              http://${lanIp}:${PORT}`);
  }
});
