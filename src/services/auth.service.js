
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export async function verifySocketToken(raw) {
  if (!raw) {
    throw new Error("No token provided");
  }
  let payload;
  try {
    payload = jwt.verify(raw, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
  const user = await User.findById(payload.userId);
  if (!user) throw new Error("User not found");
  return user;
}
