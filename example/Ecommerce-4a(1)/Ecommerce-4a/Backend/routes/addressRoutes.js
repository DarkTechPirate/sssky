const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware"); // Assuming you have auth middleware
const {
  getAddresses,
  addAddress,
  updateAddress,
  setPrimaryAddress,

  deleteAddress,
} = require("../controllers/addressControllers");

// Protect all address routes (user must be logged in)
router.use(protect());

// Get all & Add New
router.route("/").get(getAddresses).post(addAddress);

// Update details
router.put("/:addressId", updateAddress);

// Set Primary (Dedicated toggle endpoint)
router.put("/:addressId/primary", setPrimaryAddress);

// Delete
router.delete("/:addressId", deleteAddress);

module.exports = router;
