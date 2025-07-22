
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export async function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    
    if (!token) {
      console.error('No token provided in handshake:', socket.handshake);
      throw new Error("AUTH_REQUIRED");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.userId) throw new Error("INVALID_TOKEN");

    const user = await User.findById(decoded.userId).select('_id');
    if (!user) throw new Error("USER_NOT_FOUND");

    socket.userId = user._id;
    socket.user = { _id: user._id }; 
    console.log(`Authenticated socket for user ${user._id}`);
    next();
  } catch (err) {
    console.error('Socket auth failed:', err.message);
    const error = new Error(err.message || "AUTH_FAILED");
    error.code = err.message;
    next(error);
  }
}
