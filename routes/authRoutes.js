import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { deductCredits } from "../controllers/authController.js";



const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.post("/logout", authMiddleware, logoutUser);
router.get("/me", authMiddleware, getUserProfile);
router.put("/deduct-credits", deductCredits);
export default router;
