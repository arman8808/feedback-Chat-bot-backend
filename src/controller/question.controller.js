
import * as questionService from "../services/question.service.js";
import { logger } from "../utils/logger.js";
import createHttpError from "http-errors";

export const createQuestion = async (req, res) => {
  try {
    const { text, order } = req.body;
    if (!text || !order) {
      throw createHttpError.BadRequest("Text and order are required");
    }
    
    const question = await questionService.createQuestion(text, Number(order));
    res.status(201).json(question);
  } catch (error) {
    logger.error(`Controller error - createQuestion: ${error.message}`);
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
};

export const getQuestions = async (req, res) => {
  try {
    const questions = await questionService.getAllQuestions();
    res.json(questions);
  } catch (error) {
    logger.error(`Controller error - getQuestions: ${error.message}`);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

export const getQuestion = async (req, res) => {
  try {
    const question = await questionService.getQuestionById(req.params.id);
    if (!question) {
      throw createHttpError.NotFound("Question not found");
    }
    res.json(question);
  } catch (error) {
    logger.error(`Controller error - getQuestion: ${error.message}`);
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const { text, order } = req.body;
    if (!text && !order) {
      throw createHttpError.BadRequest("At least one field to update is required");
    }
    
    const question = await questionService.updateQuestion(
      req.params.id,
      text,
      Number(order)
    );
    
    if (!question) {
      throw createHttpError.NotFound("Question not found");
    }
    
    res.json(question);
  } catch (error) {
    logger.error(`Controller error - updateQuestion: ${error.message}`);
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const question = await questionService.deleteQuestion(req.params.id);
    if (!question) {
      throw createHttpError.NotFound("Question not found");
    }
    res.status(204).send();
  } catch (error) {
    logger.error(`Controller error - deleteQuestion: ${error.message}`);
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
};