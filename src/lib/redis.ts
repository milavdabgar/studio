// Redis client mock/stub
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<string>;
  del(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  multi(): RedisClient;
  exec(): Promise<unknown[]>;
}

const mockRedisClient: RedisClient = {
  get: async () => null,
  set: async () => 'OK',
  del: async () => 1,
  expire: async () => 1,
  multi: () => mockRedisClient,
  exec: async () => [],
};

export const createClient = () => mockRedisClient;
export const getClient = () => mockRedisClient;

export default mockRedisClient;
