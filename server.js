import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ─────────────────────────────────────────────
// 🧩 MIDDLEWARE
// ─────────────────────────────────────────────
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// ─────────────────────────────────────────────
// 🔗 ROUTES
// ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ─────────────────────────────────────────────
// 🔌 DATABASE & SERVER START
// ─────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ Connected to MongoDB");

  app.listen(PORT, () => {
    console.log(`🚀 Auth server running at http://localhost:${PORT}`);
    console.log(`🌐 CORS enabled for ${CLIENT_URL}`);
  });
})
.catch(err => {
  console.error("❌ MongoDB connection error:", err.message);
});
