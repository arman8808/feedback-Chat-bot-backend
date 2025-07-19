import mongoose from 'mongoose';
import Question from '../models/question.model.js';
import UserSession from '../models/user.model.js';
import Feedback from '../models/feedback.model.js';
import { logger } from '../utils/logger.js';


export const startSessionForUser = async (userId, socketId) => {
  try {
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Check for existing active session
    const existingSession = await UserSession.findOne({
      user: userId,
      status: 'active'
    });

    if (existingSession) {
      // Resume existing session - find last answered question
      const lastFeedback = await Feedback.findOne({ 
        user: userId,
        sessionId: existingSession._id 
      }).sort({ respondedAt: -1 });

      if (lastFeedback) {
        // Find the next question after the last answered one
        const lastQuestion = await Question.findById(lastFeedback.question);
        const allQuestions = await Question.find().sort('order');
        
        const currentIndex = allQuestions.findIndex(q => 
          q.order === lastQuestion.order
        );

        if (currentIndex < allQuestions.length - 1) {
          return allQuestions[currentIndex + 1];
        }
        
        // No more questions - end session
        await endSession(existingSession._id);
        return null;
      }
      
      // No responses yet - start from beginning
      return await getFirstQuestion();
    }

    // Create new session
    const newSession = new UserSession({
      user: userId,
      socketId,
      status: 'active',
      startedAt: new Date()
    });

    await newSession.save();

    // Get first question
    return await getFirstQuestion();

  } catch (error) {
    logger.error(`Error starting session: ${error.message}`);
    throw new Error('Failed to start chat session');
  }
};

/**
 * Submits a user response and returns the next question
 * @param {Object} params - Response parameters
 * @param {string} params.userId - The user ID
 * @param {string} params.questionId - The question ID being answered
 * @param {number|null} params.rating - The rating provided (1-5)
 * @param {string|null} params.feedback - Additional feedback text
 * @returns {Promise<Object|null>} The next question or null if complete
 */
export const submitResponse = async ({
  userId,
  questionId,
  rating,
  feedback
}) => {
  try {
    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new Error('Invalid question ID');
    }

    if (rating && (rating < 1 || rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Get current active session
    const activeSession = await UserSession.findOne({
      user: userId,
      status: 'active'
    });

    if (!activeSession) {
      throw new Error('No active session found');
    }

    // Save the feedback
    if (rating) {
      const feedbackRecord = new Feedback({
        user: userId,
        question: questionId,
        rating,
        feedback,
        sessionId: activeSession._id
      });

      await feedbackRecord.save();
    }

    // Get current question to determine position in flow
    const currentQuestion = await Question.findById(questionId);
    if (!currentQuestion) {
      throw new Error('Question not found');
    }

    // Get all questions in order
    const allQuestions = await Question.find().sort('order');
    const currentIndex = allQuestions.findIndex(q => 
      q._id.equals(questionId)
    );

    // If this was the last question, end session
    if (currentIndex === allQuestions.length - 1) {
      await endSession(activeSession._id);
      return null;
    }

    // Return the next question
    return allQuestions[currentIndex + 1];

  } catch (error) {
    logger.error(`Error submitting response: ${error.message}`);
    throw new Error('Failed to process response');
  }
};


const endSession = async (sessionId) => {
  try {
    await UserSession.findByIdAndUpdate(sessionId, {
      status: 'completed',
      completedAt: new Date()
    });
  } catch (error) {
    logger.error(`Error ending session: ${error.message}`);
    throw new Error('Failed to end session');
  }
};


const getFirstQuestion = async () => {
  try {
    // Get questions in order and return the first one
    const questions = await Question.find().sort('order');
    if (questions.length === 0) {
      throw new Error('No questions configured');
    }
    return questions[0];
  } catch (error) {
    logger.error(`Error getting first question: ${error.message}`);
    throw new Error('Failed to get first question');
  }
};

export const getActiveSession = async (userId) => {
  try {
    return await UserSession.findOne({
      user: userId,
      status: 'active'
    });
  } catch (error) {
    logger.error(`Error getting active session: ${error.message}`);
    throw new Error('Failed to get active session');
  }
};


export const getSessionFeedback = async (sessionId) => {
  try {
    return await Feedback.find({ sessionId })
      .populate('question')
      .sort({ respondedAt: 1 });
  } catch (error) {
    logger.error(`Error getting session feedback: ${error.message}`);
    throw new Error('Failed to get session feedback');
  }
};


export const getNextQuestion = async (questionId) => {
  try {
    const currentQuestion = await Question.findById(questionId);
    if (!currentQuestion) {
      throw new Error('Question not found');
    }

    const nextQuestion = await Question.findOne({
      order: currentQuestion.order + 1
    });

    return nextQuestion || null;
  } catch (error) {
    logger.error(`Error getting next question: ${error.message}`);
    throw new Error('Failed to get next question');
  }
};