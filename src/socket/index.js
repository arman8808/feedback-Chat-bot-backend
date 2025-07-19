import { Server } from 'socket.io';
import connectionManager from './connectionManager.js';
import chatHandler from './chatHandler.js';
import { socketAuthMiddleware, } from '../middleware/socketAuth.js';

export default function createSocketService(server) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ["GET", "POST"],
      credentials: true
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
  });

  // Authentication middleware
  io.use(socketAuthMiddleware);

  // Connection management
  io.use((socket, next) => {
    connectionManager(io, socket, next);
  });

  // Main connection handler
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Initialize connection status
    socket.emit('connection-status', {
      status: 'connected',
      timestamp: new Date().toISOString()
    });
    
    // Attach chat handlers
    chatHandler(io, socket);
    
    // Heartbeat monitoring
    let heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat', { timestamp: Date.now() });
      }
    }, 15000);
    
    // Handle disconnections
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected (${reason}): ${socket.id}`);
      clearInterval(heartbeatInterval);
      socket.emit('connection-status', {
        status: 'disconnected',
        reason,
        timestamp: new Date().toISOString()
      });
    });
    
    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error: ${error.message}`);
      socket.emit('connection-status', {
        status: 'error',
        code: 'SOCKET_ERROR',
        message: 'Connection error'
      });
    });
  });

  // Global error handling
  io.on('error', (error) => {
    console.error('Socket.IO server error:', error);
  });

  return io;
}