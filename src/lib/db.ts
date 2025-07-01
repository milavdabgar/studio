// Database service mock/stub
export const user = {
  findMany: (args?: any) => Promise.resolve([]),
  findUnique: (args?: any) => Promise.resolve(null),
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
