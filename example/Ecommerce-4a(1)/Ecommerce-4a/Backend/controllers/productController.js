const Product = require("../models/productModel");
const { mediaQueue } = require("../services/queue");
const fs = require("fs");
const path = require("path");

// --- HELPER: Queue Image Processing ---
const queueImageProcessing = async (file, productId, fieldPath) => {
  await mediaQueue.add("process-product-image", {
    fileId: productId,
    filePath: file.path,
    mimeType: file.mimetype,
    outputDir: path.join(__dirname, "../public/uploads"),
    modelName: "Product",
    fieldName: fieldPath,
    operation: "push",
  });
};

// --- 1. CREATE PRODUCT ---
exports.createProduct = async (req, res) => {
  try {
    let productData = req.body;
    if (req.body.productData) {
      productData = JSON.parse(req.body.productData);
    }

    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();

    // Handle New Files
    if (req.files) {
      const uploadPromises = Object.keys(req.files).map(async (key) => {
        const index = parseInt(key.split("_")[1]);
        const files = req.files[key];
        for (const file of files) {
          await queueImageProcessing(
            file,
            savedProduct._id,
            `visuals.${index}.images`
          );
        }
      });
      await Promise.all(uploadPromises);
    }

    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 2. UPDATE PRODUCT ---
exports.updateProduct = async (req, res) => {
  try {
    let updateData = req.body;
    if (req.body.productData) {
      updateData = JSON.parse(req.body.productData);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct)
      return res.status(404).json({ message: "Product not found" });

    // Handle New Files
    if (req.files) {
      const uploadPromises = Object.keys(req.files).map(async (key) => {
        const index = parseInt(key.split("_")[1]);
        const files = req.files[key];
        for (const file of files) {
          await queueImageProcessing(
            file,
            updatedProduct._id,
            `visuals.${index}.images`
          );
        }
      });
      await Promise.all(uploadPromises);
    }

    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 3. DELETE PRODUCT ---
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Cleanup Files
    let allImages = [];
    if (product.visuals) {
      product.visuals.forEach((v) => {
        if (v.images) allImages = [...allImages, ...v.images];
      });
    }

    allImages.forEach((relPath) => {
      const fullPath = path.join(__dirname, "../public", relPath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (e) {
          console.error("Del failed", e);
        }
      }
    });

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- GETTERS ---
exports.getAllAdminProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort } = req.query;
    let query = {};

    if (category && category !== "All") query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === "Price: Low to High") sortOption = { price: 1 };
    if (sort === "Price: High to Low") sortOption = { price: -1 };

    const products = await Product.find(query)
      .sort(sortOption)
      .select("title price category image1 image2 badge visuals subCategory")
      .lean();

    res.status(200).json(products);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: err.message });
  }
};

exports.getRecommendations = async (req, res) => {
  const { currentId, category } = req.query;
  const LIMIT = 5;
  try {
    let recommendations = [];
    if (category) {
      recommendations = await Product.find({
        category: category,
        _id: { $ne: currentId },
      }).limit(LIMIT);
    }
    if (recommendations.length < LIMIT) {
      const needed = LIMIT - recommendations.length;
      const existingIds = recommendations.map((p) => p._id);
      if (currentId) existingIds.push(currentId);
      const randomProducts = await Product.aggregate([
        { $match: { _id: { $nin: existingIds } } },
        { $sample: { size: needed } },
      ]);
      recommendations = [...recommendations, ...randomProducts];
    }
    res.status(200).json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
