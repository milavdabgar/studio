// Email configuration for GPP Institute
export const EMAIL_CONFIG = {
  // SMTP settings (to be configured with actual values)
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  
  // Default sender addresses
  senders: {
    noreply: 'noreply@gppalanpur.ac.in',
    admin: 'admin@gppalanpur.ac.in',
    info: 'info@gppalanpur.ac.in',
    support: 'support@gppalanpur.ac.in',
  },
  
  // Email templates
  templates: {
    passwordReset: 'password-reset',
    welcome: 'welcome',
    notification: 'notification',
  },
  
  // Institute domain
  instituteDomain: 'gppalanpur.ac.in',
};

// Helper function to generate institute email
export const generateInstituteEmail = (identifier: string): string => {
  return `${identifier.toLowerCase()}@${EMAIL_CONFIG.instituteDomain}`;
};

// Helper function to get default password based on user type
export const getDefaultPassword = (identifier: string): string => {
  // Both students (enrollment numbers) and faculty (staff codes) use their identifier as default password
  return identifier;
};

// Helper function to validate institute email
export const isInstituteEmail = (email: string): boolean => {
  return email.endsWith(`@${EMAIL_CONFIG.instituteDomain}`);
};