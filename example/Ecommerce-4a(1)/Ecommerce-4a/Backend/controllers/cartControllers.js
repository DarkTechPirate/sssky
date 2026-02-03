const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

/**
 * @desc    Get current user's cart
 * @route   GET /api/cart
 */
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "title slug stock visuals price discountPrice"
    );

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("GetCart Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Add Item to Cart (Robust Duplicate Check)
 * @route   POST /api/cart/add
 */
exports.addToCart = async (req, res) => {
  try {
    const { productId, color, size, quantity } = req.body;
    const userId = req.user._id;

    // 1. Fetch Product
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // 2. Determine Image & Price
    let image = product.visuals?.[0]?.images?.[0] || ""; // Default
    const variantVisual = product.visuals.find((v) => v.colorName === color);
    if (variantVisual && variantVisual.images?.length > 0) {
      image = variantVisual.images[0];
    }

    const price = product.discountPrice || product.price;

    // 3. Find User's Cart
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // CASE: Create New Cart
      cart = new Cart({
        user: userId,
        items: [
          {
            product: productId,
            title: product.title,
            price,
            image,
            color,
            size,
            quantity,
          },
        ],
      });
    } else {
      // CASE: Cart Exists - Check for Duplicates
      const itemIndex = cart.items.findIndex((p) => {
        // Handle both populated (Object) and unpopulated (String) IDs safely
        const existingId = p.product._id
          ? p.product._id.toString()
          : p.product.toString();
        const incomingId = productId.toString();

        return (
          existingId === incomingId && p.color === color && p.size === size
        );
      });

      if (itemIndex > -1) {
        // MATCH FOUND: Update Quantity
        cart.items[itemIndex].quantity += quantity;
        // Update price/image to keep it fresh
        cart.items[itemIndex].price = price;
        cart.items[itemIndex].image = image;
      } else {
        // NO MATCH: Push New Item
        cart.items.push({
          product: productId,
          title: product.title,
          price,
          image,
          color,
          size,
          quantity,
        });
      }
    }

    await cart.save();

    // Populate before returning to ensure frontend gets full objects
    await cart.populate("items.product", "title slug stock visuals");

    res.status(200).json({
      success: true,
      message: "Cart updated",
      cart,
    });
  } catch (error) {
    console.error("AddToCart Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update Item Quantity
 * @route   PUT /api/cart/update
 */
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item)
      return res.status(404).json({ message: "Item not found in cart" });

    item.quantity = quantity;

    await cart.save();
    await cart.populate("items.product", "title slug stock visuals");

    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Remove Item from Cart
 * @route   DELETE /api/cart/item/:itemId
 */
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items.pull(req.params.itemId);

    await cart.save();
    await cart.populate("items.product", "title slug stock visuals");

    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Clear Cart
 * @route   DELETE /api/cart
 */
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.status(200).json({ success: true, message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
