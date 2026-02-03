const Product = require("../models/productModel");
const Review = require("../models/reviewModel");

// 1. Add a Review
exports.addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user._id; // Assuming auth middleware adds user to req

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed (optional, handled by schema index too)
    const existingReview = await Review.findOne({
      product: productId,
      user: userId,
    });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    // Create Review
    const review = await Review.create({
      product: productId,
      user: userId,
      rating,
      comment,
    });

    // Update Product Aggregate Data (Rating & Count)
    const stats = await Review.aggregate([
      { $match: { product: product._id } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          numReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      product.rating = stats[0].avgRating;
      product.reviewsCount = stats[0].numReviews;
    } else {
      product.rating = 0;
      product.reviewsCount = 0;
    }

    await product.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
      updatedRating: product.rating,
      updatedCount: product.reviewsCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error adding review" });
  }
};

// 2. Get Reviews for a Product
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate("user", "fullname profileImage") // Adjust fields based on your User model
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error fetching reviews" });
  }
};
