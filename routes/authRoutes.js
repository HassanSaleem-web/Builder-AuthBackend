import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  getAllUsers,
  deleteUserById,
  adminUpdateUser
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
// Admin: list all users (currently no auth; protect later if needed)
router.get("/users", getAllUsers);
// Admin: delete any user
router.delete("/user/:id", deleteUserById);
// Admin: update credits & subscription
router.put("/admin/user/:id/update", adminUpdateUser);


export default router;
