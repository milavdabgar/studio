// Health check endpoint for deployment verification
import type { NextApiRequest, NextApiResponse } from 'next';

type HealthResponse = {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version?: string;
  build?: {
    date?: string;
    commit?: string;
  };
  services: {
    app: 'up' | 'down';
    database?: 'up' | 'down' | 'unknown';
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  const startTime = Date.now();
  
  // Basic health check data
  const healthData: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    build: {
      date: process.env.BUILD_DATE,
      commit: process.env.GIT_COMMIT,
    },
    services: {
      app: 'up',
    },
  };

  // Check database connection if available
  try {
    // Try to import and use database connection
    const { connectToDatabase } = await import('@/lib/mongodb');
    const { db } = await connectToDatabase();
    await db.admin().ping();
    healthData.services.database = 'up';
  } catch (error) {
    console.warn('Database health check failed:', error);
    healthData.services.database = 'down';
    healthData.status = 'unhealthy';
  }

  // Set appropriate status code
  const statusCode = healthData.status === 'healthy' ? 200 : 503;
  
  // Add response time
  const responseTime = Date.now() - startTime;
  
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('X-Response-Time', `${responseTime}ms`);
  res.status(statusCode).json(healthData);
}