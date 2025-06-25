// Stripe mock
const mockStripeInstance = {
  charges: {
    create: jest.fn().mockResolvedValue({ id: 'ch_test', status: 'succeeded' }),
    retrieve: jest.fn().mockResolvedValue({ id: 'ch_test', status: 'succeeded' }),
  },
  customers: {
    create: jest.fn().mockResolvedValue({ id: 'cus_test' }),
    retrieve: jest.fn().mockResolvedValue({ id: 'cus_test' }),
  },
  paymentIntents: {
    create: jest.fn().mockResolvedValue({ id: 'pi_test', status: 'succeeded' }),
    confirm: jest.fn().mockResolvedValue({ id: 'pi_test', status: 'succeeded' }),
  },
};

const Stripe = jest.fn().mockImplementation(() => mockStripeInstance);

module.exports = Stripe;
