import { Router } from "express";
import { getLastMessages, appendMessagePair } from "../controllers/chatController.js";
// ⬇️ use the named export and alias it to keep the same variable name
import { authMiddleware as requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Get the last 10 messages for the currently logged-in user
router.get("/last", requireAuth, getLastMessages);

// Append the latest user+assistant pair and keep only last 10
router.post("/append", requireAuth, appendMessagePair);

export default router;
