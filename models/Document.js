// models/Document.js
import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    publicId: { type: String, required: true },   // Cloudinary public_id
    url: { type: String, required: true },        // Cloudinary secure_url
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    bytes: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Document", DocumentSchema);
