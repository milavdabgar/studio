import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import * as cron from 'node-cron';
import * as fs from 'fs-extra';
import * as path from 'path';

interface AutonomousOperation {
  id: string;
  type: 'requirement-parsing' | 'code-generation' | 'test-generation' | 'deployment' | 'monitoring';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  metadata: Record<string, any>;
  logs: string[];
  errors: string[];
}

interface SystemMetrics {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeOperations: number;
  totalOperations: number;
  successRate: number;
  avgResponseTime: number;
}

class AutonomousMonitor {
  private operations: Map<string, AutonomousOperation> = new Map();
  private metrics: SystemMetrics[] = [];
  private io: SocketIOServer;
  private dataDir = './data';

  constructor(io: SocketIOServer) {
    this.io = io;
    this.ensureDataDirectory();
    this.loadPersistedData();
    this.startMetricsCollection();
  }

  private ensureDataDirectory() {
    fs.ensureDirSync(this.dataDir);
  }

  private async loadPersistedData() {
    try {
      const operationsFile = path.join(this.dataDir, 'operations.json');
      const metricsFile = path.join(this.dataDir, 'metrics.json');

      if (await fs.pathExists(operationsFile)) {
        const operationsData = await fs.readJson(operationsFile);
        this.operations = new Map(operationsData);
      }

      if (await fs.pathExists(metricsFile)) {
        this.metrics = await fs.readJson(metricsFile);
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  }

  private async persistData() {
    try {
      const operationsFile = path.join(this.dataDir, 'operations.json');
      const metricsFile = path.join(this.dataDir, 'metrics.json');

      await fs.writeJson(operationsFile, Array.from(this.operations.entries()));
      await fs.writeJson(metricsFile, this.metrics.slice(-1000)); // Keep last 1000 metrics
    } catch (error) {
      console.error('Error persisting data:', error);
    }
  }

  private startMetricsCollection() {
    // Collect metrics every minute
    cron.schedule('* * * * *', () => {
      this.collectSystemMetrics();
    });

    // Persist data every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.persistData();
    });
  }

  private async collectSystemMetrics() {
    const activeOps = Array.from(this.operations.values()).filter(op => op.status === 'in-progress').length;
    const totalOps = this.operations.size;
    const completedOps = Array.from(this.operations.values()).filter(op => op.status === 'completed').length;
    const successRate = totalOps > 0 ? (completedOps / totalOps) * 100 : 0;

    // Calculate average response time
    const completedOperations = Array.from(this.operations.values()).filter(op => op.duration);
    const avgResponseTime = completedOperations.length > 0
      ? completedOperations.reduce((sum, op) => sum + (op.duration || 0), 0) / completedOperations.length
      : 0;

    const metrics: SystemMetrics = {
      timestamp: new Date(),
      cpuUsage: process.cpuUsage ? process.cpuUsage().user / 1000000 : Math.random() * 100, // Convert to percentage
      memoryUsage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
      diskUsage: Math.random() * 100, // Would need actual disk usage calculation
      activeOperations: activeOps,
      totalOperations: totalOps,
      successRate,
      avgResponseTime,
    };

    this.metrics.push(metrics);
    
    // Keep only last 24 hours of metrics (1440 minutes)
    if (this.metrics.length > 1440) {
      this.metrics = this.metrics.slice(-1440);
    }

    // Broadcast metrics to connected clients
    this.io.emit('metrics-update', metrics);
  }

  public startOperation(type: AutonomousOperation['type'], metadata: Record<string, any> = {}): string {
    const id = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const operation: AutonomousOperation = {
      id,
      type,
      status: 'pending',
      startTime: new Date(),
      metadata,
      logs: [],
      errors: [],
    };

    this.operations.set(id, operation);
    this.io.emit('operation-started', operation);
    
    return id;
  }

  public updateOperation(id: string, updates: Partial<AutonomousOperation>) {
    const operation = this.operations.get(id);
    if (!operation) return;

    Object.assign(operation, updates);

    if (updates.status === 'completed' || updates.status === 'failed') {
      operation.endTime = new Date();
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime();
    }

    this.operations.set(id, operation);
    this.io.emit('operation-updated', operation);
  }

  public addLog(id: string, message: string) {
    const operation = this.operations.get(id);
    if (!operation) return;

    operation.logs.push(`[${new Date().toISOString()}] ${message}`);
    this.operations.set(id, operation);
    this.io.emit('operation-log', { id, message });
  }

  public addError(id: string, error: string) {
    const operation = this.operations.get(id);
    if (!operation) return;

    operation.errors.push(`[${new Date().toISOString()}] ${error}`);
    this.operations.set(id, operation);
    this.io.emit('operation-error', { id, error });
  }

  public getOperations(): AutonomousOperation[] {
    return Array.from(this.operations.values()).sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  public getMetrics(): SystemMetrics[] {
    return this.metrics;
  }

  public getSystemSummary() {
    const operations = this.getOperations();
    const recentOps = operations.filter(op => 
      new Date().getTime() - new Date(op.startTime).getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    return {
      totalOperations: operations.length,
      recentOperations: recentOps.length,
      activeOperations: operations.filter(op => op.status === 'in-progress').length,
      successRate: operations.length > 0 ? 
        (operations.filter(op => op.status === 'completed').length / operations.length) * 100 : 0,
      averageResponseTime: operations
        .filter(op => op.duration)
        .reduce((sum, op, _, arr) => sum + (op.duration || 0) / arr.length, 0),
      operationsByType: operations.reduce((acc, op) => {
        acc[op.type] = (acc[op.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentErrors: operations
        .flatMap(op => op.errors)
        .slice(-10), // Last 10 errors
    };
  }
}

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const monitor = new AutonomousMonitor(io);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.get('/api/operations', (req: Request, res: Response) => {
  res.json(monitor.getOperations());
});

app.get('/api/metrics', (req: Request, res: Response) => {
  res.json(monitor.getMetrics());
});

app.get('/api/summary', (req: Request, res: Response) => {
  res.json(monitor.getSystemSummary());
});

app.post('/api/operations', (req: Request, res: Response) => {
  const { type, metadata } = req.body;
  const id = monitor.startOperation(type, metadata);
  res.json({ id });
});

app.patch('/api/operations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  monitor.updateOperation(id, updates);
  res.json({ success: true });
});

app.post('/api/operations/:id/log', (req: Request, res: Response) => {
  const { id } = req.params;
  const { message } = req.body;
  monitor.addLog(id, message);
  res.json({ success: true });
});

app.post('/api/operations/:id/error', (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = req.body;
  monitor.addError(id, error);
  res.json({ success: true });
});

// Socket.IO connection handling
io.on('connection', (socket: any) => {
  console.log('Client connected to monitoring dashboard');
  
  // Send current state to new client
  socket.emit('initial-data', {
    operations: monitor.getOperations(),
    metrics: monitor.getMetrics(),
    summary: monitor.getSystemSummary(),
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected from monitoring dashboard');
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Autonomous Development Monitoring Dashboard running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

// Export for external use
export { monitor };
export default app;