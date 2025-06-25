import { PaymentService, PaymentError, PaymentIntent, SubscriptionPlan } from '../paymentService';
import Stripe from 'stripe';

// Mock Stripe
jest.mock('stripe');
const MockStripe = Stripe as jest.MockedClass<typeof Stripe>;

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
};

// Mock database
const mockDb = {
  users: {
    findById: jest.fn(),
    update: jest.fn(),
  },
  payments: {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
  },
  subscriptions: {
    create: jest.fn(),
    update: jest.fn(),
    findByUserId: jest.fn(),
  },
};

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockStripe: jest.Mocked<Stripe>;
  
  // Test data
  const testUserId = 'user-123';
  const testCustomerId = 'cus_test123';
  const testPaymentMethodId = 'pm_test123';
  const testSubscriptionId = 'sub_test123';
  const testInvoiceId = 'in_test123';
  const testPaymentIntentId = 'pi_test123';
  
  const testUser = {
    id: testUserId,
    email: 'test@example.com',
    name: 'Test User',
    payment: {
      customerId: testCustomerId,
    },
  };
  
  const testPlan: SubscriptionPlan = {
    id: 'pro-monthly',
    name: 'Pro Monthly',
    price: 2999, // $29.99
    currency: 'usd',
    interval: 'month',
    features: ['feature1', 'feature2'],
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new mock Stripe instance
    mockStripe = {
      customers: {
        create: jest.fn().mockResolvedValue({ id: testCustomerId }),
        retrieve: jest.fn().mockResolvedValue({ id: testCustomerId, email: testUser.email }),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
        createSource: jest.fn(),
        deleteSource: jest.fn(),
        listPaymentMethods: jest.fn(),
        createTaxId: jest.fn(),
        deleteTaxId: jest.fn(),
        listTaxIds: jest.fn(),
        retrievePaymentMethod: jest.fn(),
      },
      paymentIntents: {
        create: jest.fn().mockResolvedValue({
          id: testPaymentIntentId,
          client_secret: 'pi_test123_secret_test',
          status: 'requires_payment_method',
          amount: 1000,
          currency: 'usd',
        }),
        retrieve: jest.fn(),
        update: jest.fn(),
        confirm: jest.fn(),
        capture: jest.fn(),
        cancel: jest.fn(),
        list: jest.fn(),
      },
      paymentMethods: {
        attach: jest.fn().mockResolvedValue({ id: testPaymentMethodId }),
        detach: jest.fn().mockResolvedValue({}),
        retrieve: jest.fn(),
        list: jest.fn(),
      },
      subscriptions: {
        create: jest.fn().mockResolvedValue({
          id: testSubscriptionId,
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
          items: {
            data: [{
              price: { id: testPlan.id },
            }],
          },
        }),
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn().mockResolvedValue({ id: testSubscriptionId, status: 'canceled' }),
        list: jest.fn(),
        del: jest.fn(),
      },
      invoices: {
        create: jest.fn().mockResolvedValue({ id: testInvoiceId, hosted_invoice_url: 'https://invoice.stripe.com/test' }),
        retrieve: jest.fn(),
        upcoming: jest.fn(),
        list: jest.fn(),
        pay: jest.fn().mockResolvedValue({ id: testInvoiceId, paid: true }),
        voidInvoice: jest.fn(),
        finalizeInvoice: jest.fn(),
        sendInvoice: jest.fn(),
      },
      refunds: {
        create: jest.fn().mockResolvedValue({ id: 're_test123', status: 'succeeded' }),
        retrieve: jest.fn(),
        update: jest.fn(),
        list: jest.fn(),
        cancel: jest.fn(),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    } as unknown as jest.Mocked<Stripe>;
    
    // Mock the Stripe constructor to return our mock instance
    MockStripe.mockImplementation(() => mockStripe);
    
    // Create a new instance for each test
    paymentService = new PaymentService({
      stripeSecretKey: 'sk_test_123',
      webhookSecret: 'whsec_test',
      logger: mockLogger as any,
      db: mockDb as any,
    });
    
    // Setup default mock implementations
    mockDb.users.findById.mockResolvedValue(testUser);
    mockDb.payments.create.mockImplementation((data) => Promise.resolve({ id: 'pay_123', ...data }));
    mockDb.subscriptions.create.mockImplementation((data) => Promise.resolve({ id: 'sub_123', ...data }));
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('customer management', () => {
    it('should create a new customer', async () => {
      const customer = await paymentService.createCustomer({
        email: 'new@example.com',
        name: 'New User',
        metadata: { userId: 'user-456' },
      });
      
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        name: 'New User',
        metadata: { userId: 'user-456' },
      });
      
      expect(customer.id).toBe(testCustomerId);
    });
    
    it('should retrieve an existing customer', async () => {
      const customer = await paymentService.getCustomer(testCustomerId);
      
      expect(mockStripe.customers.retrieve).toHaveBeenCalledWith(testCustomerId);
      expect(customer.id).toBe(testCustomerId);
    });
    
    it('should update a customer', async () => {
      const updates = { name: 'Updated Name', email: 'updated@example.com' };
      await paymentService.updateCustomer(testCustomerId, updates);
      
      expect(mockStripe.customers.update).toHaveBeenCalledWith(testCustomerId, updates);
    });
    
    it('should delete a customer', async () => {
      await paymentService.deleteCustomer(testCustomerId);
      
      expect(mockStripe.customers.del).toHaveBeenCalledWith(testCustomerId);
    });
  });
  
  describe('payment methods', () => {
    it('should attach a payment method to a customer', async () => {
      await paymentService.attachPaymentMethod(testPaymentMethodId, testCustomerId);
      
      expect(mockStripe.paymentMethods.attach).toHaveBeenCalledWith(testPaymentMethodId, {
        customer: testCustomerId,
      });
      
      expect(mockStripe.customers.update).toHaveBeenCalledWith(testCustomerId, {
        invoice_settings: {
          default_payment_method: testPaymentMethodId,
        },
      });
    });
    
    it('should detach a payment method', async () => {
      await paymentService.detachPaymentMethod(testPaymentMethodId);
      
      expect(mockStripe.paymentMethods.detach).toHaveBeenCalledWith(testPaymentMethodId);
    });
    
    it('should list payment methods for a customer', async () => {
      const paymentMethods = [
        { id: 'pm_1', card: { last4: '4242', brand: 'visa' } },
        { id: 'pm_2', card: { last4: '5555', brand: 'mastercard' } },
      ];
      
      mockStripe.paymentMethods.list = jest.fn().mockResolvedValue({
        data: paymentMethods,
        has_more: false,
      });
      
      const result = await paymentService.listPaymentMethods(testCustomerId);
      
      expect(mockStripe.paymentMethods.list).toHaveBeenCalledWith({
        customer: testCustomerId,
        type: 'card',
      });
      
      expect(result).toEqual(paymentMethods);
    });
  });
  
  describe('payment intents', () => {
    it('should create a payment intent', async () => {
      const amount = 1000; // $10.00
      const paymentIntent = await paymentService.createPaymentIntent({
        amount,
        currency: 'usd',
        customer: testCustomerId,
        metadata: { orderId: 'order_123' },
      });
      
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount,
        currency: 'usd',
        customer: testCustomerId,
        metadata: { orderId: 'order_123' },
        automatic_payment_methods: { enabled: true },
      });
      
      expect(paymentIntent.id).toBe(testPaymentIntentId);
      expect(paymentIntent.client_secret).toBe('pi_test123_secret_test');
    });
    
    it('should confirm a payment intent', async () => {
      const paymentMethodId = 'pm_test456';
      await paymentService.confirmPaymentIntent(testPaymentIntentId, paymentMethodId);
      
      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith(testPaymentIntentId, {
        payment_method: paymentMethodId,
      });
    });
    
    it('should handle payment intent errors', async () => {
      const error = new Error('Payment failed');
      mockStripe.paymentIntents.create.mockRejectedValueOnce(error);
      
      await expect(
        paymentService.createPaymentIntent({ amount: 1000, currency: 'usd' })
      ).rejects.toThrow(PaymentError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating payment intent',
        expect.any(Error)
      );
    });
  });
  
  describe('subscriptions', () => {
    it('should create a subscription', async () => {
      const subscription = await paymentService.createSubscription({
        customer: testCustomerId,
        priceId: testPlan.id,
        paymentMethodId: testPaymentMethodId,
        metadata: { userId: testUserId },
      });
      
      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith({
        customer: testCustomerId,
        items: [{ price: testPlan.id }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: { userId: testUserId },
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
      });
      
      expect(subscription.id).toBe(testSubscriptionId);
    });
    
    it('should cancel a subscription', async () => {
      const subscriptionId = 'sub_123';
      await paymentService.cancelSubscription(subscriptionId);
      
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith(subscriptionId);
    });
    
    it('should update a subscription', async () => {
      const subscriptionId = 'sub_123';
      const updates = {
        cancel_at_period_end: true,
        metadata: { updated: true },
      };
      
      await paymentService.updateSubscription(subscriptionId, updates);
      
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        subscriptionId,
        updates
      );
    });
    
    it('should list subscriptions', async () => {
      const subscriptions = [
        { id: 'sub_1', status: 'active' },
        { id: 'sub_2', status: 'canceled' },
      ];
      
      mockStripe.subscriptions.list = jest.fn().mockResolvedValue({
        data: subscriptions,
        has_more: false,
      });
      
      const result = await paymentService.listSubscriptions({
        customer: testCustomerId,
        status: 'all',
      });
      
      expect(mockStripe.subscriptions.list).toHaveBeenCalledWith({
        customer: testCustomerId,
        status: 'all',
      });
      
      expect(result).toEqual(subscriptions);
    });
  });
  
  describe('invoices', () => {
    it('should create an invoice', async () => {
      const invoice = await paymentService.createInvoice({
        customer: testCustomerId,
        description: 'Test invoice',
        metadata: { orderId: 'order_123' },
      });
      
      expect(mockStripe.invoices.create).toHaveBeenCalledWith({
        customer: testCustomerId,
        description: 'Test invoice',
        metadata: { orderId: 'order_123' },
        auto_advance: true,
      });
      
      expect(invoice.id).toBe(testInvoiceId);
    });
    
    it('should pay an invoice', async () => {
      const paidInvoice = await paymentService.payInvoice(testInvoiceId);
      
      expect(mockStripe.invoices.pay).toHaveBeenCalledWith(testInvoiceId, {
        paid_out_of_band: false,
      });
      
      expect(paidInvoice.paid).toBe(true);
    });
    
    it('should retrieve an upcoming invoice', async () => {
      const upcomingInvoice = {
        id: 'in_upcoming',
        amount_due: 2999,
        currency: 'usd',
      };
      
      mockStripe.invoices.retrieveUpcoming = jest.fn().mockResolvedValue(upcomingInvoice);
      
      const result = await paymentService.getUpcomingInvoice({
        customer: testCustomerId,
        subscription: testSubscriptionId,
      });
      
      expect(mockStripe.invoices.retrieveUpcoming).toHaveBeenCalledWith({
        customer: testCustomerId,
        subscription: testSubscriptionId,
      });
      
      expect(result).toEqual(upcomingInvoice);
    });
  });
  
  describe('refunds', () => {
    it('should create a refund', async () => {
      const paymentIntentId = 'pi_refund_test';
      const reason = 'requested_by_customer';
      
      const refund = await paymentService.createRefund({
        paymentIntent: paymentIntentId,
        amount: 1000,
        reason,
      });
      
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: paymentIntentId,
        amount: 1000,
        reason,
      });
      
      expect(refund.status).toBe('succeeded');
    });
  });
  
  describe('webhook handling', () => {
    const testPayload = 'test-payload';
    const testSignature = 'test-signature';
    
    it('should construct a webhook event', async () => {
      const testEvent = { type: 'payment_intent.succeeded', data: { object: {} } };
      mockStripe.webhooks.constructEvent.mockReturnValue(testEvent);
      
      const event = await paymentService.constructWebhookEvent(
        testPayload,
        testSignature
      );
      
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        testPayload,
        testSignature,
        'whsec_test'
      );
      
      expect(event).toEqual(testEvent);
    });
    
    it('should handle invalid webhook signatures', async () => {
      const error = new Error('Invalid signature');
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw error;
      });
      
      await expect(
        paymentService.constructWebhookEvent(testPayload, 'invalid-signature')
      ).rejects.toThrow(PaymentError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Webhook signature verification failed',
        error
      );
    });
  });
  
  describe('error handling', () => {
    it('should handle Stripe errors', async () => {
      const stripeError = {
        type: 'StripeCardError',
        code: 'card_declined',
        decline_code: 'insufficient_funds',
        message: 'Not enough balance',
      };
      
      mockStripe.paymentIntents.create.mockRejectedValueOnce(stripeError);
      
      await expect(
        paymentService.createPaymentIntent({ amount: 1000, currency: 'usd' })
      ).rejects.toThrow(PaymentError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Stripe API error',
        expect.objectContaining({
          type: 'StripeCardError',
          code: 'card_declined',
        })
      );
    });
    
    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockStripe.customers.create.mockRejectedValueOnce(networkError);
      
      await expect(
        paymentService.createCustomer({ email: 'test@example.com' })
      ).rejects.toThrow(PaymentError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Payment service error',
        networkError
      );
    });
  });
  
  describe('idempotency', () => {
    it('should use idempotency keys for non-idempotent operations', async () => {
      const idempotencyKey = 'test-key-123';
      
      await paymentService.createPaymentIntent(
        { amount: 1000, currency: 'usd' },
        { idempotencyKey }
      );
      
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.any(Object),
        { idempotencyKey }
      );
    });
  });
  
  describe('retry logic', () => {
    it('should retry on rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).type = 'StripeRateLimitError';
      
      // Fail first time with rate limit, then succeed
      mockStripe.paymentIntents.create
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ id: testPaymentIntentId } as any);
      
      await paymentService.createPaymentIntent({ amount: 1000, currency: 'usd' });
      
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledTimes(2);
    });
    
    it('should give up after max retries', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).type = 'StripeRateLimitError';
      
      // Always fail with rate limit
      mockStripe.paymentIntents.create.mockRejectedValue(rateLimitError);
      
      await expect(
        paymentService.createPaymentIntent(
          { amount: 1000, currency: 'usd' },
          { maxRetries: 2 }
        )
      ).rejects.toThrow(PaymentError);
      
      // Should try 3 times (initial + 2 retries)
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledTimes(3);
    });
  });
});
