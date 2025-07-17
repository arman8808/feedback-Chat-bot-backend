// middleware/socketAuth.js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const verifySocketJWT = async (socket, next) => {
  try {
    const raw = socket.handshake.headers.cookie
      ?.split(";")
      .find((c) => c.trim().startsWith("jwt="))
      ?.split("=")[1];

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
};
