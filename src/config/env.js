import * as dotenv from 'dotenv';
dotenv.config();

const parseAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS;
  return origins ? origins.split(',').map(o => o.trim()) : ['http://localhost:5173'];
};

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/feedback-chatbot',
  ALLOWED_ORIGINS: parseAllowedOrigins(),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// Validation
if (!env.MONGODB_URI) throw new Error('MONGODB_URI is required');
if (isNaN(env.PORT)) throw new Error('PORT must be a number');