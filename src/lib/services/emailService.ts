// Email Service
// Mock nodemailer since it's not available in this environment
const nodemailer = {
  createTransport: () => ({
    sendMail: () => Promise.resolve({ messageId: 'mock-id' }),
    verify: () => Promise.resolve(true),
    close: () => {}
  }),
  Transporter: class {
    sendMail = () => Promise.resolve({ messageId: 'mock-id' });
    verify = () => Promise.resolve(true);
  }
};

// Add the namespace for type compatibility
declare namespace nodemailer {
  interface Transporter {
    sendMail(options: Record<string, unknown>): Promise<{ messageId: string }>;
    verify(): Promise<boolean>;
    close(): void;
  }
}
import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface TemplateEmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, unknown>;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;
  private templateCache: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(config: EmailConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    this.transporter = nodemailer.createTransport();
    await this.verifyConnection();
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    const mailOptions = {
      from: options.from || this.config.auth.user,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: Array.isArray(options.cc) ? options.cc.join(', ') : options.cc,
      bcc: Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc,
      attachments: options.attachments,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendTemplateEmail(options: TemplateEmailOptions): Promise<void> {
    const template = await this.getTemplate(options.template);
    const html = template(options.data);

    await this.sendEmail({
      to: options.to,
      subject: options.subject,
      html,
      from: options.from,
      cc: options.cc,
      bcc: options.bcc,
    });
  }

  private async getTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    const templatePath = path.join(process.cwd(), 'templates', 'email', `${templateName}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateContent);
    
    this.templateCache.set(templateName, template);
    return template;
  }

  async sendBulkEmail(recipients: string[], options: Omit<EmailOptions, 'to'>): Promise<void> {
    const promises = recipients.map(recipient => 
      this.sendEmail({ ...options, to: recipient })
    );
    
    await Promise.all(promises);
  }

  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
  }
}
