import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!
const WEBHOOK_VERIFICATION_TOKEN = process.env.WEBHOOK_VERIFICATION_TOKEN!

export async function POST(request: NextRequest) {
  try {
    // Verify webhook token
    const token = request.headers.get('x-goog-channel-token')
    if (token !== WEBHOOK_VERIFICATION_TOKEN) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    // Get webhook headers
    const channelId = request.headers.get('x-goog-channel-id')
    const resourceId = request.headers.get('x-goog-resource-id')
    const resourceState = request.headers.get('x-goog-resource-state')
    const resourceUri = request.headers.get('x-goog-resource-uri')
    
    console.log('Google Drive webhook received:', {
      channelId,
      resourceId,
      resourceState,
      resourceUri
    })
    
    // Process different webhook events
    if (resourceState === 'update' || resourceState === 'exists') {
      await handleDriveUpdate()
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleDriveUpdate() {
  try {
    console.log('Processing Google Drive update...')
    
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db('podcast-distribution')
    
    // Trigger sync with a small delay to avoid rate limiting
    setTimeout(async () => {
      try {
        const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/podcasts/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'sync-now' })
        })
        
        const result = await syncResponse.json()
        
        // Log webhook trigger
        await db.collection('webhook-logs').insertOne({
          timestamp: new Date(),
          event: 'drive-update',
          syncResult: result,
          newEpisodes: result.newEpisodes || 0
        })
        
        console.log('Webhook sync completed:', result)
        
      } catch (error) {
        console.error('Webhook sync failed:', error)
        
        await db.collection('webhook-logs').insertOne({
          timestamp: new Date(),
          event: 'drive-update',
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'failed'
        })
      } finally {
        await client.close()
      }
    }, 2000) // 2-second delay
    
  } catch (error) {
    console.error('Error handling drive update:', error)
  }
}