const { Worker } = require("bullmq");
const { connection, notificationQueue } = require("../services/queue");
const Order = require("../models/orderModel");

const orderWorker = new Worker(
  "order-processing-queue",
  async (job) => {
    const { orderId, userId } = job.data;
    console.log(`\n⚙️ [OrderWorker] Processing Order: ${orderId}...`);

    try {
      const order = await Order.findOneAndUpdate(
        { orderId: orderId, status: "Pending" },
        {
          status: "Processing",
          processedByWorker: true,
          $push: {
            steps: {
              status: "Processing",
              date: new Date(),
              description: "Order picked up by warehouse.",
              processedBy: "System Worker",
            },
          },
        },
        { new: true }
      );

      if (order) {
        console.log(`[OrderWorker] ✅ Order ${orderId} moved to PROCESSING.`);

        await notificationQueue.add("push-user", {
          type: "push-user",
          recipientId: userId,
          data: {
            title: "Order Processing ⚙️",
            message: `Your order #${orderId} is being packed.`,
            url: `/profile/orders`,
          },
        });
      } else {
        console.log(`[OrderWorker] ⚠️ Order ${orderId} skipped (Not Pending).`);
      }
    } catch (err) {
      console.error(`[OrderWorker] ❌ Failed:`, err);
      throw err;
    }
  },
  { connection }
);

module.exports = orderWorker;
