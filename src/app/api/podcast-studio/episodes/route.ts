import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next'
const PODCAST_DB_NAME = process.env.PODCAST_STUDIO_DB || 'gpp-next'

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  return client.db(PODCAST_DB_NAME)
}

// GET - Fetch all episodes or episodes for a specific series
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const seriesId = searchParams.get('seriesId')
    
    const db = await connectToDatabase()
    const filter = seriesId ? { seriesId } : {}
    const episodes = await db.collection('podcast-episodes').find(filter).sort({ publishDate: -1 }).toArray()
    
    return NextResponse.json({ episodes })
  } catch (error) {
    console.error('Failed to fetch episodes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch episodes' },
      { status: 500 }
    )
  }
}

// POST - Create new episode
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const episodeId = `episode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const seriesId = formData.get('seriesId') as string
    
    if (!seriesId) {
      return NextResponse.json(
        { error: 'Series ID is required' },
        { status: 400 }
      )
    }

    const episodeData = {
      id: episodeId,
      seriesId,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      audioUrl: '', // Will be set after file upload
      duration: formData.get('duration') as string || '00:00:00',
      explicit: formData.get('explicit') === 'true',
      season: parseInt(formData.get('season') as string) || 1,
      episode: parseInt(formData.get('episode') as string) || 1,
      publishDate: new Date(formData.get('publishDate') as string),
      tags: (formData.get('tags') as string)?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
      transcript: formData.get('transcript') as string || '',
      fileSize: 0,
      status: 'draft',
      platforms: {
        youtube: { published: false, url: '', status: 'not_published' },
        spotify: { published: false, url: '', status: 'not_published' },
        apple: { published: false, url: '', status: 'not_published' },
        google: { published: false, url: '', status: 'not_published' },
        amazon: { published: false, url: '', status: 'not_published' }
      },
      analytics: {
        downloads: 0,
        listens: 0,
        completionRate: 0,
        avgListenTime: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Handle audio file upload
    const audioFile = formData.get('audioFile') as File
    if (audioFile && audioFile.size > 0) {
      // TODO: Implement file upload to storage service (AWS S3, Google Cloud Storage, etc.)
      // For now, simulate file processing
      episodeData.audioUrl = `/api/podcasts/${seriesId}/episodes/${episodeId}/audio.mp3`
      episodeData.fileSize = audioFile.size
      
      // TODO: Extract actual audio duration using audio processing library
      // For now, use placeholder
      episodeData.duration = '00:25:30' // Default placeholder
    }

    const db = await connectToDatabase()
    
    // Insert episode
    const result = await db.collection('podcast-episodes').insertOne(episodeData)
    
    if (!result.acknowledged) {
      throw new Error('Failed to insert episode')
    }

    // Update series episode count
    await db.collection('podcast-series').updateOne(
      { id: seriesId },
      { 
        $inc: { episodeCount: 1 },
        $set: { updatedAt: new Date() }
      }
    )

    return NextResponse.json({ 
      success: true, 
      episode: episodeData,
      message: 'Episode created successfully' 
    })

  } catch (error) {
    console.error('Failed to create episode:', error)
    return NextResponse.json(
      { error: 'Failed to create episode' },
      { status: 500 }
    )
  }
}

// PUT - Update episode
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData()
    const episodeId = formData.get('id') as string
    
    if (!episodeId) {
      return NextResponse.json(
        { error: 'Episode ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      explicit: formData.get('explicit') === 'true',
      season: parseInt(formData.get('season') as string),
      episode: parseInt(formData.get('episode') as string),
      publishDate: new Date(formData.get('publishDate') as string),
      tags: (formData.get('tags') as string)?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
      transcript: formData.get('transcript') as string || '',
      updatedAt: new Date()
    }

    // Handle audio file upload if provided
    const audioFile = formData.get('audioFile') as File
    if (audioFile && audioFile.size > 0) {
      // TODO: Implement file upload to storage service
      updateData.fileSize = audioFile.size
      // Update duration if new file
      updateData.duration = '00:25:30' // Placeholder
    }

    const db = await connectToDatabase()
    const result = await db.collection('podcast-episodes').updateOne(
      { id: episodeId },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Episode updated successfully' 
    })

  } catch (error) {
    console.error('Failed to update episode:', error)
    return NextResponse.json(
      { error: 'Failed to update episode' },
      { status: 500 }
    )
  }
}

// DELETE - Delete episode
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const episodeId = searchParams.get('id')
    
    if (!episodeId) {
      return NextResponse.json(
        { error: 'Episode ID is required' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    
    // Get episode to find seriesId for updating count
    const episode = await db.collection('podcast-episodes').findOne({ id: episodeId })
    if (!episode) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      )
    }

    const result = await db.collection('podcast-episodes').deleteOne({ id: episodeId })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      )
    }

    // Update series episode count
    await db.collection('podcast-series').updateOne(
      { id: episode.seriesId },
      { 
        $inc: { episodeCount: -1 },
        $set: { updatedAt: new Date() }
      }
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Episode deleted successfully' 
    })

  } catch (error) {
    console.error('Failed to delete episode:', error)
    return NextResponse.json(
      { error: 'Failed to delete episode' },
      { status: 500 }
    )
  }
}