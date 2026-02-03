const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  getGallery,
  uploadImages,
  updateImageDetails,
  deleteImages,
  reorderImages,
} = require("../../controllers/galleryControllers");

// --- 1. Ensure Directory Exists ---
const uploadDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// --- 2. Multer Storage Configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save directly to public/uploads
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `raw-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// --- 3. File Filter ---
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images are allowed."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 50 }, // 50MB limit
});

// --- 4. Route Definitions ---
router
  .route("/")
  .get(getGallery)
  .post(upload.array("images", 20), uploadImages);

router.put("/reorder", reorderImages);
router.post("/delete-batch", deleteImages);
router.put("/:id", updateImageDetails);

module.exports = router;
