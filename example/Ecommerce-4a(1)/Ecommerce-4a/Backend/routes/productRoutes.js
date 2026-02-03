const router = require("express").Router();
const productController = require("../controllers/productController");

// This handles: /api/products?category=Running&sort=Newest...
router.get("/", productController.getAllProducts);

router.get("/recommendations", productController.getRecommendations); // Must be before /:id
router.get("/:id", productController.getProductById);

module.exports = router;
