
import {
  startSessionForUser,
  submitResponse,
} from "../services/chatService.js";
import { reportIssue } from "../services/issueService.js";

export const registerSocketHandlers = (io, socket) => {
  const userId = socket.userId;

  // Notify client it’s connected
  socket.emit("status", "Connected");

  // Prevent multiple sessions per user
  io.fetchSockets().then((sockets) => {
    const duplicate = sockets.find(
      (s) => s.userId === userId && s.id !== socket.id
    );
    if (duplicate) {
      socket.emit("status", "Duplicate session detected");
      return socket.disconnect(true);
    }
  });

  // Start chat session
  socket.on("start-session", async () => {
    try {
      const firstQ = await startSessionForUser(userId, socket.id);
      socket.emit("first-question", firstQ);
    } catch (err) {
      socket.emit("status", `Error: ${err.message}`);
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
