import express from 'express'
import cors from 'cors'
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";

import { httpLogger, logger } from "./utils/logger.js";
import questionRoutes from "./routes/question.routes.js";
import userRoutes from "./routes/user.routes.js";
import issueRoutes from "./routes/issue.routes.js";
import { env } from "./config/env.js";
import cookieParser from 'cookie-parser';

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
        connectSrc: ["'self'", env.ALLOWED_ORIGINS],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  [];


const corsOptions = {
  origin: function (origin, callback) {

    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));


app.use(express.json({ limit: "10kb" }));
app.use(mongoSanitize());
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
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

app.use("/api/users", userRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/issues", issueRoutes);
app.get('/',(req,res)=>res.status(200).json({message:"Server is running"}))

export default app;
