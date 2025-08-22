import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'

const MONGODB_URI = process.env.MONGODB_URI!
const GOOGLE_DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY!
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1q4WfSEztt3vxZex4qhIO8rd1VIjwopYZ'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime: string
  webContentLink?: string
  thumbnailLink?: string
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db('podcast-distribution')
    
    switch (action) {
      case 'sync-now':
        const result = await syncFromGoogleDrive(db)
        await client.close()
        return NextResponse.json(result)
        
      case 'setup-webhook':
        const webhookResult = await setupGoogleDriveWebhook()
        return NextResponse.json(webhookResult)
        
      default:
        await client.close()
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error in podcast sync:', error)
    return NextResponse.json(
      { error: 'Failed to sync podcasts' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'drive-files':
        const files = await fetchGoogleDriveFiles()
        return NextResponse.json({ files })
        
      case 'sync-status':
        const client = new MongoClient(MONGODB_URI)
        await client.connect()
        const db = client.db('podcast-distribution')
        
        const lastSync = await db.collection('sync-logs').findOne(
          {},
          { sort: { timestamp: -1 } }
        )
        
        await client.close()
        return NextResponse.json({ lastSync })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error fetching sync data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

async function fetchGoogleDriveFiles(): Promise<DriveFile[]> {
  try {
    // First get all files in root folder
    let allAudioFiles: DriveFile[] = []
    
    // Function to scan a folder recursively
    async function scanFolder(folderId: string, depth = 0): Promise<DriveFile[]> {
      if (depth > 2) return [] // Prevent infinite recursion
      
      const url = new URL('https://www.googleapis.com/drive/v3/files')
      url.searchParams.set('q', `'${folderId}' in parents`)
      url.searchParams.set('fields', 'files(id,name,mimeType,size,modifiedTime,webContentLink,thumbnailLink)')
      url.searchParams.set('orderBy', 'modifiedTime desc')
      url.searchParams.set('key', GOOGLE_DRIVE_API_KEY)
      
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      const files = data.files || []
      
      // Separate audio files and folders
      const audioFiles = files.filter((file: any) => 
        file.mimeType?.includes('audio') || 
        file.name?.toLowerCase().includes('.m4a') ||
        file.name?.toLowerCase().includes('.mp3') ||
        file.name?.toLowerCase().includes('.wav') ||
        file.name?.toLowerCase().includes('.aac')
      )
      
      const subfolders = files.filter((file: any) => 
        file.mimeType === 'application/vnd.google-apps.folder'
      )
      
      let allFiles = [...audioFiles]
      
      // Recursively scan subfolders
      for (const subfolder of subfolders) {
        const subFiles = await scanFolder(subfolder.id, depth + 1)
        allFiles = [...allFiles, ...subFiles]
      }
      
      return allFiles
    }
    
    return await scanFolder(GOOGLE_DRIVE_FOLDER_ID)
    
  } catch (error) {
    console.error('Error fetching Google Drive files:', error)
    throw error
  }
}

async function syncFromGoogleDrive(db: any) {
  const syncLog = {
    timestamp: new Date(),
    status: 'started',
    filesProcessed: 0,
    newEpisodes: 0,
    errors: [] as string[]
  }
  
  try {
    const driveFiles = await fetchGoogleDriveFiles()
    console.log(`Found ${driveFiles.length} audio files in Google Drive`)
    
    for (const file of driveFiles) {
      try {
        syncLog.filesProcessed++
        
        // Check if episode already exists
        const existingEpisode = await db.collection('episodes').findOne({
          'metadata.driveFileId': file.id
        })
        
        if (existingEpisode) {
          // Update metadata if file was modified
          const fileModified = new Date(file.modifiedTime)
          const episodeCreated = existingEpisode.createdAt
          
          if (fileModified > episodeCreated) {
            await db.collection('episodes').updateOne(
              { 'metadata.driveFileId': file.id },
              {
                $set: {
                  'metadata.lastModified': file.modifiedTime,
                  'metadata.size': file.size,
                  updatedAt: new Date()
                }
              }
            )
          }
          continue
        }
        
        // Create new episode
        const episodeCount = await db.collection('episodes').countDocuments()
        const episodeTitle = generateEpisodeTitle(file.name)
        const episodeDescription = generateEpisodeDescription(file.name)
        
        const episode = {
          title: episodeTitle,
          description: episodeDescription,
          audioUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
          alternateAudioUrl: file.webContentLink,
          episodeNumber: episodeCount + 1,
          season: 1,
          guid: uuidv4(),
          pubDate: new Date().toISOString(),
          createdAt: new Date(),
          status: 'published',
          mimeType: file.mimeType || 'audio/mpeg',
          fileSize: file.size ? parseInt(file.size) : undefined,
          metadata: {
            driveFileId: file.id,
            driveFileName: file.name,
            mimeType: file.mimeType,
            size: file.size,
            lastModified: file.modifiedTime,
            thumbnailLink: file.thumbnailLink
          },
          distribution: {
            platforms: {},
            lastAttempt: null
          }
        }
        
        await db.collection('episodes').insertOne(episode)
        syncLog.newEpisodes++
        
        console.log(`Created new episode: ${episodeTitle}`)
        
        // Auto-distribute to configured platforms
        await autoDistributeEpisode(db, episode)
        
      } catch (error) {
        const errorMsg = `Error processing file ${file.name}: ${error}`
        console.error(errorMsg)
        syncLog.errors.push(errorMsg)
      }
    }
    
    syncLog.status = 'completed'
    
  } catch (error) {
    syncLog.status = 'failed'
    syncLog.errors.push(`Sync failed: ${error}`)
    console.error('Sync failed:', error)
  }
  
  // Save sync log
  await db.collection('sync-logs').insertOne(syncLog)
  
  return syncLog
}

function generateEpisodeTitle(fileName: string): string {
  // Remove file extension
  let title = fileName.replace(/\.[^/.]+$/, '')
  
  // Convert common patterns
  title = title
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim()
  
  // Handle common patterns like "Week 1", "Lecture 01", etc.
  title = title
    .replace(/\bWeek\s+(\d+)/gi, 'Week $1')
    .replace(/\bLecture\s+(\d+)/gi, 'Lecture $1')
    .replace(/\bEpisode\s+(\d+)/gi, 'Episode $1')
    .replace(/\bMlp\b/gi, 'MLP')
  
  return title || 'Untitled Episode'
}

function generateEpisodeDescription(fileName: string): string {
  const title = generateEpisodeTitle(fileName)
  
  const templates = [
    `An AI-generated deep dive conversation exploring ${title.toLowerCase()}. Created with NotebookLM.`,
    `Join us for an insightful discussion about ${title.toLowerCase()}, powered by artificial intelligence.`,
    `Dive deep into ${title.toLowerCase()} with this AI-generated podcast episode from NotebookLM.`,
    `Explore the key concepts and insights of ${title.toLowerCase()} in this engaging AI conversation.`
  ]
  
  // Simple hash to consistently pick the same template for the same file
  const hash = fileName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  return templates[Math.abs(hash) % templates.length]
}

async function autoDistributeEpisode(db: any, episode: any) {
  try {
    const config = await db.collection('config').findOne({ type: 'auto-distribution' })
    
    if (!config?.enabled) {
      return
    }
    
    const enabledPlatforms = config.platforms?.filter((p: any) => p.enabled) || []
    
    if (enabledPlatforms.length === 0) {
      return
    }
    
    // Auto-distribute to YouTube if configured
    if (enabledPlatforms.some((p: any) => p.name === 'youtube')) {
      try {
        await distributeToYouTube(episode)
        
        await db.collection('episodes').updateOne(
          { _id: episode._id },
          {
            $set: {
              'distribution.platforms.youtube': {
                status: 'submitted',
                timestamp: new Date(),
                automated: true
              }
            }
          }
        )
        
      } catch (error) {
        console.error('Auto YouTube distribution failed:', error)
      }
    }
    
    // Log auto-distribution attempt
    await db.collection('distribution-logs').insertOne({
      episodeId: episode._id,
      timestamp: new Date(),
      type: 'auto-distribution',
      platforms: enabledPlatforms.map((p: any) => p.name),
      status: 'attempted'
    })
    
  } catch (error) {
    console.error('Auto-distribution failed:', error)
  }
}

async function distributeToYouTube(episode: any) {
  // This would integrate with the existing YouTube publisher
  // For now, we'll simulate the process
  
  console.log(`Auto-distributing episode "${episode.title}" to YouTube`)
  
  // Here you would call the YouTube API or run the Python script
  // const result = await executeYouTubeUpload(episode)
  
  return {
    platform: 'youtube',
    status: 'submitted',
    timestamp: new Date()
  }
}

async function setupGoogleDriveWebhook() {
  try {
    // Google Drive webhook setup
    const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/podcasts/webhook`
    
    const response = await fetch('https://www.googleapis.com/drive/v3/files/watch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GOOGLE_DRIVE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: uuidv4(),
        type: 'web_hook',
        address: webhookUrl,
        token: process.env.WEBHOOK_VERIFICATION_TOKEN
      })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to setup webhook: ${response.status}`)
    }
    
    const result = await response.json()
    
    return {
      success: true,
      channelId: result.id,
      resourceId: result.resourceId,
      webhookUrl,
      message: 'Webhook setup successfully'
    }
    
  } catch (error) {
    console.error('Webhook setup failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}