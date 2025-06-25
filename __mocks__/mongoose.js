// Mock mongoose for Jest testing
const mockSchema = jest.fn().mockImplementation(() => ({
  pre: jest.fn(),
  post: jest.fn(),
  methods: {},
  statics: {},
  virtual: jest.fn().mockReturnValue({
    get: jest.fn(),
    set: jest.fn()
  }),
  index: jest.fn(),
  plugin: jest.fn()
}));

// Add static properties to mockSchema
mockSchema.Types = {
  ObjectId: jest.fn((id) => ({ 
    toString: () => id || 'mock-object-id',
    toHexString: () => id || 'mock-object-id'
  })),
  Mixed: {},
  String: String,
  Number: Number,
  Date: Date,
  Buffer: Buffer,
  Boolean: Boolean,
  Array: Array
};

const mockModel = jest.fn().mockImplementation(() => ({
  find: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([])
    }),
    exec: jest.fn().mockResolvedValue([])
  }),
  findOne: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null)
    }),
    exec: jest.fn().mockResolvedValue(null)
  }),
  findById: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null)
    }),
    exec: jest.fn().mockResolvedValue(null)
  }),
  create: jest.fn().mockResolvedValue({ _id: 'mock-id' }),
  findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: 'mock-id' }),
  findByIdAndDelete: jest.fn().mockResolvedValue({ _id: 'mock-id' }),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  countDocuments: jest.fn().mockResolvedValue(0),
  save: jest.fn().mockResolvedValue({ _id: 'mock-id' })
}));

const mockConnection = {
  readyState: 1,
  close: jest.fn().mockResolvedValue(undefined)
};

const mockMongoose = {
  Schema: mockSchema,
  model: jest.fn().mockReturnValue(mockModel),
  models: {}, // Empty models object initially
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  connection: mockConnection,
  Types: {
    ObjectId: Object.assign(
      jest.fn((id) => ({ 
        toString: () => id || 'mock-object-id',
        toHexString: () => id || 'mock-object-id'
      })),
      {
        isValid: jest.fn((id) => {
          // Mock ObjectId validation - return true for 24-character hex strings or specific mock IDs
          return typeof id === 'string' && (id.length === 24 && /^[0-9a-fA-F]+$/.test(id) || id === 'mock-object-id');
        })
      }
    )
  }
};

module.exports = mockMongoose;
