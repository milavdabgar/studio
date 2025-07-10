import { PaymentService, PaymentError } from '../paymentService';
import Stripe from 'stripe';

// Mock Stripe
jest.mock('stripe', () => {
  const MockStripe = function() {
    return {
      paymentIntents: {
        create: jest.fn(),
        confirm: jest.fn(),
      },
      customers: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
      subscriptions: {
        create: jest.fn(),
        update: jest.fn(),
      },
      paymentMethods: {
        list: jest.fn(),
      },
      setupIntents: {
        create: jest.fn(),
      },
      refunds: {
        create: jest.fn(),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    };
  };
  
  // Mock the Stripe.errors
  MockStripe.errors = {
    StripeError: class StripeError extends Error {
      public code?: string;
      public statusCode?: number;
      
      constructor(message: string, errorCode?: string, statusCode?: number) {
        super(message);
        this.name = 'StripeError';
        this.code = errorCode;
        this.statusCode = statusCode;
      }
    }
  };
  
  return MockStripe;
});

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockStripe: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(() => {
    jest.clearAllMocks();
    paymentService = new PaymentService('sk_test_123');
    mockStripe = (paymentService as any).stripe; // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        amount: 1000,
        currency: 'usd',
        status: 'requires_payment_method',
        client_secret: 'pi_test123_secret_123',
        customer: 'cus_test123',
        metadata: { orderId: 'order_123' },
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await paymentService.createPaymentIntent(1000, 'usd', {
        customerId: 'cus_test123',
        metadata: { orderId: 'order_123' },
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'usd',
        customer: 'cus_test123',
        payment_method_types: ['card'],
        description: undefined,
        metadata: { orderId: 'order_123' },
        automatic_payment_methods: undefined,
      });

      expect(result).toEqual({
        id: 'pi_test123',
        amount: 1000,
        currency: 'usd',
        status: 'requires_payment_method',
        clientSecret: 'pi_test123_secret_123',
        customerId: 'cus_test123',
        metadata: { orderId: 'order_123' },
      });
    });

    it('should handle Stripe errors and throw PaymentError', async () => {
      const MockedStripe = Stripe as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const stripeError = new MockedStripe.errors.StripeError('Your card was declined.', 'card_declined', 402);
      mockStripe.paymentIntents.create.mockRejectedValue(stripeError);

      await expect(
        paymentService.createPaymentIntent(1000, 'usd')
      ).rejects.toThrow(PaymentError);
    });

    it('should use automatic payment methods when enabled', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        amount: 1000,
        currency: 'usd',
        status: 'requires_payment_method',
        client_secret: 'pi_test123_secret_123',
        customer: null,
        metadata: {},
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await paymentService.createPaymentIntent(1000, 'usd', {
        automaticPaymentMethods: true,
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'usd',
        customer: undefined,
        payment_method_types: ['card'],
        description: undefined,
        metadata: undefined,
        automatic_payment_methods: { enabled: true },
      });
    });
  });

  describe('confirmPaymentIntent', () => {
    it('should confirm a payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        amount: 1000,
        currency: 'usd',
        status: 'succeeded',
        client_secret: 'pi_test123_secret_123',
        customer: 'cus_test123',
        metadata: {},
      };

      mockStripe.paymentIntents.confirm.mockResolvedValue(mockPaymentIntent);

      const result = await paymentService.confirmPaymentIntent('pi_test123', 'pm_test123');

      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith(
        'pi_test123',
        { payment_method: 'pm_test123' }
      );

      expect(result.status).toBe('succeeded');
    });

    it('should confirm payment intent without payment method', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        amount: 1000,
        currency: 'usd',
        status: 'succeeded',
        client_secret: 'pi_test123_secret_123',
        customer: 'cus_test123',
        metadata: {},
      };

      mockStripe.paymentIntents.confirm.mockResolvedValue(mockPaymentIntent);

      await paymentService.confirmPaymentIntent('pi_test123');

      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_test123', {});
    });
  });

  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      const mockCustomer = {
        id: 'cus_test123',
        email: 'test@example.com',
        name: 'Test User',
        phone: null,
        address: null,
        default_source: null,
        metadata: { userId: 'user_123' },
      };

      mockStripe.customers.create.mockResolvedValue(mockCustomer);

      const customerData = {
        name: 'Test User',
        metadata: { userId: 'user_123' },
      };

      const result = await paymentService.createCustomer('test@example.com', customerData);

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        phone: undefined,
        address: undefined,
        payment_method: undefined,
        metadata: { userId: 'user_123' },
      });
      expect(result).toEqual({
        id: 'cus_test123',
        email: 'test@example.com',
        name: 'Test User',
        phone: undefined,
        address: null,
        defaultPaymentMethod: null,
        metadata: { userId: 'user_123' },
      });
    });
  });

  describe('getCustomer', () => {
    it('should retrieve a customer successfully', async () => {
      const mockCustomer = {
        id: 'cus_test123',
        email: 'test@example.com',
        name: 'Test User',
        phone: null,
        address: null,
        default_source: null,
        metadata: {},
      };

      mockStripe.customers.retrieve.mockResolvedValue(mockCustomer);

      const result = await paymentService.getCustomer('cus_test123');

      expect(mockStripe.customers.retrieve).toHaveBeenCalledWith('cus_test123');
      expect(result.id).toBe('cus_test123');
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'active',
        current_period_start: 1625097600,
        current_period_end: 1627776000,
        trial_start: null,
        trial_end: null,
        canceled_at: null,
        cancel_at_period_end: false,
        metadata: {},
        items: {
          data: [{ price: { id: 'price_test123' } }],
        },
      };

      mockStripe.subscriptions.create.mockResolvedValue(mockSubscription);

      const subscriptionOptions = {
        metadata: { planType: 'premium' },
      };

      const result = await paymentService.createSubscription(
        'cus_test123', 
        'price_test123', 
        subscriptionOptions
      );

      expect(result).toEqual({
        id: 'sub_test123',
        customerId: 'cus_test123',
        planId: 'price_test123',
        status: 'active',
        currentPeriodStart: new Date(1625097600 * 1000),
        currentPeriodEnd: new Date(1627776000 * 1000),
        trialStart: undefined,
        trialEnd: undefined,
        canceledAt: undefined,
        cancelAtPeriodEnd: false,
        metadata: {},
      });
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'canceled',
        current_period_start: 1625097600,
        current_period_end: 1627776000,
        trial_start: null,
        trial_end: null,
        canceled_at: 1625097700,
        cancel_at_period_end: false,
        metadata: {},
        items: {
          data: [{ price: { id: 'price_test123' } }],
        },
      };

      mockStripe.subscriptions.update.mockResolvedValue(mockSubscription);

      const result = await paymentService.cancelSubscription('sub_test123');

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_test123', {
        cancel_at_period_end: true,
      });

      expect(result.status).toBe('canceled');
    });

    it('should cancel subscription immediately when specified', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'canceled',
        current_period_start: 1625097600,
        current_period_end: 1627776000,
        trial_start: null,
        trial_end: null,
        canceled_at: 1625097700,
        cancel_at_period_end: false,
        metadata: {},
        items: {
          data: [{ price: { id: 'price_test123' } }],
        },
      };

      mockStripe.subscriptions.update.mockResolvedValue(mockSubscription);

      await paymentService.cancelSubscription('sub_test123', true);

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_test123', {
        cancel_at_period_end: false,
        cancel_at: expect.any(Number),
      });
    });
  });

  describe('getCustomerPaymentMethods', () => {
    it('should retrieve customer payment methods successfully', async () => {
      const mockPaymentMethods = {
        data: [
          {
            id: 'pm_test123',
            type: 'card',
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2025,
            },
          },
        ],
      };

      mockStripe.paymentMethods.list.mockResolvedValue(mockPaymentMethods);

      const result = await paymentService.getCustomerPaymentMethods('cus_test123');

      expect(mockStripe.paymentMethods.list).toHaveBeenCalledWith({
        customer: 'cus_test123',
        type: 'card',
      });

      expect(result).toEqual([
        {
          id: 'pm_test123',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            expMonth: 12,
            expYear: 2025,
          },
          isDefault: false,
        },
      ]);
    });
  });

  describe('createSetupIntent', () => {
    it('should create a setup intent successfully', async () => {
      const mockSetupIntent = {
        client_secret: 'seti_test123_secret_123',
      };

      mockStripe.setupIntents.create.mockResolvedValue(mockSetupIntent);

      const result = await paymentService.createSetupIntent('cus_test123');

      expect(mockStripe.setupIntents.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        payment_method_types: ['card'],
      });

      expect(result).toEqual({
        clientSecret: 'seti_test123_secret_123',
      });
    });
  });

  describe('refund', () => {
    it('should create a refund successfully', async () => {
      const mockRefund = {
        id: 're_test123',
        amount: 1000,
        currency: 'usd',
        payment_intent: 'pi_test123',
        status: 'succeeded',
        reason: 'requested_by_customer',
        metadata: {},
      };

      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await paymentService.refund('pi_test123', 1000, 'requested_by_customer');

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test123',
        amount: 1000,
        reason: 'requested_by_customer',
      });

      expect(result).toEqual({
        id: 're_test123',
        amount: 1000,
        status: 'succeeded',
      });
    });
  });

  describe('constructWebhookEvent', () => {
    it('should construct webhook event successfully', async () => {
      const mockEvent = {
        id: 'evt_test123',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test123' } },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const payload = JSON.stringify({ test: 'data' });
      const signature = 'test_signature';
      const webhookSecret = 'whsec_test123';

      const result = await paymentService.constructWebhookEvent(payload, signature, webhookSecret);

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        webhookSecret
      );

      expect(result).toEqual(mockEvent);
    });

    it('should handle invalid webhook signatures', async () => {
      const error = new Error('Invalid signature');
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw error;
      });

      await expect(
        paymentService.constructWebhookEvent('payload', 'invalid_sig', 'whsec_test123')
      ).rejects.toThrow(PaymentError);
    });
  });

  describe('error handling', () => {
    it('should handle and transform Stripe errors correctly', async () => {
      const MockedStripe = Stripe as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const stripeError = new MockedStripe.errors.StripeError(
        'Your card was declined.',
        'card_declined',
        402
      );

      mockStripe.paymentIntents.create.mockRejectedValue(stripeError);

      await expect(
        paymentService.createPaymentIntent(1000, 'usd')
      ).rejects.toThrow(PaymentError);
    });
  });
});
