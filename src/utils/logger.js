import { env } from "../config/env.js";
import Log from "../models/log.model.js";


// Log severity levels
const LogLevel = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
  HTTP: "HTTP",
};


const logQueue = [];
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 5000;


const flushLogs = async () => {
  if (logQueue.length === 0) return;

  try {
    const logsToInsert = [...logQueue];
    logQueue.length = 0; 
    
    await Log.insertMany(logsToInsert);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to flush logs: ${error.message}`);
    } else {
      console.error(`Failed to flush logs: ${String(error)}`);
    }
  }
};

setInterval(flushLogs, FLUSH_INTERVAL).unref();

const log = (level, message, meta) => {
  const timestamp = new Date();
  const logEntry = { level, message, meta, timestamp };

  logQueue.push(logEntry);
  

  if (logQueue.length >= BATCH_SIZE) {
    flushLogs();
  }
  
 
  if (env.NODE_ENV === "development") {
    const logMessage = `[${timestamp.toISOString()}] [${level}] ${message}`;
    console.log(logMessage);
    if (meta?.errorStack) console.log(meta.errorStack);
  }
};

// Public logger API
export const logger = {
  error: (message, meta) => log(LogLevel.ERROR, message, meta),
  warn: (message, meta) => log(LogLevel.WARN, message, meta),
  info: (message, meta) => log(LogLevel.INFO, message, meta),
  debug: (message, meta) => log(LogLevel.DEBUG, message, meta),
  http: (message, meta) => log(LogLevel.HTTP, message, meta),
  

  captureError: (error, meta) => {
    log(LogLevel.ERROR, error.message, {
      ...meta,
      errorStack: error.stack
    });
  }
};

// HTTP request logger middleware
export const httpLogger = (req, res, next) => {
  const startTime = process.hrtime();
  
  res.on("finish", () => {
    const duration = process.hrtime(startTime);
    const durationMs = Math.round(duration[0] * 1000 + duration[1] / 1e6);
    
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      route: req.originalUrl,
      method: req.method,
      status: res.statusCode,
      duration: durationMs,
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    });
  });
  
  next();
};

// Graceful shutdown handler
process.on("SIGINT", async () => {
  await flushLogs();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await flushLogs();
  process.exit(0);
});