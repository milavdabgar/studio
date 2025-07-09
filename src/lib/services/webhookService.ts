// Webhook Service
export const sendWebhook = async (url: string, data: unknown): Promise<void> => {
  // Mock implementation
  console.log(`Sending webhook to ${url}:`, data);
};

const webhookService = {
  sendWebhook,
};

export default webhookService;
