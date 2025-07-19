import {
  registerUser,
  loginUser,
  getUserById,
} from "../services/user.service.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

export const register = async (req, res) => {
  try {
    const user = await registerUser(req.body);
    const token = generateToken(user._id);

    res.status(201).json({
      message: "User registered",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.log(err);

    res.status(400).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const user = await loginUser(req.body);
    const token = generateToken(user._id);

   
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

export const logout = async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logged out successfully" });
};

export const getMe = async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
