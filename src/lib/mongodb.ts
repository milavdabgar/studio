import { MongoClient, Db } from 'mongodb';
import mongoose from 'mongoose';

// MongoDB connection URI - using localhost by default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next';

// Global MongoDB client for native MongoDB operations
let client: MongoClient | null = null;
let db: Db | null = null;

// MongoDB native client connection
export async function connectToMongoDB(): Promise<{ client: MongoClient; db: Db }> {
  if (client && db) {
    return { client, db };
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('Connected to MongoDB successfully');
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Mongoose connection for ODM operations
let isMongooseConnected = false;

export async function connectMongoose(): Promise<void> {
  if (isMongooseConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isMongooseConnected = true;
    console.log('Mongoose connected to MongoDB successfully');
  } catch (error) {
    console.error('Failed to connect Mongoose to MongoDB:', error);
    throw error;
  }
}

// Close connections
export async function disconnectMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isMongooseConnected = false;
  }
}

// Health check
export async function checkMongoDBConnection(): Promise<boolean> {
  try {
    const { client } = await connectToMongoDB();
    await client.db().admin().ping();
    return true;
  } catch (error) {
    console.error('MongoDB health check failed:', error);
    return false;
  }
}
