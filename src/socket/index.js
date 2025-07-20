import { Server } from "socket.io";
import connectionManager from "./connectionManager.js";
import chatHandler from "./chatHandler.js";
import { socketAuthMiddleware } from "../middleware/socketAuth.js";

export default function createSocketService(server) {
  const io = new Server(server, {
    cors: {
      origin: 'https://feedback-chat-bot-frontend.vercel.app',
      methods: ["GET", "POST"],
      credentials: true,
    },

    transports: ["polling"],
    connectionStateRecovery: false,
    pingTimeout: 30000,
    pingInterval: 10000,
    allowEIO3: true,
    serveClient: false,
  });

  io.use(socketAuthMiddleware);

  io.use((socket, next) => {
    connectionManager(io, socket, next);
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

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
      clearInterval(heartbeatInterval);

      if (socket.connected) {
        socket.emit("connection-status", {
          status: "disconnected",
          reason,
          timestamp: new Date().toISOString(),
        });
      }

      if (reason !== "client namespace disconnect") {
        setTimeout(() => {
          if (!socket.connected) {
            socket.connect();
          }
        }, 2000 + Math.random() * 3000);
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
