import mongoose from "mongoose";

// Minimal embedded message schema for last-10 chat history (no _id on items)
const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, trim: true, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    lastChatSession: {
      type: mongoose.Schema.Types.Mixed, // can hold an object or string thread ID
      default: null,
    },
    subscription: {
      type: String,
      enum: ["free", "starter", "Most Popular", "Best Value"],
      default: "free",
    },
    creditsLeft: {
      type: Number,
      default: 100, // free-tier default
    },

    // 🔹 New: lightweight chat storage for "last 10 messages"
    chat: {
      updatedAt: { type: Date, default: null },
      last10: { type: [messageSchema], default: [] },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
