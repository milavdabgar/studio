import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!
const PODCAST_DB_NAME = process.env.PODCAST_STUDIO_DB || 'gpp-next'

export async function GET(request: NextRequest) {
  try {
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(PODCAST_DB_NAME)
    
    // Get all platform connections for the current user
    const connections = await db.collection('podcast-platform-connections').find({
      userId: 'admin', // In real app, use actual user ID from session
      status: 'connected'
    }).toArray()
    
    await client.close()
    
    // Format response for frontend
    const platformStatus = {
      youtube: { connected: false, user: null, expires: null },
      spotify: { connected: false, user: null, expires: null },
      apple: { connected: false, user: null, expires: null },
      google: { connected: false, user: null, expires: null },
      amazon: { connected: false, user: null, expires: null }
    }
    
    connections.forEach(connection => {
      if (platformStatus[connection.platform as keyof typeof platformStatus]) {
        platformStatus[connection.platform as keyof typeof platformStatus] = {
          connected: true,
          user: connection.userInfo?.name || connection.userInfo?.email || 'Connected User',
          expires: connection.expiresAt
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      connections: platformStatus
    })
    
  } catch (error) {
    console.error('Platform status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check platform status' },
      { status: 500 }
    )
  }
}