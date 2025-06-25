// Webhook Service
export const sendWebhook = async (url: string, data: any): Promise<void> => {
  // Mock implementation
  console.log(`Sending webhook to ${url}:`, data);
};

export default {
  sendWebhook,
};
