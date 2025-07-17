import express from "express";
import { createIssue, getIssues } from "../controller/issue.controller.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createIssue);

router.get("/", protect, getIssues);

export default router;
