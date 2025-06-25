import { QueueService, QueueJob, QueueError } from '../queueService';
import { Queue, QueueScheduler, Worker } from 'bullmq';
import IORedis from 'ioredis';

// Mock BullMQ and IORedis
jest.mock('bullmq');
jest.mock('ioredis');

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
};

// Mock implementations
const MockQueue = Queue as jest.MockedClass<typeof Queue>;
const MockQueueScheduler = QueueScheduler as jest.MockedClass<typeof QueueScheduler>;
const MockWorker = Worker as jest.MockedClass<typeof Worker>;
const MockIORedis = IORedis as jest.MockedClass<typeof IORedis>;

describe('QueueService', () => {
  let queueService: QueueService;
  let mockQueue: jest.Mocked<Queue>;
  let mockWorker: jest.Mocked<Worker>;
  let mockRedis: jest.Mocked<IORedis>;
  
  // Test data
  const testQueueName = 'test-queue';
  const testJobId = 'job-123';
  const testJobData = { foo: 'bar' };
  const testJob: QueueJob = {
    id: testJobId,
    name: 'test-job',
    data: testJobData,
    timestamp: Date.now(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock Redis instance
    mockRedis = new IORedis() as jest.Mocked<IORedis>;
    MockIORedis.mockImplementation(() => mockRedis);
    
    // Create mock queue instance
    mockQueue = {
      name: testQueueName,
      add: jest.fn().mockResolvedValue({ id: testJobId } as any),
      getJob: jest.fn(),
      getJobs: jest.fn(),
      getJobCounts: jest.fn(),
      pause: jest.fn().mockResolvedValue(undefined),
      resume: jest.fn().mockResolvedValue(undefined),
      clean: jest.fn().mockResolvedValue([]),
      empty: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      removeListener: jest.fn(),
      // Add other Queue methods as needed
    } as unknown as jest.Mocked<Queue>;
    
    // Create mock worker instance
    mockWorker = {
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
      // Add other Worker methods as needed
    } as unknown as jest.Mocked<Worker>;
    
    // Setup mock implementations
    MockQueue.mockImplementation(() => mockQueue);
    MockQueueScheduler.mockImplementation(() => ({} as any));
    MockWorker.mockImplementation(() => mockWorker);
    
    // Create a new instance for each test
    queueService = new QueueService({
      connection: {
        host: 'localhost',
        port: 6379,
      },
      logger: mockLogger as any,
    });
  });
  
  afterEach(async () => {
    await queueService.shutdown();
  });

  describe('initialization', () => {
    it('should initialize with default options', () => {
      expect(queueService).toBeDefined();
      expect(MockQueue).toHaveBeenCalledWith(testQueueName, {
        connection: expect.any(IORedis),
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: 100,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      });
    });
    
    it('should initialize with custom options', () => {
      const customService = new QueueService({
        connection: 'redis://custom:6379',
        defaultQueueName: 'custom-queue',
        defaultJobOptions: {
          attempts: 5,
          removeOnComplete: false,
        },
      });
      
      expect(MockQueue).toHaveBeenCalledWith('custom-queue', {
        connection: 'redis://custom:6379',
        defaultJobOptions: {
          attempts: 5,
          removeOnComplete: false,
        },
      });
    });
  });
  
  describe('job management', () => {
    it('should add a job to the queue', async () => {
      const jobId = await queueService.addJob('test-job', testJobData);
      
      expect(mockQueue.add).toHaveBeenCalledWith(
        'test-job',
        testJobData,
        expect.objectContaining({
          jobId: expect.any(String),
        })
      );
      
      expect(jobId).toBe(testJobId);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Added job to queue',
        expect.objectContaining({
          jobName: 'test-job',
          jobId: testJobId,
        })
      );
    });
    
    it('should add a delayed job', async () => {
      const delay = 5000; // 5 seconds
      
      await queueService.addJob('delayed-job', testJobData, { delay });
      
      expect(mockQueue.add).toHaveBeenCalledWith(
        'delayed-job',
        testJobData,
        expect.objectContaining({
          delay,
        })
      );
    });
    
    it('should get a job by ID', async () => {
      const mockJob = {
        id: testJobId,
        name: 'test-job',
        data: testJobData,
        timestamp: Date.now(),
        isActive: jest.fn().mockReturnValue(true),
        isCompleted: jest.fn().mockReturnValue(false),
        isFailed: jest.fn().mockReturnValue(false),
        isDelayed: jest.fn().mockReturnValue(false),
        isWaiting: jest.fn().mockReturnValue(true),
        getState: jest.fn().mockResolvedValue('waiting'),
      };
      
      mockQueue.getJob.mockResolvedValue(mockJob as any);
      
      const job = await queueService.getJob(testJobId);
      
      expect(mockQueue.getJob).toHaveBeenCalledWith(testJobId);
      expect(job).toEqual(expect.objectContaining({
        id: testJobId,
        name: 'test-job',
        status: 'waiting',
      }));
    });
    
    it('should return null for non-existent job', async () => {
      mockQueue.getJob.mockResolvedValue(null);
      
      const job = await queueService.getJob('non-existent-id');
      
      expect(job).toBeNull();
    });
    
    it('should get job counts', async () => {
      const counts = {
        waiting: 5,
        active: 2,
        completed: 10,
        failed: 1,
        delayed: 3,
        paused: 0,
      };
      
      mockQueue.getJobCounts.mockResolvedValue(counts as any);
      
      const result = await queueService.getJobCounts();
      
      expect(mockQueue.getJobCounts).toHaveBeenCalled();
      expect(result).toEqual(counts);
    });
  });
  
  describe('queue management', () => {
    it('should pause the queue', async () => {
      await queueService.pause();
      
      expect(mockQueue.pause).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Paused queue', { queueName: testQueueName });
    });
    
    it('should resume the queue', async () => {
      await queueService.resume();
      
      expect(mockQueue.resume).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Resumed queue', { queueName: testQueueName });
    });
    
    it('should clean the queue', async () => {
      const removedJobs = [
        { id: 'job-1' },
        { id: 'job-2' },
      ];
      
      mockQueue.clean.mockResolvedValue(removedJobs as any);
      
      const result = await queueService.clean(1000, 'completed');
      
      expect(mockQueue.clean).toHaveBeenCalledWith(1000, 'completed');
      expect(result).toBe(removedJobs.length);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Cleaned jobs from queue',
        expect.objectContaining({
          queueName: testQueueName,
          count: removedJobs.length,
          status: 'completed',
        })
      );
    });
    
    it('should empty the queue', async () => {
      await queueService.empty();
      
      expect(mockQueue.empty).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Emptied queue', { queueName: testQueueName });
    });
  });
  
  describe('worker registration', () => {
    it('should register a worker handler', async () => {
      const handler = jest.fn().mockResolvedValue('result');
      
      await queueService.registerWorker('test-job', handler);
      
      // Simulate job processing
      const processFn = mockWorker.on.mock.calls.find(([event]) => event === 'completed')?.[1] as any;
      expect(processFn).toBeDefined();
      
      // Test the handler
      const job = {
        id: testJobId,
        name: 'test-job',
        data: testJobData,
        progress: jest.fn(),
        log: jest.fn(),
      };
      
      await processFn(job);
      
      expect(handler).toHaveBeenCalledWith(job);
    });
    
    it('should handle worker errors', async () => {
      const error = new Error('Worker error');
      const handler = jest.fn().mockRejectedValue(error);
      
      await queueService.registerWorker('failing-job', handler);
      
      // Simulate job processing
      const errorHandler = mockWorker.on.mock.calls.find(([event]) => event === 'failed')?.[1] as any;
      expect(errorHandler).toBeDefined();
      
      // Test the error handler
      const job = {
        id: testJobId,
        name: 'failing-job',
        data: testJobData,
        attemptsMade: 1,
        opts: { attempts: 3 },
        log: jest.fn(),
      };
      
      await errorHandler(job, error);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Job failed',
        expect.objectContaining({
          jobId: testJobId,
          jobName: 'failing-job',
          error,
          attempts: '1/3',
        })
      );
    });
  });
  
  describe('event handling', () => {
    it('should emit queue events', async () => {
      const eventHandler = jest.fn();
      
      // Listen to events
      queueService.on('waiting', eventHandler);
      
      // Simulate event emission
      const waitHandler = mockQueue.on.mock.calls.find(([event]) => event === 'waiting')?.[1] as any;
      waitHandler({ id: testJobId });
      
      expect(eventHandler).toHaveBeenCalledWith(expect.objectContaining({
        jobId: testJobId,
        queueName: testQueueName,
      }));
    });
    
    it('should remove event listeners', () => {
      const eventHandler = jest.fn();
      
      // Add and then remove listener
      queueService.on('completed', eventHandler);
      queueService.off('completed', eventHandler);
      
      expect(mockQueue.removeListener).toHaveBeenCalledWith('completed', eventHandler);
    });
  });
  
  describe('error handling', () => {
    it('should handle queue errors', async () => {
      const error = new Error('Queue error');
      mockQueue.add.mockRejectedValueOnce(error);
      
      await expect(
        queueService.addJob('failing-job', {})
      ).rejects.toThrow(QueueError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Queue operation failed',
        expect.objectContaining({
          error,
          operation: 'addJob',
        })
      );
    });
    
    it('should handle worker errors', async () => {
      const error = new Error('Worker error');
      
      // Simulate worker error
      const errorHandler = mockWorker.on.mock.calls.find(([event]) => event === 'error')?.[1] as any;
      errorHandler(error);
      
      expect(mockLogger.error).toHaveBeenCalledWith('Worker error', error);
    });
  });
  
  describe('shutdown', () => {
    it('should close queue and worker on shutdown', async () => {
      // Register a worker first
      await queueService.registerWorker('test-job', jest.fn());
      
      await queueService.shutdown();
      
      expect(mockWorker.close).toHaveBeenCalled();
      expect(mockQueue.close).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Shutting down queue service');
    });
    
    it('should handle shutdown errors', async () => {
      const error = new Error('Shutdown error');
      mockQueue.close.mockRejectedValueOnce(error);
      
      await queueService.shutdown();
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error during queue service shutdown',
        error
      );
    });
  });
  
  describe('concurrency control', () => {
    it('should create worker with specified concurrency', async () => {
      const concurrency = 5;
      
      await queueService.registerWorker('concurrent-job', jest.fn(), { concurrency });
      
      expect(MockWorker).toHaveBeenCalledWith(
        testQueueName,
        expect.any(Function),
        expect.objectContaining({
          concurrency,
          connection: expect.any(Object),
        })
      );
    });
  });
  
  describe('job batching', () => {
    it('should add multiple jobs in bulk', async () => {
      const jobs = [
        { name: 'batch-job-1', data: { id: 1 } },
        { name: 'batch-job-2', data: { id: 2 } },
      ];
      
      mockQueue.addBulk = jest.fn().mockResolvedValue([
        { id: 'job-1' },
        { id: 'job-2' },
      ]);
      
      const result = await queueService.addJobs(jobs);
      
      expect(mockQueue.addBulk).toHaveBeenCalledWith(
        jobs.map(job => ({
          name: job.name,
          data: job.data,
          opts: expect.any(Object),
        }))
      );
      
      expect(result).toEqual(['job-1', 'job-2']);
    });
  });
  
  describe('rate limiting', () => {
    it('should respect rate limiting options', async () => {
      const limiter = {
        max: 10,
        duration: 60000, // 1 minute
      };
      
      await queueService.addJob('rate-limited-job', {}, { limiter });
      
      expect(mockQueue.add).toHaveBeenCalledWith(
        'rate-limited-job',
        {},
        expect.objectContaining({
          limiter,
        })
      );
    });
  });
  
  describe('job priorities', () => {
    it('should respect job priority', async () => {
      const priority = 1; // Higher priority
      
      await queueService.addJob('high-priority-job', {}, { priority });
      
      expect(mockQueue.add).toHaveBeenCalledWith(
        'high-priority-job',
        {},
        expect.objectContaining({
          priority,
        })
      );
    });
  });
  
  describe('job progress', () => {
    it('should track job progress', async () => {
      const jobId = 'progress-job';
      const progressData = { current: 50, total: 100 };
      
      const mockJob = {
        id: jobId,
        name: 'progress-job',
        data: {},
        progress: jest.fn().mockResolvedValue(undefined),
      };
      
      mockQueue.getJob.mockResolvedValue(mockJob as any);
      
      await queueService.updateJobProgress(jobId, progressData);
      
      expect(mockQueue.getJob).toHaveBeenCalledWith(jobId);
      expect(mockJob.progress).toHaveBeenCalledWith(progressData);
    });
  });
});
