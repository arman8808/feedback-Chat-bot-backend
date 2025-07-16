import express from 'express'
import cors from 'cors'
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";

import { httpLogger, logger } from "./utils/logger.js";
import questionRoutes from "./routes/question.routes.js";
import { env } from "./config/env.js";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        // connectSrc: ["'self'", env.ALLOWED_ORIGINS],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: env.ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(mongoSanitize());
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(httpLogger);
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.path}`);
  next();
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date(),
    environment: env.NODE_ENV,
  });
});

app.use("/api/questions", questionRoutes);

export default app;
