const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewControllers");
const { protect } = require("../middleware/authMiddleware"); // Assuming auth middleware

router.use(protect());
// POST /api/reviews - Add a review (Protected)
router.post("/", reviewController.addReview);

// GET /api/reviews/:productId - Get reviews for a specific product (Public)
router.get("/:productId", reviewController.getProductReviews);

module.exports = router;
