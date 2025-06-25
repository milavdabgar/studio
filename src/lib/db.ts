// Database service mock/stub
export const user = {
  findMany: () => Promise.resolve([]),
  findUnique: () => Promise.resolve(null),
  create: () => Promise.resolve({}),
  update: () => Promise.resolve({}),
  delete: () => Promise.resolve({}),
};

export const assessment = {
  findMany: () => Promise.resolve([]),
  findUnique: () => Promise.resolve(null),
  create: () => Promise.resolve({}),
  update: () => Promise.resolve({}),
  delete: () => Promise.resolve({}),
};

export const db = {
  user,
  assessment,
};

export default db;
