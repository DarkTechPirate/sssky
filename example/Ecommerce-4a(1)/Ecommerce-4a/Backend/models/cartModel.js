const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CartItemSchema = new Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: String,
    price: Number,
    image: String,
    color: String,
    size: String,
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: true }
);
const CartSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [CartItemSchema],
    totalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ✅ FIX: Remove 'next' from parameters and body
CartSchema.pre("save", function () {
  // Simple synchronous logic doesn't need 'next()' in modern Mongoose
  if (this.items && this.items.length > 0) {
    this.totalPrice = this.items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  } else {
    this.totalPrice = 0;
  }
});

module.exports = mongoose.model("Cart", CartSchema);
