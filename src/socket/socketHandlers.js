
import User from "../models/user.model.js";
import {
  startSessionForUser,
  submitResponse,
} from "../services/chat.service.js";
import { reportIssue } from "../services/issue.service.js";
import { logger } from "../utils/logger.js";

export const registerSocketHandlers = async (io, socket) => {
  const userId = socket.userId;

  try {
    await User.findByIdAndUpdate(userId, { socketId: socket.id });
  } catch (err) {
    logger.error(`Error updating user socket ID: ${err.message}`);
  }

  // Notify client it's connected
  socket.emit("status", { status: "connected", userId });

  // Prevent multiple sessions per user
  const sockets = await io.fetchSockets();
  const duplicate = sockets.find(
    (s) => s.userId === userId && s.id !== socket.id
  );

  if (duplicate) {
    socket.emit("status", {
      status: "duplicate",
      message: "Another session is active",
    });
    return socket.disconnect(true);
  }
  // Start chat session
  socket.on("start-session", async () => {
    try {
      console.log(`Starting session for user ${userId}`);

      logger.info(`Starting session for user ${userId}`);

      const firstQuestion = await startSessionForUser(userId, socket.id);

      if (!firstQuestion) {
        throw new Error("No questions available");
      }

      socket.emit("first-question", firstQuestion);
      logger.info(`Session started for user ${userId}`);
    } catch (err) {
      logger.error(`Session start error for user ${userId}: ${err.message}`);
      socket.emit("error", {
        message: "Failed to start session",
        details: err.message,
      });
    }
  });

  // Handle rating + optional feedback
  socket.on("submit-response", async ({ questionId, rating, feedback }) => {
    try {
      const nextQ = await submitResponse({
        userId,
        questionId,
        rating,
        feedback,
      });
      socket.emit("next-question", nextQ || null);
    } catch (err) {
      socket.emit("status", `Error: ${err.message}`);
    }
  });

  // Issue reporting via socket
  socket.on("report-issue", async (payload) => {
    try {
      await reportIssue({ userId, ...payload });
      socket.emit("issue-reported", { success: true });
    } catch (err) {
      socket.emit("status", `Error: ${err.message}`);
    }
  });

  // Handle manual client errors
  socket.on("error", (err) => {
    socket.emit("status", `Socket error: ${err.message}`);
  });

  // Disconnection
  socket.on("disconnect", (reason) => {
    // Note: you cannot emit to the disconnected socket, but you could broadcast
    socket.broadcast.emit("status", "Disconnected");
    // Optionally mark user inactive in DB here
  });
};
