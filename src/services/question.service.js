import Question from "../models/question.model.js";
import { logger } from "../utils/logger.js";


export const createQuestion = async (text, order) => {
  try {
    const question = new Question({ text, order });
    await question.save();
    return question;
  } catch (error) {
    logger.error(`Error creating question: ${error.message}`);
    throw new Error("Failed to create question");
  }
};

export const getAllQuestions = async () => {
  try {
    return await Question.find().sort("order").lean();
  } catch (error) {
    logger.error(`Error fetching questions: ${error.message}`);
    throw new Error("Failed to fetch questions");
  }
};

export const getQuestionById = async (id) => {
  try {
    return await Question.findById(id).lean();
  } catch (error) {
    logger.error(`Error fetching question by ID: ${error.message}`);
    throw new Error("Question not found");
  }
};

export const updateQuestion = async (id, text, order) => {
  try {
    return await Question.findByIdAndUpdate(
      id,
      { text, order },
      { new: true, runValidators: true }
    ).lean();
  } catch (error) {
    logger.error(`Error updating question: ${error.message}`);
    throw new Error("Failed to update question");
  }
};

export const deleteQuestion = async (id) => {
  try {
    return await Question.findByIdAndDelete(id).lean();
  } catch (error) {
    logger.error(`Error deleting question: ${error.message}`);
    throw new Error("Failed to delete question");
  }
};