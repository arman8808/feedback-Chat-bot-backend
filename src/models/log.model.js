import { Schema, model, Document } from "mongoose";



const logSchema = new Schema({
  level: {
    type: String,
    required: true,
    enum: ["ERROR", "WARN", "INFO", "DEBUG", "HTTP"],
  },
  message: { type: String, required: true },
  meta: {
    sessionId: String,
    userId: String,
    route: String,
    errorStack: String,
  },
  timestamp: { type: Date, default: Date.now },
});

// Indexes for faster querying
logSchema.index({ level: 1 });
logSchema.index({ timestamp: -1 });
logSchema.index({ "meta.sessionId": 1 });

export default model("Log", logSchema);
