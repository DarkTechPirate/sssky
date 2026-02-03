const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware"); // Assuming auth middleware
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} = require("../controllers/orderControllers");
router.use(protect());

// --- User Routes ---
router.post("/", createOrder);
router.get("/my-orders", getMyOrders);
router.put("/:id/cancel", cancelOrder);
router.get("/:id", getOrderById); // Place this last to avoid conflict with 'my-orders' if generic

module.exports = router;
