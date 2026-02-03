const Gallery = require("../models/galleryModel");
const { mediaQueue } = require("../services/queue");
const path = require("path");
const fs = require("fs");

// --- CONFIGURATION ---
// Define the absolute path to the uploads directory using the process root
const UPLOAD_ROOT = path.join(process.cwd(), "public/uploads");

// Ensure the upload directory exists immediately
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

// --- HELPER: Queue Gallery Job ---
const queueGalleryProcessing = async (file, galleryId) => {
  // 1. Resolve the absolute path of the temp file uploaded by Multer
  const absoluteFilePath = path.resolve(file.path);

  // 2. Add job to the queue
  await mediaQueue.add("process-gallery-image", {
    fileId: galleryId,
    filePath: absoluteFilePath, // Worker needs absolute path to find the file
    mimeType: file.mimetype,
    outputDir: UPLOAD_ROOT, // Worker saves processed file here
    modelName: "Gallery",
    fieldName: "url", // The field in MongoDB to update
    operation: "set", // Replace the value (don't push to array)
  });
};

// @desc    Get all images (Sorted by order)
// @route   GET /api/gallery
const getGallery = async (req, res) => {
  try {
    const isAdmin = req.user?.role === "admin";
    // Admins see everything (including processing status)
    // Public/Users see only completed images, sorted by order
    const query = isAdmin
      ? Gallery.find({}).sort({ order: 1 })
      : Gallery.find({ status: "completed" })
          .select("order url title")
          .sort({ order: 1 });

    const images = await query;
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk Upload & Queue
// @route   POST /api/gallery
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Get current highest order to append new images at the end
    const lastImage = await Gallery.findOne({ uploadedBy: req.user._id }).sort({
      order: -1,
    });
    let currentOrder = lastImage ? lastImage.order + 1 : 0;

    const processedFiles = [];

    // Process files sequentially to maintain order
    for (const file of req.files) {
      // 1. Create DB Record (Status: processing)
      // We set a temporary URL or empty string until the worker finishes
      const newImage = new Gallery({
        uploadedBy: req.user._id,
        title: file.originalname,
        category: "Upload",
        fileType: file.mimetype,
        size: file.size,
        order: currentOrder++,
        url: "",
        status: "processing", // Frontend can show a spinner for these
      });

      const savedImage = await newImage.save();

      // 2. Queue the job
      await queueGalleryProcessing(file, savedImage._id);

      processedFiles.push(savedImage);
    }

    res.status(201).json({
      message: "Uploads started. Images are processing.",
      data: processedFiles,
    });
  } catch (error) {
    console.error("Gallery Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Image Details (Title)
// @route   PUT /api/gallery/:id
const updateImageDetails = async (req, res) => {
  try {
    const { title } = req.body;

    // Find image uploaded by this user
    const image = await Gallery.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    image.title = title !== undefined ? title : image.title;
    await image.save();

    res.status(200).json(image);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk Delete Images (Robust File Cleanup)
// @route   POST /api/gallery/delete-batch
const deleteImages = async (req, res) => {
  try {
    const { ids } = req.body; // Expects: ["id1", "id2"]

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided" });
    }

    // 1. Find images to get their file paths before deleting from DB
    const imagesToDelete = await Gallery.find({
      _id: { $in: ids },
      uploadedBy: req.user._id,
    });

    // 2. Delete files from disk synchronously
    imagesToDelete.forEach((img) => {
      // Ensure we have a URL and it's local (not an external http link)
      if (img.url && !img.url.startsWith("http")) {
        try {
          // Robust Path Construction:
          // If URL is "public/uploads/file.webp", join with process.cwd()
          // If URL is "/uploads/file.webp", strip leading slash first if needed
          const cleanUrl = img.url.startsWith("/") ? img.url.slice(1) : img.url;
          const absolutePath = path.join(process.cwd(), cleanUrl);

          if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
            console.log(`[Gallery Cleanup] Deleted: ${absolutePath}`);
          } else {
            // Fallback: Check if it's inside public/uploads explicitly if the path in DB was just filename
            const fallbackPath = path.join(UPLOAD_ROOT, path.basename(img.url));
            if (fs.existsSync(fallbackPath)) {
              fs.unlinkSync(fallbackPath);
              console.log(
                `[Gallery Cleanup] Deleted (Fallback): ${fallbackPath}`
              );
            }
          }
        } catch (err) {
          // Log but continue deleting other files/DB records
          console.error(
            `[Gallery Cleanup Error] Failed to delete file for ID ${img._id}:`,
            err.message
          );
        }
      }
    });

    // 3. Delete from Database
    await Gallery.deleteMany({
      _id: { $in: ids },
      uploadedBy: req.user._id,
    });

    res.status(200).json({
      message: `Successfully deleted ${imagesToDelete.length} images`,
    });
  } catch (error) {
    console.error("Gallery Delete Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reorder Images
// @route   PUT /api/gallery/reorder
const reorderImages = async (req, res) => {
  try {
    const { items } = req.body; // Expects: [{ id: "...", order: 0 }, ...]

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Invalid items data" });
    }

    // Use bulkWrite for performance
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id, uploadedBy: req.user._id },
        update: { $set: { order: item.order } },
      },
    }));

    if (bulkOps.length > 0) {
      await Gallery.bulkWrite(bulkOps);
    }

    res.status(200).json({ message: "Order updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getGallery,
  uploadImages,
  updateImageDetails,
  deleteImages,
  reorderImages,
};
