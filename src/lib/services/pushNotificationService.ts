// Push Notification Service
export const sendPushNotification = async (userId: string, title: string, _body: string): Promise<void> => {
  // Mock implementation
  console.log(`Sending push notification to ${userId}: ${title}`);
};

export default {
  sendPushNotification,
};
