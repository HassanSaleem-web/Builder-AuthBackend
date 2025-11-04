import express from "express";
import dotenv from "dotenv";
dotenv.config(); // must be before imports using env vars
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import stripeRoutes from "./routes/stripeRoutes.js";
import chatRoutes from "./routes/chatRoutes.js"; // ✅ NEW
import { initCloudinary } from "./config/cloudinary.js";
import documentRoutes from "./routes/documentRoutes.js";
dotenv.config();
initCloudinary(); // ✅ one-time Cloudinary init

const app = express();

// ⚙️ Core middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",                // for local dev
      "https://builderassistant-3ml1.onrender.com" // your deployed frontend
    ],
    credentials: true,
  })
);

// Stripe webhook requires RAW body — must be before express.json()
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

// Normal JSON parser for all other routes
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// 🔐 Routes
app.use("/api/stripe", stripeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes); // ✅ NEW
app.use("/api/documents", documentRoutes);
// ✅ Database connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 🟢 Health check endpoint
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// 🧾 Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// 🚀 Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));
