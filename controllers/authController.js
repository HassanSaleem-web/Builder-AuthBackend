import User from "../models/User.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";
import Document from "../models/Document.js";
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

    const token = generateToken({ _id: newUser._id });
    res
      .cookie("token", token, {
        httpOnly: true,
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // allow cross-origin
  maxAge: 7 * 24 * 60 * 60 * 1000, // optional: 7 days
      })
      .status(201)
      .json({
        message: "User registered successfully.",
        user: {
          _id: newUser._id, // ✅ fixed key
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

    const token = generateToken({ _id: user._id });

    res
  .cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
      .json({
        message: "Login successful.",
        user: {
          _id: user._id, // ✅ fixed key
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
  res
  .clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  })
  .json({ message: "Logged out successfully." });

};

// 👤 Get current user profile
export const getUserProfile = async (req, res) => {
  console.log("[getUserProfile] HIT", new Date().toISOString());
  console.log("[getUserProfile] req.user:", req?.user); // should have { id } or { _id }

  try {
    const userId = req?.user?.id || req?.user?._id;
    console.log("[getUserProfile] derived userId:", userId);

    if (!userId) {
      console.warn("[getUserProfile] No user id on request. Headers snapshot:", {
        hasAuthorization: Boolean(req.headers?.authorization),
        hasCookie: Boolean(req.headers?.cookie),
        origin: req.headers?.origin,
      });
      return res.status(401).json({ message: "Unauthorized." });
    }

    // Optional: confirm the DB/collection you’re hitting
    try {
      const conn = User?.db?.client?.s?.url || User?.db?.name;
      console.log("[getUserProfile] DB connection info:", conn);
    } catch (_) {}

    const user = await User.findById(userId).select("-passwordHash");
    console.log(
      "[getUserProfile] query result:",
      user ? { _id: user._id?.toString(), email: user.email } : null
    );

    if (!user) {
      console.warn("[getUserProfile] User not found for id:", userId);
      return res.status(404).json({ message: "User not found." });
    }

    console.log("[getUserProfile] SUCCESS returning profile.");
    return res.json(user);
  } catch (err) {
    console.error("[getUserProfile] ERROR:", err?.message, err?.stack);
    return res.status(500).json({ message: "Internal server error." });
  }
};


// 💳 Deduct credits
export const deductCredits = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ message: "User ID and amount are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.creditsLeft = Math.max(0, user.creditsLeft - amount);
    await user.save();

    res.json({ message: "Credits updated", creditsLeft: user.creditsLeft });
  } catch (err) {
    console.error("Error deducting credits:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// 🧩 Admin: get all users (for admin panel)
export const getAllUsers = async (req, res) => {
  try {
    // Exclude password hash from results
    const users = await User.find().select("-password");

    return res.json(users);
  } catch (err) {
    console.error("Error fetching all users:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
// 🗑️ ADMIN: Delete a user completely
export const deleteUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Delete user from DB
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optional: delete user documents
    await Document.deleteMany({ user: userId });

    // Optional: delete chat history
    // If chat is embedded with the user, it gets removed already
    // If chat is a separate model, delete here.

    return res.json({ message: "User deleted successfully" });

  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
// 🛠️ ADMIN: Update user's credits and/or subscription
export const adminUpdateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { creditsLeft, subscription } = req.body;

    if (!creditsLeft && !subscription) {
      return res.status(400).json({
        message: "No fields provided to update."
      });
    }

    const updateFields = {};
    if (creditsLeft !== undefined) updateFields.creditsLeft = creditsLeft;
    if (subscription !== undefined) updateFields.subscription = subscription;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "User updated successfully",
      user: updatedUser
    });

  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
