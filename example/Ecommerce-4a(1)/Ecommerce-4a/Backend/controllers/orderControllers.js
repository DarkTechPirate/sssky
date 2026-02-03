const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");

const {
  notificationQueue,
  orderProcessingQueue,
} = require("../services/queue");

exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, addressId, paymentMethod, totalAmount, phone } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    const selectedAddress = user.addresses.find(
      (addr) => addr._id && addr._id.toString() === addressId
    );
    if (!selectedAddress) throw new Error("Invalid address ID selected");

    let finalPhone = phone || user.phone || user.mobile;
    if (!finalPhone)
      throw new Error("Phone number is required to place an order.");

    if (!user.phone && !user.mobile) {
      user.phone = finalPhone;
      await user.save({ session });
    }

    const orderItems = [];
    const normalize = (str) =>
      String(str || "")
        .trim()
        .toLowerCase();

    for (const item of items) {
      const productId = item.product || item.productId;
      const product = await Product.findById(productId).session(session);
      if (!product) throw new Error(`Product ID ${productId} not found`);

      const variantIndex = product.stock.findIndex((s) => {
        return (
          normalize(s.colorName) === normalize(item.color) &&
          normalize(s.size) === normalize(item.size)
        );
      });

      if (variantIndex === -1)
        throw new Error(
          `Variant ${item.color}/${item.size} unavailable for ${product.title}`
        );

      if (product.stock[variantIndex].quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.title}`);
      }

      product.stock[variantIndex].quantity -= item.quantity;
      await product.save({ session });

      orderItems.push({
        product: product._id,
        title: product.title,
        price: product.discountPrice || product.price,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        image: item.image || (product.visuals && product.visuals[0]?.images[0]),
      });
    }

    const newOrderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newOrder = new Order({
      user: userId,
      orderId: newOrderId,
      items: orderItems,
      shippingAddress: {
        name: user.fullname || user.username,
        door: selectedAddress.door,
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        zip: selectedAddress.zip,
        country: selectedAddress.country,
        phone: finalPhone,
      },
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
      status: "Pending",
      steps: [
        {
          status: "Pending",
          date: new Date(),
          description: "Order placed successfully.",
          processedBy: "Customer",
        },
      ],
    });

    await newOrder.save({ session });
    await Cart.findOneAndDelete({ user: userId }).session(session);

    await session.commitTransaction();
    session.endSession();

    await notificationQueue.add("notify-roles", {
      type: "notify-roles",
      roles: ["admin", "staff"],
      data: {
        title: "New Order Received 💰",
        message: `Order #${newOrderId} placed by ${
          user.fullname || user.username
        } for $${totalAmount}.`,
        url: `/admin/orders/${newOrder._id}`,
      },
    });

    await notificationQueue.add("push-user", {
      type: "push-user",
      recipientId: userId,
      data: {
        title: "Order Placed ✅",
        message: `We received your order #${newOrderId}.`,
        url: `/profile/orders`,
      },
    });

    await orderProcessingQueue.add(
      "process-order",
      {
        orderId: newOrderId,
        userId: userId,
      },
      { delay: 5000 }
    );

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId: newOrder.orderId,
      order: newOrder,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: "items.product", select: "slug title image category" })
      .select("-steps.processedBy");

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("Fetch User Orders Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "items.product",
      "slug category title image"
    );
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdminOrStaff = ["admin", "staff"].includes(req.user.role);

    if (!isOwner && !isAdminOrStaff)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    if (order.user.toString() !== req.user._id.toString())
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    if (["Shipped", "Delivered"].includes(order.status))
      return res
        .status(400)
        .json({ success: false, message: "Cannot cancel shipped order." });

    const stepData = { date: new Date(), processedBy: "Customer" };

    if (order.status === "Pending") {
      order.status = "Cancelled";
      order.cancelledAt = Date.now();
      order.cancellationReason = reason || "User cancelled";
      order.steps.push({
        ...stepData,
        status: "Cancelled",
        description: "Order cancelled by user.",
      });
      await order.save();
      return res
        .status(200)
        .json({ success: true, message: "Order cancelled." });
    }

    if (order.status === "Processing") {
      order.status = "Cancellation Requested";
      order.cancellationReason = reason;
      order.steps.push({
        ...stepData,
        status: "Cancellation Requested",
        description: `User requested cancellation. Reason: ${reason}`,
      });
      await order.save();

      notificationQueue.add("notify-roles", {
        type: "notify-roles",
        roles: ["admin", "staff"],
        data: {
          title: "Cancellation Request ⚠️",
          message: `User requested cancellation for Order #${order.orderId}`,
          url: `/admin/orders/${order._id}`,
        },
      });

      return res
        .status(200)
        .json({ success: true, message: "Cancellation requested." });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "fullname email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, description } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, message: "Not found" });

    const processedBy =
      req.user.role === "admin"
        ? `Admin (${req.user.fullname})`
        : `Staff (${req.user.fullname})`;

    if (order.status === "Cancellation Requested") {
      if (status === "Cancelled") {
        order.status = "Cancelled";
        order.cancelledAt = Date.now();
        order.steps.push({
          status: "Cancelled",
          date: new Date(),
          description: "Cancellation Request Approved.",
          processedBy,
        });
        await order.save();

        notificationQueue.add("push-user", {
          type: "push-user",
          recipientId: order.user,
          data: {
            title: "Order Cancelled ❌",
            message: `Your cancellation request for #${order.orderId} was approved.`,
            url: `/profile/orders`,
          },
        });

        return res.json({ success: true, message: "Cancellation Approved" });
      }
      if (status === "Processing") {
        order.status = "Processing";
        order.steps.push({
          status: "Processing",
          date: new Date(),
          description: "Cancellation Rejected. Order processing continues.",
          processedBy,
        });
        await order.save();

        notificationQueue.add("push-user", {
          type: "push-user",
          recipientId: order.user,
          data: {
            title: "Cancellation Rejected ⚠️",
            message: `Your request for #${order.orderId} was rejected. Processing continues.`,
            url: `/profile/orders`,
          },
        });

        return res.json({ success: true, message: "Cancellation Rejected" });
      }
    }

    if (status) {
      order.status = status;
      order.steps.push({
        status: status,
        date: new Date(),
        description:
          description ||
          (status === "Shipped" && trackingNumber
            ? `Shipped with tracking: ${trackingNumber}`
            : `Order status updated to ${status}`),
        processedBy,
      });

      let title = `Order Status Update 📦`;
      let message = `Your order #${order.orderId} is now ${status}.`;
      if (status === "Shipped") {
        title = "Order Shipped 🚚";
        message = `Your order #${order.orderId} is on its way!`;
      } else if (status === "Delivered") {
        title = "Order Delivered 🎉";
        message = `Order #${order.orderId} has been delivered. Enjoy!`;
      }

      notificationQueue.add("push-user", {
        type: "push-user",
        recipientId: order.user,
        data: { title, message, url: `/profile/orders` },
      });
    }

    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (status === "Paid" || status === "Refunded")
      order.paymentStatus = status;

    await order.save();
    res.status(200).json({ success: true, message: "Order Updated", order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
