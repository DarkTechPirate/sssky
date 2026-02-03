// utils/notification.js

const sendPushNotification = async (userId, data) => {
  console.log(`\n============== 📱 PUSH NOTIFICATION ==============`);
  console.log(`To User ID : ${userId}`);
  console.log(`Title      : ${data.title}`);
  console.log(`Message    : ${data.message}`);
  console.log(`==================================================\n`);
  return true;
};

const sendNotificationToRoles = async (roles, data) => {
  console.log(`\n============== 🛡️ ADMIN/STAFF EMAIL ==============`);
  console.log(`To Roles   : [${roles.join(", ")}]`);
  console.log(`Subject    : ${data.title}`);
  console.log(`Body       : ${data.message}`);
  console.log(`==================================================\n`);
  return true;
};

module.exports = { sendPushNotification, sendNotificationToRoles };
