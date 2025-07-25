import * as dotenv from "dotenv";
dotenv.config();

const parseAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS;
  return origins
    ? origins.split(",").map((o) => o.trim())
    : [
        "http://localhost:5173",
        "https://feedback-chat-bot-frontend.vercel.app",
      ];
};

export const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  Frontend_Url: process.env.Frontend_Url || "http://localhost:5173",
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/feedback-chatbot",
  ALLOWED_ORIGINS: parseAllowedOrigins(),
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  JWT_SECRET: process.env.JWT_SECRET || "1d",
};

// Validation
if (!env.MONGODB_URI) throw new Error("MONGODB_URI is required");
if (isNaN(env.PORT)) throw new Error("PORT must be a number");
