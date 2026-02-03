const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
  subCategory: { type: String },
  price: { type: Number, required: true },
  discountPrice: { type: Number },

  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },

  // --- DYNAMIC DELIVERY INFO ---
  deliveryInfo: {
    estimatedDays: { type: String, default: "3-5 Business Days" },
    shippingCost: { type: Number, default: 0 }, // 0 = Free
    returnPolicy: { type: String, default: "7 Days Return Policy" },
  },

  // --- VISUALS ---
  visuals: [
    {
      colorName: String,
      hexCode: String,
      images: [String], // Stores relative paths like "/uploads/..."
    },
  ],

  // --- SIZING ---
  sizeInfo: {
    unit: { type: String, default: "US" },
    chart: [String],
  },

  // --- STOCK ---
  stock: [
    {
      colorName: String,
      size: String,
      quantity: { type: Number, default: 0, min: 0 },
      sku: String,
    },
  ],

  features: [String],
  badge: { type: String, default: null },

  createdAt: { type: Date, default: Date.now },
});

productSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
