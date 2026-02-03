const Banner = require("../models/bannerModel"); // <--- FIXED TYPO
const { mediaQueue } = require("../services/queue");
const minio = require("../config/minio");
const path = require("path");

const BUCKET = process.env.MINIO_BUCKET_NAME;

// --- HELPER: Queue Image Processing ---
const queueBannerProcessing = async (file, bannerId) => {
  // Use absolute path for worker reliability
  const absolutePath = path.resolve(file.path);

  await mediaQueue.add("process-product-image", {
    fileId: bannerId,
    filePath: absolutePath, // Send absolute path
    mimeType: file.mimetype,
    outputDir: path.join(__dirname, "../public/uploads"),
    modelName: "Banner",
    fieldName: "image",
    operation: "replace",
  });
};

// --- 1. GET BANNERS ---
exports.getBanners = async (req, res) => {
  try {
    const { page } = req.query;
    const query = page ? { page } : {};
    // Sort 0, 1, 2...
    const banners = await Banner.find(query).sort({ order: 1 });
    res.status(200).json(banners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 2. CREATE BANNER ---
exports.createBanner = async (req, res) => {
  try {
    const { title, subtitle, page } = req.body;
    const targetPage = page || "home";

    // Auto-Order: Put at end of list
    const lastBanner = await Banner.findOne({ page: targetPage }).sort({
      order: -1,
    });
    const nextOrder = lastBanner ? lastBanner.order + 1 : 0;

    const newBanner = new Banner({
      title,
      subtitle,
      page: targetPage,
      order: nextOrder,
    });

    const savedBanner = await newBanner.save();

    // Check req.file exists before queuing
    if (req.file) {
      await queueBannerProcessing(req.file, savedBanner._id);
    }

    res.status(201).json(savedBanner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 3. UPDATE DETAILS ---
exports.updateBannerDetails = async (req, res) => {
  try {
    const { title, subtitle } = req.body;
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Not found" });

    if (title !== undefined) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;

    await banner.save();
    res.status(200).json(banner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 4. REORDER ---
exports.reorderBanners = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items))
      return res.status(400).json({ message: "Invalid data" });

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { order: item.order } },
      },
    }));

    if (bulkOps.length > 0) await Banner.bulkWrite(bulkOps);
    res.status(200).json({ message: "Reordered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 5. DELETE ---
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Not found" });

    if (banner.image && banner.image.startsWith("/uploads/")) {
      const objectKey = banner.image.replace("/uploads/", "");
      try {
        await minio.removeObject(BUCKET, objectKey);
      } catch (e) {}
    }

    await Banner.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
