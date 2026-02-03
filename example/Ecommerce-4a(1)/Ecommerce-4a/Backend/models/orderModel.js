const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// --- STEP SCHEMA (For Timeline) ---
const OrderStepSchema = new Schema(
  {
    status: { type: String, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String },
    // ✅ NEW: Track who performed this action (e.g., "Customer", "System", "Admin: John")
    processedBy: { type: String, default: "System" },
  },
  { _id: false }
);

const OrderItemSchema = new Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    color: { type: String },
    size: { type: String },
    image: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: { type: String, unique: true, required: true },
    items: [OrderItemSchema],
    shippingAddress: {
      name: { type: String, required: true },
      door: String,
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
      phone: { type: String },
    },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["COD"], default: "COD" },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Cancellation Requested",
      ],
      default: "Pending",
    },
    steps: {
      type: [OrderStepSchema],
      default: [],
    },
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
    processedByWorker: { type: Boolean, default: false },
    trackingNumber: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", OrderSchema);
