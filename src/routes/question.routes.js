import express from "express";
import * as questionController from "../controller/question.controller.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

// Middleware for logging requests
router.use((req, res, next) => {
  logger.info(`Question route: ${req.method} ${req.path}`);
  next();
});

router.post("/", questionController.createQuestion);
router.get("/", questionController.getQuestions);
router.get("/:id", questionController.getQuestion);
router.put("/:id", questionController.updateQuestion);
router.delete("/:id", questionController.deleteQuestion);

export default router;