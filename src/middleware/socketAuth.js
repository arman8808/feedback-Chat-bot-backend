
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export async function socketAuthMiddleware(socket, next) {
  try {
    const raw = socket.handshake.auth?.token;
    if (!raw) throw new Error("No token provided");
    const { userId } = jwt.verify(raw, process.env.JWT_SECRET);
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    socket.userId = userId;
    next();
  } catch (err) {
    console.error("Socket auth failed:", err.message);
    next(new Error("Authentication error"));
  }
}
