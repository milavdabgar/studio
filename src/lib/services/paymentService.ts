import Stripe from 'stripe';

export class PaymentError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  clientSecret: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount: number;
  trialPeriodDays?: number;
  features: string[];
  metadata?: Record<string, string>;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  defaultPaymentMethod?: string;
  metadata?: Record<string, string>;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  cancelAtPeriodEnd: boolean;
  metadata?: Record<string, string>;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'sepa_debit' | 'ideal' | 'paypal';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export class PaymentService {
  private stripe: Stripe;

  constructor(secretKey: string, options?: Stripe.StripeConfig) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
      ...options,
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    options: {
      customerId?: string;
      paymentMethodTypes?: string[];
      description?: string;
      metadata?: Record<string, string>;
      automaticPaymentMethods?: boolean;
    } = {}
  ): Promise<PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        customer: options.customerId,
        payment_method_types: options.paymentMethodTypes || ['card'],
        description: options.description,
        metadata: options.metadata,
        automatic_payment_methods: options.automaticPaymentMethods 
          ? { enabled: true } 
          : undefined,
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status as PaymentIntent['status'],
        clientSecret: paymentIntent.client_secret!,
        customerId: paymentIntent.customer as string,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        paymentMethodId ? { payment_method: paymentMethodId } : {}
      );

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status as PaymentIntent['status'],
        clientSecret: paymentIntent.client_secret!,
        customerId: paymentIntent.customer as string,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async createCustomer(
    email: string,
    options: {
      name?: string;
      phone?: string;
      address?: Customer['address'];
      paymentMethodId?: string;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name: options.name,
        phone: options.phone,
        address: options.address,
        payment_method: options.paymentMethodId,
        metadata: options.metadata,
      });

      return {
        id: customer.id,
        email: customer.email!,
        name: customer.name || undefined,
        phone: customer.phone || undefined,
        address: customer.address as Customer['address'],
        defaultPaymentMethod: customer.default_source as string,
        metadata: customer.metadata,
      };
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async getCustomer(customerId: string): Promise<Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      
      if ('deleted' in customer && customer.deleted) {
        throw new PaymentError('Customer has been deleted', 'customer_deleted');
      }

      const activeCustomer = customer as Stripe.Customer;
      return {
        id: activeCustomer.id,
        email: activeCustomer.email!,
        name: activeCustomer.name || undefined,
        phone: activeCustomer.phone || undefined,
        address: activeCustomer.address as Customer['address'],
        defaultPaymentMethod: activeCustomer.default_source as string,
        metadata: activeCustomer.metadata,
      };
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    options: {
      trialPeriodDays?: number;
      paymentMethodId?: string;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: options.trialPeriodDays,
        default_payment_method: options.paymentMethodId,
        metadata: options.metadata,
        expand: ['latest_invoice.payment_intent'],
      });

      const sub = subscription as Stripe.Subscription;
      return {
        id: sub.id,
        customerId: sub.customer as string,
        planId: priceId,
        status: sub.status as Subscription['status'],
        currentPeriodStart: new Date((sub as Stripe.Subscription & { current_period_start: number }).current_period_start * 1000),
        currentPeriodEnd: new Date((sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000),
        trialStart: sub.trial_start 
          ? new Date(sub.trial_start * 1000) 
          : undefined,
        trialEnd: sub.trial_end 
          ? new Date(sub.trial_end * 1000) 
          : undefined,
        canceledAt: sub.canceled_at 
          ? new Date(sub.canceled_at * 1000) 
          : undefined,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        metadata: subscription.metadata,
      };
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          cancel_at_period_end: !immediately,
          ...(immediately ? { cancel_at: Math.floor(Date.now() / 1000) } : {}),
        }
      );

      const sub = subscription as Stripe.Subscription;
      return {
        id: sub.id,
        customerId: sub.customer as string,
        planId: sub.items.data[0].price.id,
        status: sub.status as Subscription['status'],
        currentPeriodStart: new Date((sub as Stripe.Subscription & { current_period_start: number }).current_period_start * 1000),
        currentPeriodEnd: new Date((sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000),
        trialStart: sub.trial_start 
          ? new Date(sub.trial_start * 1000) 
          : undefined,
        trialEnd: sub.trial_end 
          ? new Date(sub.trial_end * 1000) 
          : undefined,
        canceledAt: sub.canceled_at 
          ? new Date(sub.canceled_at * 1000) 
          : undefined,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        metadata: subscription.metadata,
      };
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async getCustomerPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type as PaymentMethod['type'],
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        } : undefined,
        isDefault: false, // Would need to check against customer's default payment method
      }));
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async createSetupIntent(customerId: string): Promise<{ clientSecret: string }> {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });

      return {
        clientSecret: setupIntent.client_secret!,
      };
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async refund(
    paymentIntentId: string,
    amount?: number,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  ): Promise<{ id: string; amount: number; status: string }> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason,
      });

      return {
        id: refund.id,
        amount: refund.amount,
        status: refund.status as string,
      };
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Promise<Stripe.Event> {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch {
      throw new PaymentError('Invalid webhook signature', 'webhook_error');
    }
  }

  private handleStripeError(error: unknown): PaymentError {
    if (error instanceof Stripe.errors.StripeError) {
      return new PaymentError(
        error.message,
        error.code,
        error.statusCode
      );
    }
    
    return new PaymentError(
      error instanceof Error ? error.message : 'An unknown payment error occurred',
      'unknown_error'
    );
  }
}
