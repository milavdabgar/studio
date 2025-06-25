// Email Service
export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  // Mock implementation
  console.log(`Sending email to ${to}: ${subject}`);
};

export const sendTemplateEmail = async (to: string, template: string, data: any): Promise<void> => {
  // Mock implementation
  console.log(`Sending template email to ${to}: ${template}`);
};

export default {
  sendEmail,
  sendTemplateEmail,
};
