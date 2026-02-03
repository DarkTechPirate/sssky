const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");

// @desc Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update user role
// @desc Update user role (Restricted: Can only set to 'user' or 'worker')
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    // SECURITY: Strictly allow only 'user' or 'worker'.
    // Prevents creating new admins via this endpoint.
    const ALLOWED_ROLES = ["user", "staff"];

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Only 'user' or 'staff' roles can be assigned.",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get comprehensive user details for admin inspection
exports.getUserDetailsAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch User, Cart, and Orders in parallel for performance
    const [user, cart, orders] = await Promise.all([
      User.findById(id).select("-password"),
      Cart.findOne({ user: id }).populate("items.product", "title visuals"),
      Order.find({ user: id }).sort({ createdAt: -1 }),
    ]);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        profile: user,
        cart: cart || { items: [], totalPrice: 0 },
        orders: orders || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
