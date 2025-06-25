// Mock MongoDB for Jest testing
const mockMongoClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  db: jest.fn().mockReturnValue({
    collection: jest.fn().mockReturnValue({
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      }),
      findOne: jest.fn().mockResolvedValue(null),
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 })
    })
  }),
  close: jest.fn().mockResolvedValue(undefined)
};

const mockDb = {
  collection: jest.fn().mockReturnValue({
    find: jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue([])
    }),
    findOne: jest.fn().mockResolvedValue(null),
    insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 })
  })
};

module.exports = {
  MongoClient: jest.fn(() => mockMongoClient),
  Db: jest.fn(() => mockDb),
  ObjectId: jest.fn((id) => ({ 
    toString: () => id || 'mock-object-id',
    toHexString: () => id || 'mock-object-id'
  }))
};
