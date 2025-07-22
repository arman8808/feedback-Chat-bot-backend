import { Server } from "socket.io";
import connectionManager from "./connectionManager.js";
import chatHandler from "./chatHandler.js";
import { socketAuthMiddleware } from "../middleware/socketAuth.js";
import { env } from "../config/env.js";

export default function createSocketService(server) {
  const io = new Server(server, {
    cors: {
      origin: env.Frontend_Url || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["polling", "websocket"],
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true,
    serveClient: false,
  });

  io.use(socketAuthMiddleware);

  io.use((socket, next) => {
    connectionManager(io, socket, next);
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user?._id})`);

    socket.emit("connection-status", {
      status: "connected",
      timestamp: new Date().toISOString(),
      transport: socket.conn.transport.name,
    });

    socket.conn.on("upgrade", (transport) => {
      console.log(`Transport upgraded to: ${transport.name}`);
    });

    socket.conn.on("error", (err) => {
      console.error(`Transport error: ${err.message}`);
    });

    chatHandler(io, socket);

    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        try {
          socket.emit("heartbeat-ping", { timestamp: Date.now() });

          const heartbeatTimeout = setTimeout(() => {
            if (socket.connected) {
              console.log(`Heartbeat timeout for socket ${socket.id}`);
              socket.disconnect(true);
            }
          }, 5000);

          socket.once("heartbeat-pong", () => {
            clearTimeout(heartbeatTimeout);
          });
        } catch (err) {
          console.error("Heartbeat error:", err);
        }
      }
    }, 10000);

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected (${reason}): ${socket.id}`);
      if (socket.connected) {
        socket.emit("connection-status", {
          status: "disconnected",
          reason,
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on("error", (error) => {
      console.error(`Socket error: ${error.message}`);
      socket.emit("connection-status", {
        status: "error",
        code: "SOCKET_ERROR",
        message: error.message || "Connection error",
      });
    });
  });

  io.on("error", (error) => {
    console.error("Socket.IO server error:", error);
  });

  return io;
}
