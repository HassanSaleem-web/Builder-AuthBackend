// controllers/documentController.js
// controllers/documentController.js
import { cloudinary } from "../config/cloudinary.js";
import Document from "../models/Document.js";


// Cloudinary is expected to be configured via env in server.js,
// but if not, uncomment below:
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

export const createDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!req.user?.id && !req.user?._id)
      return res.status(401).json({ message: "Unauthorized" });

    const userId = req.user.id || req.user._id;

    // Upload buffer to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto" },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    const doc = await Document.create({
      user: userId,
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      bytes: uploadResult.bytes ?? req.file.size ?? 0,
    });

    return res.status(201).json(doc);
  } catch (err) {
    console.error("createDocument error:", err);
    return res.status(500).json({ message: "Upload failed" });
  }
};

export const listDocuments = async (req, res) => {
  try {
    if (!req.user?.id && !req.user?._id)
      return res.status(401).json({ message: "Unauthorized" });

    const userId = req.user.id || req.user._id;
    const docs = await Document.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(docs);
  } catch (err) {
    console.error("listDocuments error:", err);
    return res.status(500).json({ message: "Failed to fetch documents" });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    if (!req.user?.id && !req.user?._id)
      return res.status(401).json({ message: "Unauthorized" });

    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (String(doc.user) !== String(userId))
      return res.status(403).json({ message: "Forbidden" });

    // Delete from Cloudinary (ignore errors from destroy to keep UX simple)
    try {
      await cloudinary.uploader.destroy(doc.publicId, { resource_type: "auto" });
    } catch (e) {
      console.warn("Cloudinary destroy warning:", e?.message);
    }

    await doc.deleteOne();
    return res.json({ success: true });
  } catch (err) {
    console.error("deleteDocument error:", err);
    return res.status(500).json({ message: "Delete failed" });
  }
};
