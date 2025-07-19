import mongoose from "mongoose";
import Question from "../models/question.model.js";
import Feedback from "../models/feedback.model.js";
import Issue from "../models/issue.model.js";
import { registerSocketHandlers } from "./socketHandlers.js";

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export default function chatHandler(io, socket) {
  registerSocketHandlers(io, socket);

  const session = {
    id: new mongoose.Types.ObjectId(),
    currentIndex: -1,
    questions: [],
    responses: [],
    timer: null,
    isActive: false,
    lastActivity: null,
  };

  const cleanupSession = () => {
    clearTimeout(session.timer);
    session.id = new mongoose.Types.ObjectId(); 
    session.currentIndex = -1;
    session.questions = [];
    session.responses = [];
    session.isActive = false;
    session.lastActivity = null;
    console.log(`Session cleaned for ${socket.id}`);
  };

  const startSessionTimer = () => {
    clearTimeout(session.timer);
    session.timer = setTimeout(() => {
      if (session.isActive) {
        socket.emit("session-timeout", {
          message: "Session timed out due to inactivity"
        });
        cleanupSession();
      }
    }, SESSION_TIMEOUT);
    session.lastActivity = new Date();
  };

  const resetSessionTimer = () => {
    clearTimeout(session.timer);
    startSessionTimer();
  };

  const emitQuestion = () => {
    const question = session.questions[session.currentIndex];
    const questionData = {
      _id: question._id,
      text: question.text,
      index: session.currentIndex + 1,
      total: session.questions.length,
    };

    if (session.currentIndex === 0) {
      socket.emit("first-question", questionData);
    } else {
      socket.emit("next-question", questionData);
    }

    resetSessionTimer();
  };

  const nextQuestion = async () => {
    session.currentIndex++;

    if (session.currentIndex < session.questions.length) {
      emitQuestion();
    } else {
      await endSession();
    }
  };

  const endSession = async () => {
    try {
      // Ensure all responses have sessionId
      const responsesToSave = session.responses.map((response) => ({
        ...response,
        sessionId: session.id,
      }));

      if (responsesToSave.length > 0) {
        await Feedback.insertMany(responsesToSave);
      }
      
      // Prepare the user report
      const report = {
        sessionId: session.id,
        totalQuestions: session.questions.length,
        answeredQuestions: responsesToSave.length,
        ratings: responsesToSave.map(r => ({
          questionId: r.question,
          rating: r.rating,
          feedback: r.feedback
        })),
        overallExperience: null
      };

      socket.emit("session-summary", report);
      socket.emit("request-experience-rating");
      
    } catch (error) {
      console.error("Session save error:", error);
      socket.emit("error", {
        code: "SESSION_SAVE_FAILED",
        message: "Failed to save session data",
      });
    }
  };

  // Socket event handlers
  socket.on("start-session", async () => {
    try {
      if (session.isActive) {
        throw new Error("SESSION_ALREADY_ACTIVE");
      }

      session.questions = await Question.find().sort("order").lean();

      if (session.questions.length === 0) {
        throw new Error("NO_QUESTIONS");
      }

      session.currentIndex = 0;
      session.responses = [];
      session.isActive = true;

      startSessionTimer();
      emitQuestion();
    } catch (error) {
      console.error("Session start error:", error);
      socket.emit("error", {
        code: error.message || "SESSION_START_FAILED",
        message: "Failed to start chat session",
      });
    }
  });

  socket.on("submit-response", async ({ questionId, rating, feedback }) => {
    try {
      if (!session.isActive) {
        throw new Error("SESSION_NOT_ACTIVE");
      }

      resetSessionTimer();

      const currentQuestion = session.questions[session.currentIndex];
      if (!currentQuestion || currentQuestion._id.toString() !== questionId) {
        throw new Error("INVALID_QUESTION");
      }

      if (rating) {
        session.responses.push({
          question: questionId,
          rating,
          feedback: feedback || null,
          user: socket.userId,
          sessionId: session.id,
          timestamp: new Date(),
        });

        if (rating <= 2) {
          socket.emit("request-feedback");
          return;
        } else if (rating >= 4) {
          socket.emit("appreciation");
        }
      }

      nextQuestion();
    } catch (error) {
      console.error("Response error:", error);
      socket.emit("error", {
        code: error.message || "RESPONSE_ERROR",
        message: "Failed to process response",
      });
    }
  });

  socket.on("submit-experience-rating", async ({ rating, feedback }) => {
    try {
      if (!session.isActive) {
        throw new Error("SESSION_NOT_ACTIVE");
      }

      // Save the experience rating
      await Feedback.create({
        question: null, // Not linked to any specific question
        rating,
        feedback: feedback || null,
        user: socket.userId,
        sessionId: session.id,
        timestamp: new Date(),
        isExperienceRating: true
      });

      // Send thank you message
      socket.emit("thank-you", {
        message: "Thank you for your feedback! Your session is now complete.",
        sessionId: session.id
      });

      // Give time for the message to be delivered before cleanup
      setTimeout(() => {
        cleanupSession();
        socket.emit("session-ended", {
          message: "You can start a new chat session whenever you're ready."
        });
      }, 1500);

    } catch (error) {
      console.error("Experience rating error:", error);
      socket.emit("error", {
        code: "EXPERIENCE_RATING_FAILED",
        message: "Failed to save experience rating",
      });
    }
  });

  socket.on("disconnect", () => {
    if (session.isActive) {
      socket.emit("session-interrupted", {
        message: "Your session was interrupted. You can reconnect to continue."
      });
    }
    cleanupSession();
  });
}