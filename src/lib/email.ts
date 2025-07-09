// Email service for sending emails
export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<boolean> => {
  // In a real application, this would send an actual email
  // For now, just return true to indicate success
  console.log(`Sending password reset email to ${email} with token ${resetToken}`);
  return true;
};

const emailService = {
  sendPasswordResetEmail,
};

export default emailService;
