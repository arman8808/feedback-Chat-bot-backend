import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN || "1d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  });
};

export default generateToken;
