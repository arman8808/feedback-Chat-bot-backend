import http from 'http';
import { connectDB } from './config/db.js';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import mongoose from 'mongoose';

const server = http.createServer(app);

const startServer = async () => {
  try {
    await connectDB();

    server.listen(env.PORT, () => {
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      logger.info(`Allowed origins: ${env.ALLOWED_ORIGINS.join(", ")}`);
    });

    server.on("error", (error) => {
      logger.error(`Server error: ${error.message}`, {
        code: error.code,
        syscall: error.syscall
      });
      process.exit(1);
    });

    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      gracefulShutdown();
    });
    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection:", reason);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

const gracefulShutdown = () => {
  logger.info("Shutting down server gracefully...");

  server.close(async () => {
    logger.info("HTTP server closed");

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed");
    }

    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forcing shutdown after timeout");
    process.exit(1);
  }, 10000);
};

startServer();