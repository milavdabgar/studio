// Database service mock/stub
export const user = {
  findMany: (args?: any) => Promise.resolve([]),
  findUnique: (args?: any) => Promise.resolve(args?.where?.email ? { 
    id: 1, 
    email: args.where.email, 
    password: '$2a$10$...',  // Mock hashed password
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date() 
  } : null),
  create: (args?: any) => Promise.resolve({ id: 1, email: 'test@example.com', ...args?.data }),
  update: (args?: any) => Promise.resolve({ id: 1, ...args?.data }),
  delete: (args?: any) => Promise.resolve({ id: 1 }),
};

export const assessment = {
  findMany: (args?: any) => Promise.resolve([]),
  findUnique: (args?: any) => Promise.resolve(null),
  create: (args?: any) => Promise.resolve({ id: 1, ...args?.data }),
  update: (args?: any) => Promise.resolve({ id: 1, ...args?.data }),
  delete: (args?: any) => Promise.resolve({ id: 1 }),
};

export const db = {
  user,
  assessment,
};

export default db;
