import Feedback from "../models/feedback.model.js";
import Question from "../models/question.model.js";
import UserSession from "../models/userSession.model.js";
import { logger } from "../utils/logger.js";

export const submitFeedback = async ({
  userId,
  questionId,
  rating,
  feedback,
  sessionId,
  metadata = {},
}) => {
  try {
    // Validate question exists
    const questionExists = await Question.exists({ _id: questionId });
    if (!questionExists) {
      throw new Error("Question not found");
    }

    // Validate session exists
    const sessionExists = await UserSession.exists({
      _id: sessionId,
      user: userId,
    });
    if (!sessionExists) {
      throw new Error("Invalid session");
    }

    // Create feedback record
    const newFeedback = new Feedback({
      user: userId,
      question: questionId,
      rating,
      feedback,
      sessionId,
      metadata,
    });

    await newFeedback.save();

    // Populate references before returning
    const populatedFeedback = await Feedback.findById(newFeedback._id)
      .populate("user", "name email")
      .populate("question", "text order");

    return populatedFeedback;
  } catch (error) {
    logger.error(`Error submitting feedback: ${error.message}`);
    throw new Error(`Failed to submit feedback: ${error.message}`);
  }
};

export const getUserFeedback = async (userId, options = {}) => {
  try {
    const { limit = 20, skip = 0 } = options;

    return await Feedback.find({ user: userId })
      .populate("user", "name email")
      .populate("question", "text order")
      .sort({ respondedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  } catch (error) {
    logger.error(`Error fetching user feedback: ${error.message}`);
    throw new Error(`Failed to fetch user feedback: ${error.message}`);
  }
};


export const getQuestionFeedback = async (questionId, options = {}) => {
  try {
    const { limit = 20, skip = 0 } = options;

    return await Feedback.find({ question: questionId })
      .populate("user", "name email")
      .sort({ respondedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  } catch (error) {
    logger.error(`Error fetching question feedback: ${error.message}`);
    throw new Error(`Failed to fetch question feedback: ${error.message}`);
  }
};


export const getQuestionStats = async (questionId) => {
  try {
    const stats = await Feedback.aggregate([
      { $match: { question: mongoose.Types.ObjectId(questionId) } },
      {
        $group: {
          _id: null,
          totalResponses: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          minRating: { $min: "$rating" },
          maxRating: { $max: "$rating" },
          positive: {
            $sum: { $cond: [{ $gte: ["$rating", 4] }, 1, 0] },
          },
          neutral: {
            $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] },
          },
          negative: {
            $sum: { $cond: [{ $lte: ["$rating", 2] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalResponses: 1,
          averageRating: { $round: ["$averageRating", 2] },
          minRating: 1,
          maxRating: 1,
          positive: 1,
          neutral: 1,
          negative: 1,
        },
      },
    ]);

    return (
      stats[0] || {
        totalResponses: 0,
        averageRating: 0,
        minRating: 0,
        maxRating: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
      }
    );
  } catch (error) {
    logger.error(`Error fetching question stats: ${error.message}`);
    throw new Error(`Failed to fetch question stats: ${error.message}`);
  }
};


export const getSessionFeedback = async (sessionId) => {
  try {
    return await Feedback.find({ sessionId })
      .populate("user", "name email")
      .populate("question", "text order")
      .sort({ respondedAt: 1 })
      .lean();
  } catch (error) {
    logger.error(`Error fetching session feedback: ${error.message}`);
    throw new Error(`Failed to fetch session feedback: ${error.message}`);
  }
};


export const getGlobalStats = async () => {
  try {
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          totalResponses: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          minRating: { $min: "$rating" },
          maxRating: { $max: "$rating" },
          questionsAnswered: { $addToSet: "$question" },
          uniqueUsers: { $addToSet: "$user" },
        },
      },
      {
        $project: {
          _id: 0,
          totalResponses: 1,
          averageRating: { $round: ["$averageRating", 2] },
          minRating: 1,
          maxRating: 1,
          totalQuestions: { $size: "$questionsAnswered" },
          totalUsers: { $size: "$uniqueUsers" },
        },
      },
    ]);

    return (
      stats[0] || {
        totalResponses: 0,
        averageRating: 0,
        minRating: 0,
        maxRating: 0,
        totalQuestions: 0,
        totalUsers: 0,
      }
    );
  } catch (error) {
    logger.error(`Error fetching global stats: ${error.message}`);
    throw new Error(`Failed to fetch global stats: ${error.message}`);
  }
};

export const getFilteredFeedback = async (filters = {}, options = {}) => {
  try {
    const {
      limit = 20,
      skip = 0,
      sort = "respondedAt",
      sortOrder = -1,
    } = options;

    const query = {};

    if (filters.userId) query.user = filters.userId;
    if (filters.questionId) query.question = filters.questionId;
    if (filters.minRating || filters.maxRating) {
      query.rating = {};
      if (filters.minRating) query.rating.$gte = filters.minRating;
      if (filters.maxRating) query.rating.$lte = filters.maxRating;
    }
    if (filters.startDate || filters.endDate) {
      query.respondedAt = {};
      if (filters.startDate) query.respondedAt.$gte = filters.startDate;
      if (filters.endDate) query.respondedAt.$lte = filters.endDate;
    }

    return await Feedback.find(query)
      .populate("user", "name email")
      .populate("question", "text order")
      .sort({ [sort]: sortOrder })
      .limit(limit)
      .skip(skip)
      .lean();
  } catch (error) {
    logger.error(`Error fetching filtered feedback: ${error.message}`);
    throw new Error(`Failed to fetch filtered feedback: ${error.message}`);
  }
};
