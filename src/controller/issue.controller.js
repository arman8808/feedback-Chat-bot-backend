import { reportIssue, listIssues } from "../services/issue.service.js";

export const createIssue = async (req, res) => {
  try {
    const { questionId = null, rating = null, message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const issue = await reportIssue({
      userId: req.userId,
      questionId,
      rating,
      message,
    });

    res.status(201).json({
      message: "Issue reported successfully",
      issue,
    });
  } catch (err) {
    console.error("createIssue error:", err);
    res.status(500).json({ message: "Server error reporting issue" });
  }
};

export const getIssues = async (req, res) => {
  try {
    const issues = await listIssues();
    res.status(200).json(issues);
  } catch (err) {
    console.error("getIssues error:", err);
    res.status(500).json({ message: "Server error fetching issues" });
  }
};
