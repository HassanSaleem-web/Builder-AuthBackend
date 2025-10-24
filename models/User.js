import mongoose from "mongoose";

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
      enum: ["free", "basic", "premium"],
      default: "free",
    },
    creditsLeft: {
      type: Number,
      default: 100, // free-tier default
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
