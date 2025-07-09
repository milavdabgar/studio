import { EventEmitter } from 'events';

export interface QueueJob {
  id: string;
  name: string;
  data: unknown;
  timestamp: number;
  attemptsMade?: number;
  finishedOn?: number;
  processedOn?: number;
  failedReason?: string;
  delay?: number;
  priority?: number;
}

export interface QueueConfig {
  connection?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };
  logger?: {
    info: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    debug: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
  };
  defaultJobOptions?: {
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
    attempts?: number;
    backoff?: {
      type: 'fixed' | 'exponential';
      delay?: number;
    };
    delay?: number;
    priority?: number;
  };
}

export interface JobOptions {
  delay?: number;
  priority?: number;
  attempts?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay?: number;
  };
}

export interface JobCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export class QueueError extends Error {
  constructor(message: string, public code?: string, public jobId?: string) {
    super(message);
    this.name = 'QueueError';
  }
}

export type JobHandler = (job: QueueJob) => Promise<unknown>;

export class QueueService extends EventEmitter {
  private config: QueueConfig;
  private jobs: Map<string, QueueJob> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private workers: Set<NodeJS.Timeout> = new Set();
  private isProcessing = true;
  private isPaused = false;
  private logger: QueueConfig['logger'];

  constructor(config: QueueConfig = {}) {
    super();
    this.config = {
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
      ...config,
    };
    this.logger = config.logger || {
      info: () => {},
      error: () => {},
      debug: () => {},
      warn: () => {},
    };
  }

  async addJob(
    name: string,
    data: unknown,
    options: JobOptions = {}
  ): Promise<string> {
    const jobId = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    
    const job: QueueJob = {
      id: jobId,
      name,
      data,
      timestamp,
      delay: options.delay,
      priority: options.priority || 0,
    };

    this.jobs.set(jobId, job);
    this.logger?.info(`Job ${jobId} added to queue`);
    
    // Schedule job processing
    if (options.delay) {
      setTimeout(() => {
        this.emit('delayed', job);
        this.processJob(job);
      }, options.delay);
    } else {
      this.emit('waiting', job);
      this.processJob(job);
    }

    return jobId;
  }

  async getJob(jobId: string): Promise<QueueJob | null> {
    return this.jobs.get(jobId) || null;
  }

  async getJobCounts(): Promise<JobCounts> {
    const jobs = Array.from(this.jobs.values());
    
    return {
      waiting: jobs.filter(job => !job.processedOn && !job.finishedOn && !job.delay).length,
      active: jobs.filter(job => job.processedOn && !job.finishedOn).length,
      completed: jobs.filter(job => job.finishedOn && !job.failedReason).length,
      failed: jobs.filter(job => job.failedReason).length,
      delayed: jobs.filter(job => job.delay && !job.processedOn).length,
      paused: 0, // We'll track this separately if needed
    };
  }

  async pause(): Promise<void> {
    this.isPaused = true;
    this.logger?.info('Queue paused');
  }

  async resume(): Promise<void> {
    this.isPaused = false;
    this.logger?.info('Queue resumed');
    
    // Process pending jobs
    const pendingJobs = Array.from(this.jobs.values()).filter(
      job => !job.processedOn && !job.finishedOn && !job.delay
    );
    
    for (const job of pendingJobs) {
      this.processJob(job);
    }
  }

  async clean(grace: number, status: 'completed' | 'failed' | 'active'): Promise<string[]> {
    const cutoff = Date.now() - grace;
    const jobsToRemove: string[] = [];
    
    for (const [jobId, job] of this.jobs.entries()) {
      let shouldRemove = false;
      
      switch (status) {
        case 'completed':
          shouldRemove = !!(job.finishedOn && !job.failedReason && job.finishedOn < cutoff);
          break;
        case 'failed':
          shouldRemove = !!(job.failedReason && job.finishedOn && job.finishedOn < cutoff);
          break;
        case 'active':
          shouldRemove = !!(job.processedOn && !job.finishedOn && job.processedOn < cutoff);
          break;
      }
      
      if (shouldRemove) {
        this.jobs.delete(jobId);
        jobsToRemove.push(jobId);
      }
    }
    
    this.logger?.info(`Cleaned ${jobsToRemove.length} ${status} jobs`);
    return jobsToRemove;
  }

  async empty(): Promise<void> {
    const jobCount = this.jobs.size;
    this.jobs.clear();
    this.logger?.info(`Emptied queue, removed ${jobCount} jobs`);
  }

  async registerWorker(jobName: string, handler: JobHandler): Promise<void> {
    this.handlers.set(jobName, handler);
    this.logger?.info(`Worker registered for job type: ${jobName}`);
  }

  private async processJob(job: QueueJob): Promise<void> {
    if (this.isPaused || !this.isProcessing) {
      return;
    }

    const handler = this.handlers.get(job.name);
    if (!handler) {
      this.logger?.warn(`No handler found for job type: ${job.name}`);
      return;
    }

    job.processedOn = Date.now();
    job.attemptsMade = (job.attemptsMade || 0) + 1;
    
    this.emit('active', job);
    this.logger?.debug(`Processing job ${job.id}`);

    try {
      const result = await handler(job);
      job.finishedOn = Date.now();
      
      this.emit('completed', job, result);
      this.logger?.info(`Job ${job.id} completed successfully`);
      
      // Clean up completed job if configured to do so
      if (this.config.defaultJobOptions?.removeOnComplete === true) {
        this.jobs.delete(job.id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      job.failedReason = errorMessage;
      job.finishedOn = Date.now();
      
      this.emit('failed', job, error);
      this.logger?.error(`Job ${job.id} failed: ${errorMessage}`);
      
      // Retry logic
      const maxAttempts = this.config.defaultJobOptions?.attempts || 3;
      if (job.attemptsMade < maxAttempts) {
        // Calculate backoff delay
        const backoff = this.config.defaultJobOptions?.backoff;
        let delay = 1000; // Default 1 second
        
        if (backoff) {
          if (backoff.type === 'exponential') {
            delay = (backoff.delay || 1000) * Math.pow(2, job.attemptsMade - 1);
          } else {
            delay = backoff.delay || 1000;
          }
        }
        
        this.logger?.info(`Retrying job ${job.id} in ${delay}ms (attempt ${job.attemptsMade + 1}/${maxAttempts})`);
        
        setTimeout(() => {
          job.processedOn = undefined;
          job.finishedOn = undefined;
          job.failedReason = undefined;
          this.processJob(job);
        }, delay);
      } else {
        // Max attempts reached, handle failed job cleanup
        if (this.config.defaultJobOptions?.removeOnFail === true) {
          this.jobs.delete(job.id);
        }
      }
    }
  }

  async shutdown(): Promise<void> {
    this.isProcessing = false;
    
    // Clear all timers
    for (const timer of this.workers) {
      clearTimeout(timer);
    }
    this.workers.clear();
    
    // Clear all jobs
    this.jobs.clear();
    
    // Remove all listeners
    this.removeAllListeners();
    
    this.logger?.info('Queue service shutdown complete');
  }

  // Event emitter methods
  on(event: string, listener: (...args: unknown[]) => void): this {
    return super.on(event, listener);
  }

  off(event: string, listener: (...args: unknown[]) => void): this {
    return super.off(event, listener);
  }

  emit(event: string, ...args: unknown[]): boolean {
    return super.emit(event, ...args);
  }

  // Utility methods
  async getWaitingJobs(): Promise<QueueJob[]> {
    return Array.from(this.jobs.values()).filter(
      job => !job.processedOn && !job.finishedOn && !job.delay
    );
  }

  async getActiveJobs(): Promise<QueueJob[]> {
    return Array.from(this.jobs.values()).filter(
      job => job.processedOn && !job.finishedOn
    );
  }

  async getCompletedJobs(): Promise<QueueJob[]> {
    return Array.from(this.jobs.values()).filter(
      job => job.finishedOn && !job.failedReason
    );
  }

  async getFailedJobs(): Promise<QueueJob[]> {
    return Array.from(this.jobs.values()).filter(
      job => job.failedReason
    );
  }
}
