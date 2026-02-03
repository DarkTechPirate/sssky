const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrdersAdmin,
  adminUpdateOrderStatus,
} = require("../../controllers/orderControllers");
const { protect } = require("../../middleware/authMiddleware");

// --- ADMIN / STAFF ROUTES ---

// 1. Get All Orders (Admin OR Staff)
// Note: Ensure your protect middleware supports { staff: true } as implemented previously
router.get("/all", getAllOrdersAdmin);

// 2. Update Order Status (Admin OR Staff)
router.put(
  "/:id",

  adminUpdateOrderStatus
);

// --- SHARED ROUTES ---
// Must be at bottom so :id doesn't clash with "myorders" or "admin/all"
router.get("/:id", getOrderById);

module.exports = router;
