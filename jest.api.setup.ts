// Import existing setup
import './jest.setup';

// Mock MongoDB and Mongoose
jest.mock('@/lib/mongodb', () => ({
  connectMongoose: jest.fn().mockResolvedValue(undefined),
}));

// Mock Mongoose models
jest.mock('@/lib/models', () => {
  const originalModule = jest.requireActual('@/lib/models');
  
  // Mock only the CourseModel
  return {
    ...originalModule,
    CourseModel: {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      countDocuments: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
      aggregate: jest.fn(),
    },
  };
});

// Mock Next.js specific modules
jest.mock('next/server', () => {
  const original = jest.requireActual('next/server');
  return {
    ...original,
    NextResponse: {
      json: jest.fn((data, init) => ({
        ...data,
        status: init?.status || 200,
        headers: { 'content-type': 'application/json' },
      })),
    },
  };
});

// Mock other services that might be used in the API routes
jest.mock('@/lib/api/users', () => ({
  userService: {
    createUser: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    getAllUsers: jest.fn(),
  },
}));

// Mock Mongoose document methods
interface MockDocument {
  _doc: Record<string, any>;
  _id: string;
  [key: string]: any;
}

const mockToObject = jest.fn(function(this: MockDocument) {
  return { ...this._doc, id: this._id };
});

// Setup default mock implementations
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Setup default mock implementations
  const { CourseModel } = require('@/lib/models');
  
  // Default mock for find() - returns empty array
  CourseModel.find.mockResolvedValue([]);
  
  // Default mock for findOne() - returns null (not found)
  CourseModel.findOne.mockResolvedValue(null);
  
  // Default mock for findById() - returns null (not found)
  CourseModel.findById.mockResolvedValue(null);
  
  // Enable chaining for query methods
  const query = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  
  // Apply query methods to find and findOne
  CourseModel.find.mockReturnValue(query);
  CourseModel.findOne.mockReturnValue(query);
  
  // Mock document methods
  const mockCourse = {
    _id: 'mock_id',
  };
  const mockDocument = {
    ...mockCourse,
    _doc: { ...mockCourse },
    save: jest.fn().mockImplementation(function(this: any) {
      return Promise.resolve({
        ...this._doc,
        toObject: mockToObject,
      });
    }),
    toObject: mockToObject,
  } as unknown as Document;
  
  // Setup create mock with proper typing
  CourseModel.create.mockImplementation((data: any) => {
    const doc: MockDocument = {
      ...data,
      _id: 'new_mock_id',
      _doc: { ...data },
      // Use a simple mock for save that doesn't use 'this'
      save: jest.fn().mockResolvedValue({
        ...data,
        _id: 'new_mock_id',
        toObject: mockToObject,
      }),
      toObject: mockToObject,
    };
    return Promise.resolve(doc);
  });
});
