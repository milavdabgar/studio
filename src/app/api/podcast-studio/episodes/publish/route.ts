import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { google } from 'googleapis'

const MONGODB_URI = process.env.MONGODB_URI!
const PODCAST_DB_NAME = process.env.PODCAST_STUDIO_DB || 'gpp-next'

interface PublishRequest {
  episodeId: string
  platforms: string[]
  seriesId?: string
  publishDate?: string
  metadata?: {
    title?: string
    description?: string
    tags?: string[]
    category?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: PublishRequest = await request.json()
    const { episodeId, platforms, metadata } = body

    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(PODCAST_DB_NAME)

    // Get episode details
    const episode = await db.collection('podcast-episodes').findOne({ id: episodeId })
    if (!episode) {
      await client.close()
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
    }

    // Get series details
    const series = await db.collection('podcast-series').findOne({ id: episode.seriesId })
    if (!series) {
      await client.close()
      return NextResponse.json({ error: 'Series not found' }, { status: 404 })
    }

    const publishResults: Record<string, any> = {}

    // Process each platform
    for (const platform of platforms) {
      try {
        const result = await publishToPlatform(db, episode, series, platform, metadata)
        publishResults[platform] = result
        
        // Update episode platform status
        await db.collection('podcast-episodes').updateOne(
          { id: episodeId },
          {
            $set: {
              [`platforms.${platform}`]: {
                published: result.success,
                publishedAt: result.success ? new Date() : null,
                status: result.status,
                externalId: result.externalId,
                url: result.url,
                error: result.error
              },
              updatedAt: new Date()
            }
          }
        )

      } catch (error) {
        console.error(`Failed to publish to ${platform}:`, error)
        publishResults[platform] = {
          success: false,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Update episode status
    const allSuccess = Object.values(publishResults).every((result: any) => result.success)
    await db.collection('podcast-episodes').updateOne(
      { id: episodeId },
      {
        $set: {
          status: allSuccess ? 'published' : 'partial',
          lastPublishAttempt: new Date()
        }
      }
    )

    await client.close()

    return NextResponse.json({
      success: true,
      episodeId,
      platforms: publishResults,
      allSuccess
    })

  } catch (error) {
    console.error('Episode publishing error:', error)
    return NextResponse.json(
      { error: 'Failed to publish episode' },
      { status: 500 }
    )
  }
}

async function publishToPlatform(
  db: any,
  episode: any,
  series: any,
  platform: string,
  metadata?: any
): Promise<any> {
  // Get platform connection
  const connection = await db.collection('podcast-platform-connections').findOne({
    platform,
    userId: 'admin', // In real app, use actual user ID
    status: 'connected'
  })

  if (!connection) {
    throw new Error(`${platform} not connected`)
  }

  switch (platform) {
    case 'youtube':
      return await publishToYouTube(connection, episode, series, metadata)
      
    case 'spotify':
      return await publishToSpotify(connection, episode, series, metadata)
      
    case 'apple':
      return await publishToApple(connection, episode, series, metadata)
      
    case 'google':
      return await publishToGoogle(connection, episode, series, metadata)
      
    case 'amazon':
      return await publishToAmazon(connection, episode, series, metadata)
      
    default:
      throw new Error(`Publishing to ${platform} not implemented`)
  }
}

async function publishToYouTube(connection: any, episode: any, series: any, metadata?: any) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET
    )
    oauth2Client.setCredentials(connection.tokens.tokens)

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })

    // Download audio file from Google Drive
    const audioBuffer = await downloadAudioFile(episode.audioUrl)
    
    // Create video metadata
    const videoMetadata = {
      snippet: {
        title: metadata?.title || episode.title,
        description: generateYouTubeDescription(episode, series, metadata),
        tags: metadata?.tags || ['podcast', 'audio', series.category?.toLowerCase()],
        categoryId: '22', // Education
        defaultLanguage: series.language || 'en'
      },
      status: {
        privacyStatus: 'public', // or 'unlisted' based on series settings
        selfDeclaredMadeForKids: false
      }
    }

    // Upload video (audio-only)
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: videoMetadata,
      media: {
        body: audioBuffer
      }
    })

    const videoId = response.data.id
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

    // Generate and upload thumbnail
    try {
      const thumbnailBuffer = await generatePodcastThumbnail(episode.title, series)
      await youtube.thumbnails.set({
        videoId: videoId!,
        media: {
          body: thumbnailBuffer
        }
      })
    } catch (thumbError) {
      console.warn('Thumbnail upload failed:', thumbError)
    }

    return {
      success: true,
      status: 'published',
      externalId: videoId,
      url: videoUrl,
      platform: 'youtube'
    }

  } catch (error) {
    console.error('YouTube publishing error:', error)
    return {
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown YouTube error'
    }
  }
}

async function publishToSpotify(connection: any, episode: any, series: any, metadata?: any) {
  // Spotify for Podcasters doesn't have a direct upload API
  // Episodes are distributed via RSS feed
  return {
    success: true,
    status: 'rss_based',
    message: 'Episode will be distributed via RSS feed to Spotify',
    rssUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/podcast-studio/series/${series.id}/rss`
  }
}

async function publishToApple(connection: any, episode: any, series: any, metadata?: any) {
  // Apple Podcasts Connect is RSS-based
  return {
    success: true,
    status: 'rss_based',
    message: 'Episode will be distributed via RSS feed to Apple Podcasts',
    rssUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/podcast-studio/series/${series.id}/rss`
  }
}

async function publishToGoogle(connection: any, episode: any, series: any, metadata?: any) {
  // Google Podcasts is RSS-based
  return {
    success: true,
    status: 'rss_based',
    message: 'Episode will be distributed via RSS feed to Google Podcasts',
    rssUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/podcast-studio/series/${series.id}/rss`
  }
}

async function publishToAmazon(connection: any, episode: any, series: any, metadata?: any) {
  // Amazon Music/Audible is RSS-based
  return {
    success: true,
    status: 'rss_based',
    message: 'Episode will be distributed via RSS feed to Amazon Music',
    rssUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/podcast-studio/series/${series.id}/rss`
  }
}

async function downloadAudioFile(audioUrl: string): Promise<Buffer> {
  const response = await fetch(audioUrl)
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

async function generatePodcastThumbnail(title: string, series: any): Promise<Buffer> {
  // This would use Canvas or similar to generate a thumbnail
  // For now, return a placeholder
  const placeholderThumbnail = Buffer.from('placeholder-thumbnail-data')
  return placeholderThumbnail
}

function generateYouTubeDescription(episode: any, series: any, metadata?: any): string {
  const description = metadata?.description || episode.description
  
  return `${description}

🎧 This is an audio podcast episode from "${series.name}"

📱 Subscribe to our podcast:
• Apple Podcasts: ${series.platforms?.apple?.url || 'Coming Soon'}
• Spotify: ${series.platforms?.spotify?.url || 'Coming Soon'}
• Google Podcasts: ${series.platforms?.google?.url || 'Coming Soon'}

🌐 More episodes: ${series.website}
📧 Contact: ${series.email}

#podcast #${series.category?.toLowerCase()} #research #AI

Generated with Claude Code Podcast Studio`
}