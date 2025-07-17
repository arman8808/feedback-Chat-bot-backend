import Issue from "../models/issue.model.js";

export const reportIssue = async ({ userId, questionId, rating, message }) => {
  const issue = new Issue({ userId, questionId, rating, message });
  return await issue.save();
};

export const listIssues = async () => {
  return await Issue
    .find()
    .populate("userId", "name email")
    .populate("questionId", "text order")
    .sort({ createdAt: -1 });
};
