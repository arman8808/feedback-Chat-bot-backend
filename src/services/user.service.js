import User from "../models/user.model.js";

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("User already exists");

  const user = new User({ name, email, password });
  await user.save();
  return user;
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await user.matchPassword(password);
  if (!isMatch) throw new Error("Invalid credentials");

  return user;
};

export const updateSocketId = async (userId, socketId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  user.socketId = socketId;
  await user.save();
  return user;
};

export const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new Error("User not found");

  return user;
};
