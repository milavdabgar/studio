import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next'
const PODCAST_DB_NAME = process.env.PODCAST_STUDIO_DB || 'gpp-next'

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  return client.db(PODCAST_DB_NAME)
}

// GET - Fetch all series
export async function GET() {
  try {
    const db = await connectToDatabase()
    const series = await db.collection('podcast-series').find({}).toArray()
    
    return NextResponse.json({ series })
  } catch (error) {
    console.error('Failed to fetch series:', error)
    return NextResponse.json(
      { error: 'Failed to fetch series' },
      { status: 500 }
    )
  }
}

// POST - Create new series
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const seriesId = `series_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const seriesData = {
      id: seriesId,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      language: formData.get('language') as string || 'en-US',
      author: formData.get('author') as string,
      email: formData.get('email') as string,
      website: formData.get('website') as string,
      explicit: formData.get('explicit') === 'true',
      artwork: '/podcast-artwork-default.jpg', // TODO: Handle file upload
      platforms: {
        youtube: { enabled: false, status: 'not_connected' },
        spotify: { enabled: false, status: 'not_connected' },
        apple: { enabled: false, status: 'not_connected' },
        google: { enabled: false, status: 'not_connected' },
        amazon: { enabled: false, status: 'not_connected' }
      },
      rssUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/podcasts/${seriesId}/feed`,
      episodeCount: 0,
      subscribers: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Handle artwork upload if provided
    const artworkFile = formData.get('artwork') as File
    if (artworkFile && artworkFile.size > 0) {
      // TODO: Implement file upload to storage service
      // For now, use a placeholder
      seriesData.artwork = '/podcast-artwork-placeholder.jpg'
    }

    const db = await connectToDatabase()
    const result = await db.collection('podcast-series').insertOne(seriesData)
    
    if (!result.acknowledged) {
      throw new Error('Failed to insert series')
    }

    return NextResponse.json({ 
      success: true, 
      series: seriesData,
      message: 'Series created successfully' 
    })

  } catch (error) {
    console.error('Failed to create series:', error)
    return NextResponse.json(
      { error: 'Failed to create series' },
      { status: 500 }
    )
  }
}

// PUT - Update series
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData()
    const seriesId = formData.get('id') as string
    
    if (!seriesId) {
      return NextResponse.json(
        { error: 'Series ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      language: formData.get('language') as string,
      author: formData.get('author') as string,
      email: formData.get('email') as string,
      website: formData.get('website') as string,
      explicit: formData.get('explicit') === 'true',
      updatedAt: new Date()
    }

    // Handle artwork upload if provided
    const artworkFile = formData.get('artwork') as File
    if (artworkFile && artworkFile.size > 0) {
      // TODO: Implement file upload to storage service
      updateData.artwork = '/podcast-artwork-updated.jpg'
    }

    const db = await connectToDatabase()
    const result = await db.collection('podcast-series').updateOne(
      { id: seriesId },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Series updated successfully' 
    })

  } catch (error) {
    console.error('Failed to update series:', error)
    return NextResponse.json(
      { error: 'Failed to update series' },
      { status: 500 }
    )
  }
}

// DELETE - Delete series
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const seriesId = searchParams.get('id')
    
    if (!seriesId) {
      return NextResponse.json(
        { error: 'Series ID is required' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    
    // First check if series has episodes
    const episodeCount = await db.collection('podcast-episodes').countDocuments({ seriesId })
    if (episodeCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete series with existing episodes. Delete episodes first.' },
        { status: 400 }
      )
    }

    const result = await db.collection('podcast-series').deleteOne({ id: seriesId })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Series deleted successfully' 
    })

  } catch (error) {
    console.error('Failed to delete series:', error)
    return NextResponse.json(
      { error: 'Failed to delete series' },
      { status: 500 }
    )
  }
}