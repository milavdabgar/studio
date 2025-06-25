// Yup validation mock
const mockSchema = {
  validate: jest.fn().mockResolvedValue({}),
  validateSync: jest.fn().mockReturnValue({}),
  isValid: jest.fn().mockResolvedValue(true),
  isValidSync: jest.fn().mockReturnValue(true),
};

const yup = {
  object: jest.fn().mockReturnValue(mockSchema),
  string: jest.fn().mockReturnValue({
    required: jest.fn().mockReturnThis(),
    email: jest.fn().mockReturnThis(),
    min: jest.fn().mockReturnThis(),
    max: jest.fn().mockReturnThis(),
  }),
  number: jest.fn().mockReturnValue({
    required: jest.fn().mockReturnThis(),
    min: jest.fn().mockReturnThis(),
    max: jest.fn().mockReturnThis(),
  }),
  boolean: jest.fn().mockReturnValue({
    required: jest.fn().mockReturnThis(),
  }),
  array: jest.fn().mockReturnValue({
    required: jest.fn().mockReturnThis(),
    min: jest.fn().mockReturnThis(),
    of: jest.fn().mockReturnThis(),
  }),
  ValidationError: class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ValidationError';
    }
  },
};

module.exports = yup;
