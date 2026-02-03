const express = require("express");
const router = express.Router();
const multer = require("multer");
const bannerController = require("../../controllers/bannerController");

const upload = multer({ dest: "uploads/temp/" });

// ADMIN POST (Upload)
router.post("/", upload.single("image"), bannerController.createBanner);

// ADMIN PUT (Reorder) - MUST be before /:id to avoid collision
router.put("/reorder", bannerController.reorderBanners);

// ADMIN PUT (Update Details)
router.put("/:id", bannerController.updateBannerDetails);

// ADMIN DELETE
router.delete("/:id", bannerController.deleteBanner);

module.exports = router;
