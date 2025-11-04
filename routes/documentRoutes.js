// routes/documentRoutes.js
import express from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createDocument,
  listDocuments,
  deleteDocument,
} from "../controllers/documentController.js";

const router = express.Router();

// Multer in-memory buffer
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/documents        -> upload one file
router.post("/", authMiddleware, upload.single("file"), createDocument);

// GET  /api/documents        -> list current user's docs
router.get("/", authMiddleware, listDocuments);

// DELETE /api/documents/:id  -> delete by document _id
router.delete("/:id", authMiddleware, deleteDocument);

export default router;
