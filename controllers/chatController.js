import mongoose from "mongoose";
import User from "../models/User.js";

// Defensive helper to coerce a message shape
function normalizeMessage(input, role) {
  if (!input || typeof input !== "object") input = {};
  const content = typeof input.content === "string" ? input.content : "";
  const createdAt = input.createdAt ? new Date(input.createdAt) : new Date();
  return { role, content, createdAt };
}

/**
 * GET /api/chat/last
 * Returns last 10 messages from the user’s most recent session
 */
export async function getLastMessages(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId, { "chat.last10": 1, "chat.updatedAt": 1 }).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const messages = Array.isArray(user.chat?.last10) ? user.chat.last10 : [];
    // Return oldest → newest for easy UI rendering
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return res.json({
      updatedAt: user.chat?.updatedAt || null,
      messages,
    });
  } catch (err) {
    console.error("getLastMessages error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/chat/append
 * Body: { userMessage: { content }, assistantMessage: { content } }
 * Appends both messages and trims to last 10.
 */
export async function appendMessagePair(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { userMessage, assistantMessage } = req.body || {};

    // Normalize messages (role enforced)
    const uMsg = normalizeMessage(userMessage, "user");
    const aMsg = normalizeMessage(assistantMessage, "assistant");

    // Single atomic push of both; keep only the last 10
    const result = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          "chat.last10": {
            $each: [uMsg, aMsg],
            $slice: -10,
          },
        },
        $set: { "chat.updatedAt": new Date() },
      },
      { new: true, projection: { "chat.last10": 1, "chat.updatedAt": 1 } }
    ).lean();

    if (!result) return res.status(404).json({ message: "User not found" });

    const messages = Array.isArray(result.chat?.last10) ? result.chat.last10 : [];
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return res.json({
      updatedAt: result.chat?.updatedAt || null,
      messages,
    });
  } catch (err) {
    console.error("appendMessagePair error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
