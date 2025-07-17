import Question from '../models/question.model.js';
import Feedback from '../models/feedback.model.js';
import Issue from '../models/issue.model.js';

// Session timeout (5 minutes)
const SESSION_TIMEOUT = 5 * 60 * 1000;

export default (io, socket) => {
  // Initialize session
  const session = {
    currentIndex: -1,
    questions: [],
    responses: [],
    timer: null,
    isActive: false
  };

  // Cleanup session
  const cleanupSession = () => {
    clearTimeout(session.timer);
    session.currentIndex = -1;
    session.questions = [];
    session.responses = [];
    session.isActive = false;
    console.log(`Session cleaned for ${socket.id}`);
  };

  // Start session timeout
  const startSessionTimer = () => {
    clearTimeout(session.timer);
    session.timer = setTimeout(() => {
      if (session.isActive) {
        socket.emit('session-timeout');
        cleanupSession();
      }
    }, SESSION_TIMEOUT);
  };

  // Validate current question
  const validateCurrentQuestion = (questionId) => {
    if (!session.isActive) {
      throw new Error('SESSION_NOT_ACTIVE');
    }
    
    const currentQuestion = session.questions[session.currentIndex];
    
    if (!currentQuestion || currentQuestion._id.toString() !== questionId) {
      throw new Error('INVALID_QUESTION');
    }
  };

  // Emit current question
  const emitQuestion = () => {
    const question = session.questions[session.currentIndex];
    socket.emit('question', {
      index: session.currentIndex + 1,
      total: session.questions.length,
      text: question.text,
      id: question._id
    });
    startSessionTimer();
  };

  // Handle next question
  const nextQuestion = async () => {
    session.currentIndex++;
    
    if (session.currentIndex < session.questions.length) {
      emitQuestion();
    } else {
      await endSession();
    }
  };

  // End session
  const endSession = async () => {
    try {
      // Save all responses
      await Feedback.insertMany(session.responses);
      
      socket.emit('session-summary', {
        responses: session.responses.length
      });
      
      cleanupSession();
    } catch (error) {
      console.error('Session save error:', error);
      socket.emit('error', {
        code: 'SESSION_SAVE_FAILED',
        message: 'Failed to save session data'
      });
    }
  };

  // Event Handlers
  socket.on('start-chat', async () => {
    try {
      if (session.isActive) {
        throw new Error('SESSION_ALREADY_ACTIVE');
      }
      
      session.questions = await Question.find().sort('order').lean();
      
      if (session.questions.length === 0) {
        throw new Error('NO_QUESTIONS');
      }
      
      session.currentIndex = 0;
      session.responses = [];
      session.isActive = true;
      
      emitQuestion();
    } catch (error) {
      console.error('Session start error:', error);
      socket.emit('error', {
        code: error.message || 'SESSION_START_FAILED',
        message: 'Failed to start chat session'
      });
    }
  });

  socket.on('submit-rating', async ({ rating, questionId }) => {
    try {
      validateCurrentQuestion(questionId);
      
      // Validate rating
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        throw new Error('INVALID_RATING');
      }
      
      // Save response
      session.responses.push({
        question: questionId,
        rating,
        user: socket.user.id,
        timestamp: new Date()
      });
      
      // Handle feedback flow
      if (rating <= 2) {
        socket.emit('request-feedback');
      } else if (rating >= 4) {
        socket.emit('appreciation');
        nextQuestion();
      } else {
        nextQuestion();
      }
    } catch (error) {
      console.error('Rating error:', error);
      socket.emit('error', {
        code: error.message || 'RATING_ERROR',
        message: 'Failed to process rating'
      });
    }
  });

  socket.on('submit-feedback', async ({ feedback, questionId }) => {
    try {
      validateCurrentQuestion(questionId);
      
      // Find response
      const response = session.responses.find(
        r => r.question === questionId && r.user === socket.user.id
      );
      
      if (!response) {
        throw new Error('RESPONSE_NOT_FOUND');
      }
      
      // Update response
      response.feedback = feedback;
      
      nextQuestion();
    } catch (error) {
      console.error('Feedback error:', error);
      socket.emit('error', {
        code: error.message || 'FEEDBACK_ERROR',
        message: 'Failed to submit feedback'
      });
    }
  });

  socket.on('report-issue', async ({ message, questionId }) => {
    try {
      const issueData = {
        user: socket.user.id,
        message,
        type: 'CHAT_ISSUE'
      };
      
      if (questionId) {
        issueData.metadata = {
          questionId,
          currentIndex: session.currentIndex
        };
      }
      
      await Issue.create(issueData);
      socket.emit('issue-reported');
    } catch (error) {
      console.error('Issue report error:', error);
      socket.emit('error', {
        code: 'ISSUE_REPORT_FAILED',
        message: 'Failed to report issue'
      });
    }
  });

  // Handle session cleanup on disconnect
  socket.on('disconnect', cleanupSession);
};