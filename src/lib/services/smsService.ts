// SMS Service
export const sendSMS = async (to: string, message: string): Promise<void> => {
  // Mock implementation
  console.log(`Sending SMS to ${to}: ${message}`);
};

export default {
  sendSMS,
};
