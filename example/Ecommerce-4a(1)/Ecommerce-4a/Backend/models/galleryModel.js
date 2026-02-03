const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GallerySchema = new Schema(
  {
    // 1. Ownership (Set to false for public uploads)
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    // 2. Image Data
    url: {
      type: String,
      required: false, // Worker fills this later
    },
    title: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "Upload",
    },

    // 3. Status Field (CRITICAL for Worker)
    status: {
      type: String,
      default: "processing", // 'processing', 'completed', 'failed'
    },

    // 4. Ordering
    order: {
      type: Number,
      default: 0,
    },

    // 5. Metadata
    fileType: { type: String },
    size: { type: Number },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Gallery", GallerySchema);
const getGallery = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin" ? {} : { uploadedBy: req.user._id };

    const images = await Gallery.find(filter).sort({ order: 1 });
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
