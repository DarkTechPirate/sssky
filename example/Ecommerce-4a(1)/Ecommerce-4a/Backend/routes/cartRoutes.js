const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware"); // Assuming you have this
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartControllers");

router.use(protect()); // All cart routes require login

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update", updateCartItem);
router.delete("/item/:itemId", removeFromCart);
router.delete("/", clearCart);

module.exports = router;
