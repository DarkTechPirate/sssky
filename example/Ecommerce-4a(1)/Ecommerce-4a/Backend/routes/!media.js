const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { mediaQueue } = require("../services/queue");

// Simple Raw Uploader (Just save to disk temporarily)
const upload = multer({ dest: "public/uploads/temp/" });

router.post("/upload-feed", upload.single("mediaFile"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  // 1. Create a DB Record (Optional but recommended)
  // const newFile = await MediaModel.create({ status: 'PROCESSING', originalName: req.file.originalname });
  const mockFileId = "mongo_id_12345";

  // 2. Add Job to Queue
  await mediaQueue.add("convert-media", {
    filePath: req.file.path, // Where the raw file is now
    mimeType: req.file.mimetype, // Is it video or image?
    outputDir: "public/uploads/feeds", // Where we want the final result
    fileId: mockFileId, // ID to update later
  });

  // 3. Instant Response
  res.json({
    message: "Upload received. Processing in background.",
    fileId: mockFileId,
    status: "PROCESSING", // The frontend can poll this status later
  });
});

module.exports = router;
