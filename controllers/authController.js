import User from "../models/User.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";

// 🧩 Register new user
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields are required." });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered." });

    const passwordHash = await hashPassword(password);

    const newUser = await User.create({
      username,
      email,
      passwordHash,
      subscription: "free",
      creditsLeft: 15,
    });

    const token = generateToken({ id: newUser._id });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
      .status(201)
      .json({
        message: "User registered successfully.",
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          subscription: newUser.subscription,
          creditsLeft: newUser.creditsLeft,
        },
      });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

// 🔐 Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials." });

    const token = generateToken({ id: user._id });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
      .json({
        message: "Login successful.",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          subscription: user.subscription,
          creditsLeft: user.creditsLeft,
        },
      });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

// 🚪 Logout user
export const logoutUser = async (req, res) => {
  res.clearCookie("token").json({ message: "Logged out successfully." });
};

// 👤 Get current user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Internal server error." });
  }
};
// Deduct credits from user account
export const deductCredits = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ message: "User ID and amount are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent going below zero
    user.creditsLeft = Math.max(0, user.creditsLeft - amount);
    await user.save();

    res.json({ message: "Credits updated", creditsLeft: user.creditsLeft });
  } catch (err) {
    console.error("Error deducting credits:", err);
    res.status(500).json({ message: "Server error" });
  }
};
