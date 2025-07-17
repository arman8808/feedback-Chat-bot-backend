import http from "http";
import { connectDB } from "./config/db.js";
import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import createSocketService from "./socket/index.js";


const server = http.createServer(app);
const io = createSocketService(server);
app.set('io', io);
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
        syscall: error.syscall,
      });
      process.exit(1);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
  }
};

startServer();
