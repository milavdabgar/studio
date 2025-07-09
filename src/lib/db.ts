interface MockUser {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// Database service mock/stub
export const user = {
  findMany: () => Promise.resolve([]),
  findUnique: (args?: { where?: { email?: string; id?: number }, select?: Record<string, boolean> }): Promise<MockUser | null> => Promise.resolve(args?.where?.email ? ({
    id: 1,
    email: args.where.email,
    password: '$2a$10$...',  // Mock hashed password
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  } as MockUser) : null),
  create: (args?: { data?: Record<string, unknown> }) => Promise.resolve({ id: 1, email: 'test@example.com', ...(args?.data as Record<string, unknown>) }),
  update: (args?: { where?: { email?: string; id?: number }, data?: Record<string, unknown> }) => Promise.resolve({ id: 1, ...(args?.data as Record<string, unknown>) }),
  delete: () => Promise.resolve({ id: 1 }),
};

export const assessment = {
  findMany: () => Promise.resolve([]),
  findUnique: () => Promise.resolve(null),
  create: (args?: { data?: Record<string, unknown> }) => Promise.resolve({ id: 1, ...(args?.data as Record<string, unknown>) }),
  update: (args?: { data?: Record<string, unknown> }) => Promise.resolve({ id: 1, ...(args?.data as Record<string, unknown>) }),
  delete: () => Promise.resolve({ id: 1 }),
};

export const db = {
  user,
  assessment,
};

export default db;
