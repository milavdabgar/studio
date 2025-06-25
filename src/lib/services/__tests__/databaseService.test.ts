import { DatabaseService } from '../databaseService';
import { Pool, PoolClient } from 'pg';
import { mocked } from 'ts-jest/utils';

// Mock the pg module
jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

// Mock the logger
jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('DatabaseService', () => {
  let dbService: DatabaseService;
  let mockPool: jest.Mocked<Pool>;
  let mockClient: jest.Mocked<PoolClient>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new instance for each test
    dbService = new DatabaseService();
    
    // Get the mock pool instance
    mockPool = new Pool() as any;
    
    // Setup mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
      on: jest.fn(),
    } as any;
    
    // Mock pool.connect to return our mock client
    mockPool.connect.mockResolvedValue(mockClient as any);
    
    // Default query response
    mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);
    mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);
  });
  
  afterEach(async () => {
    await dbService.close();
  });

  describe('query', () => {
    it('should execute a query with parameters', async () => {
      const testQuery = 'SELECT * FROM users WHERE id = $1';
      const testParams = [1];
      const expectedRows = [{ id: 1, name: 'Test User' }];
      
      mockPool.query.mockResolvedValueOnce({
        rows: expectedRows,
        rowCount: expectedRows.length,
      } as any);
      
      const result = await dbService.query(testQuery, testParams);
      
      expect(mockPool.query).toHaveBeenCalledWith(testQuery, testParams);
      expect(result.rows).toEqual(expectedRows);
      expect(result.rowCount).toBe(expectedRows.length);
    });
    
    it('should handle query errors', async () => {
      const testQuery = 'INVALID SQL';
      const testError = new Error('SQL error');
      
      mockPool.query.mockRejectedValueOnce(testError);
      
      await expect(dbService.query(testQuery)).rejects.toThrow(testError);
    });
    
    it('should log slow queries', async () => {
      const logger = require('@/lib/logger');
      const slowQueryThreshold = 100; // ms
      
      // Create a new instance with custom config
      dbService = new DatabaseService({
        slowQueryThreshold,
      });
      
      const slowQuery = 'SELECT pg_sleep(0.2)'; // 200ms
      
      // Mock the timing of the query
      const startTime = Date.now();
      mockPool.query.mockImplementationOnce(async () => {
        // Simulate query taking 200ms
        await new Promise(resolve => setTimeout(resolve, 200));
        return { rows: [], rowCount: 0 } as any;
      });
      
      await dbService.query(slowQuery);
      
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow query'),
        expect.objectContaining({
          duration: expect.any(Number),
          query: slowQuery,
        })
      );
    });
  });
  
  describe('transaction', () => {
    it('should execute a transaction successfully', async () => {
      const callback = jest.fn().mockResolvedValue('result');
      
      const result = await dbService.transaction(callback);
      
      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(callback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toBe('result');
    });
    
    it('should rollback on error', async () => {
      const testError = new Error('Transaction failed');
      const callback = jest.fn().mockRejectedValue(testError);
      
      await expect(dbService.transaction(callback)).rejects.toThrow(testError);
      
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
    
    it('should handle client connection errors', async () => {
      const connectionError = new Error('Connection failed');
      mockPool.connect.mockRejectedValueOnce(connectionError);
      
      await expect(dbService.transaction(jest.fn())).rejects.toThrow(connectionError);
    });
  });
  
  describe('connection pooling', () => {
    it('should use connection pool configuration', () => {
      const config = {
        user: 'testuser',
        password: 'testpass',
        host: 'testhost',
        database: 'testdb',
        port: 5433,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };
      
      // Create a new instance with custom config
      dbService = new DatabaseService(config);
      
      expect(Pool).toHaveBeenCalledWith(expect.objectContaining(config));
    });
    
    it('should handle connection pool errors', async () => {
      const poolError = new Error('Pool error');
      mockPool.on.mockImplementation((event, handler) => {
        if (event === 'error') {
          handler(poolError);
        }
      });
      
      const logger = require('@/lib/logger');
      
      // Trigger pool error handling
      dbService = new DatabaseService();
      
      // Wait for the error to be processed
      await new Promise(process.nextTick);
      
      expect(logger.error).toHaveBeenCalledWith(
        'Database pool error:',
        poolError
      );
    });
  });
  
  describe('query building', () => {
    it('should build and execute a SELECT query', async () => {
      const expectedRows = [{ id: 1, name: 'Test' }];
      mockPool.query.mockResolvedValueOnce({
        rows: expectedRows,
        rowCount: expectedRows.length,
      } as any);
      
      const result = await dbService
        .select('*')
        .from('users')
        .where({ active: true })
        .orderBy('created_at', 'DESC')
        .limit(10)
        .execute();
      
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE active = $1 ORDER BY created_at DESC LIMIT 10',
        [true]
      );
      expect(result.rows).toEqual(expectedRows);
    });
    
    it('should build and execute an INSERT query', async () => {
      const insertData = { name: 'New User', email: 'test@example.com' };
      const expectedRow = { id: 1, ...insertData };
      
      mockPool.query.mockResolvedValueOnce({
        rows: [expectedRow],
        rowCount: 1,
      } as any);
      
      const result = await dbService
        .insert('users')
        .values(insertData)
        .returning('*')
        .execute();
      
      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
        ['New User', 'test@example.com']
      );
      expect(result.rows[0]).toEqual(expectedRow);
    });
    
    it('should build and execute an UPDATE query', async () => {
      const updateData = { name: 'Updated Name' };
      const where = { id: 1 };
      
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
      } as any);
      
      const result = await dbService
        .update('users')
        .set(updateData)
        .where(where)
        .execute();
      
      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE users SET name = $1 WHERE id = $2',
        ['Updated Name', 1]
      );
      expect(result.rowCount).toBe(1);
    });
    
    it('should build and execute a DELETE query', async () => {
      const where = { id: 1 };
      
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
      } as any);
      
      const result = await dbService
        .deleteFrom('users')
        .where(where)
        .execute();
      
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = $1',
        [1]
      );
      expect(result.rowCount).toBe(1);
    });
    
    it('should handle complex WHERE conditions', async () => {
      await dbService
        .select('*')
        .from('users')
        .where({
          active: true,
          role: ['admin', 'editor'],
          created_at: dbService.raw('> NOW() - INTERVAL \'7 days\''),
        })
        .where('email IS NOT NULL')
        .execute();
      
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE active = $1 AND role IN ($2, $3) AND created_at > NOW() - INTERVAL \'7 days\' AND email IS NOT NULL',
        [true, 'admin', 'editor']
      );
    });
  });
  
  describe('connection health check', () => {
    it('should check database connection', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ now: new Date() }] } as any);
      
      const isConnected = await dbService.checkConnection();
      
      expect(isConnected).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT NOW()');
    });
    
    it('should detect connection failure', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Connection failed'));
      
      const isConnected = await dbService.checkConnection();
      
      expect(isConnected).toBe(false);
    });
  });
  
  describe('migrations', () => {
    it('should run migrations', async () => {
      const mockMigrationFiles = [
        { name: '001_initial_schema.sql', sql: 'CREATE TABLE...' },
        { name: '002_add_indexes.sql', sql: 'CREATE INDEX...' },
      ];
      
      // Mock file system
      jest.mock('fs/promises', () => ({
        readdir: jest.fn().mockResolvedValue(mockMigrationFiles.map(f => f.name)),
        readFile: jest.fn((path) => {
          const fileName = path.split('/').pop();
          const file = mockMigrationFiles.find(f => f.name === fileName);
          return file?.sql || '';
        }),
      }));
      
      // Mock migration tracking
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // Check migrations table
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 }); // Create migrations table
      mockPool.query.mockResolvedValue({ rowCount: 1 }); // Apply migrations
      
      await dbService.runMigrations();
      
      // Should create migrations table and apply all migrations
      expect(mockPool.query).toHaveBeenCalledWith(
        'CREATE TABLE IF NOT EXISTS migrations (version VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMP DEFAULT NOW())'
      );
      
      // Should apply each migration
      for (const file of mockMigrationFiles) {
        expect(mockPool.query).toHaveBeenCalledWith(file.sql);
        expect(mockPool.query).toHaveBeenCalledWith(
          'INSERT INTO migrations (version) VALUES ($1)',
          [file.name]
        );
      }
    });
  });
});
