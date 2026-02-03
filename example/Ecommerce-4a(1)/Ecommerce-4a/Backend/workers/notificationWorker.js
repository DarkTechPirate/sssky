const { Worker } = require("bullmq");
const { connection } = require("../services/queue");
const {
  sendPushNotification,
  sendNotificationToRoles,
} = require("../utils/notification");

const notificationWorker = new Worker(
  "notification-queue",
  async (job) => {
    const { type, recipientId, data, roles } = job.data;

    try {
      if (type === "push-user") {
        await sendPushNotification(recipientId, data);
      } else if (type === "notify-roles") {
        await sendNotificationToRoles(roles, data);
      } else {
        console.log("[NotificationWorker] Unknown type", type, job.data);
      }
    } catch (error) {
      console.error(`[NotificationWorker] ❌ Failed:`, error);
      throw error;
    }
  },
  { connection }
);

module.exports = notificationWorker;
