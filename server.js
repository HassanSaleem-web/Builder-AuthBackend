import express from "express";
import dotenv from "dotenv";
dotenv.config(); // must be before imports using env vars
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import stripeRoutes from "./routes/stripeRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { initCloudinary } from "./config/cloudinary.js";
import documentRoutes from "./routes/documentRoutes.js";

initCloudinary(); // ✅ one-time Cloudinary init

const app = express();

/* ==============================
   ⚙️ CORS Configuration
============================== */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://builderassistant-3ml1.onrender.com",
      "https://digistavadmin.onrender.com"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ==============================
   ⚠️ Stripe Webhook — raw body first!
   Must appear BEFORE express.json()
============================== */
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

/* ==============================
   🧩 Core Middleware
============================== */
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

/* ==============================
   🚏 Routes
============================== */
app.use("/api/stripe", stripeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/documents", documentRoutes);

/* ==============================
   🧠 Database Connection
============================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ==============================
   🩺 Health Check
============================== */
app.get("/", (req, res) => {
  res.send("Server is running...");
});

/* ==============================
   🧾 Global Error Handler
============================== */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

/* ==============================
   🚀 Start Server
============================== */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));
