import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'

const MONGODB_URI = process.env.MONGODB_URI!
const GOOGLE_DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY!
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!

interface PodcastEpisode {
  id: string
  title: string
  description: string
  audioUrl: string
  duration?: string
  pubDate: string
  episodeNumber: number
  season: number
  fileSize?: number
  mimeType?: string
  guid: string
  explicit?: boolean
  transcript?: string
  thumbnail?: string
}

interface PodcastFeed {
  title: string
  description: string
  author: string
  email: string
  language: string
  category: string
  subcategory?: string
  website: string
  imageUrl?: string
  explicit: boolean
  copyright: string
  episodes: PodcastEpisode[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'rss'
    
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    
    const db = client.db('podcast-distribution')
    const episodes = await db.collection('episodes').find({}).sort({ episodeNumber: -1 }).toArray()
    const config = await db.collection('config').findOne({ type: 'podcast-feed' })
    
    await client.close()
    
    const feedData: PodcastFeed = {
      title: config?.title || 'AI Generated Insights',
      description: config?.description || 'Deep dive conversations powered by NotebookLM',
      author: config?.author || 'Milav Dabgar',
      email: config?.email || 'mail@milav.in',
      language: config?.language || 'en-US',
      category: config?.category || 'Technology',
      subcategory: config?.subcategory || 'Artificial Intelligence',
      website: config?.website || 'https://milav.in',
      imageUrl: config?.imageUrl || `${config?.website}/podcast-cover.jpg`,
      explicit: config?.explicit || false,
      copyright: config?.copyright || '© 2025 Milav Dabgar',
      episodes: episodes.map(ep => ({
        id: ep._id.toString(),
        title: ep.title,
        description: ep.description,
        audioUrl: ep.audioUrl,
        duration: ep.duration,
        pubDate: ep.pubDate,
        episodeNumber: ep.episodeNumber,
        season: ep.season || 1,
        fileSize: ep.fileSize,
        mimeType: ep.mimeType || 'audio/mpeg',
        guid: ep.guid,
        explicit: ep.explicit || false,
        transcript: ep.transcript,
        thumbnail: ep.thumbnail
      }))
    }
    
    if (format === 'json') {
      return NextResponse.json(feedData)
    }
    
    // Generate RSS XML
    const rssXml = generateRSSFeed(feedData)
    
    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml',
        'Cache-Control': 'public, max-age=3600'
      }
    })
    
  } catch (error) {
    console.error('Error generating podcast feed:', error)
    return NextResponse.json(
      { error: 'Failed to generate podcast feed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body
    
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db('podcast-distribution')
    
    switch (action) {
      case 'add-episode':
        const episode = {
          ...data,
          guid: data.guid || uuidv4(),
          pubDate: data.pubDate || new Date().toISOString(),
          createdAt: new Date(),
          status: 'published'
        }
        await db.collection('episodes').insertOne(episode)
        break
        
      case 'update-config':
        await db.collection('config').updateOne(
          { type: 'podcast-feed' },
          { $set: { ...data, updatedAt: new Date() } },
          { upsert: true }
        )
        break
        
      case 'sync-google-drive':
        const newEpisodes = await syncFromGoogleDrive(db)
        await client.close()
        return NextResponse.json({ success: true, newEpisodes })
        
      default:
        await client.close()
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    await client.close()
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error processing podcast request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

function generateRSSFeed(feedData: PodcastFeed): string {
  const lastBuildDate = new Date().toUTCString()
  
  const episodeItems = feedData.episodes.map(episode => `
    <item>
      <title><![CDATA[${episode.title}]]></title>
      <description><![CDATA[${episode.description}]]></description>
      <pubDate>${new Date(episode.pubDate).toUTCString()}</pubDate>
      <guid isPermaLink="false">${episode.guid}</guid>
      <link>${feedData.website}/podcasts/${episode.id}</link>
      <enclosure url="${episode.audioUrl}" type="${episode.mimeType}" ${episode.fileSize ? `length="${episode.fileSize}"` : ''} />
      <itunes:author>${feedData.author}</itunes:author>
      <itunes:duration>${episode.duration || '00:00:00'}</itunes:duration>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:season>${episode.season}</itunes:season>
      <itunes:episode>${episode.episodeNumber}</itunes:episode>
      <itunes:explicit>${episode.explicit ? 'true' : 'false'}</itunes:explicit>
      ${episode.thumbnail ? `<itunes:image href="${episode.thumbnail}" />` : ''}
      ${episode.transcript ? `<podcast:transcript url="${episode.transcript}" type="text/plain" />` : ''}
    </item>`).join('')
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:podcast="https://podcastindex.org/namespace/1.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title><![CDATA[${feedData.title}]]></title>
    <description><![CDATA[${feedData.description}]]></description>
    <link>${feedData.website}</link>
    <language>${feedData.language}</language>
    <copyright>${feedData.copyright}</copyright>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <managingEditor>${feedData.email} (${feedData.author})</managingEditor>
    <webMaster>${feedData.email} (${feedData.author})</webMaster>
    
    <itunes:author>${feedData.author}</itunes:author>
    <itunes:email>${feedData.email}</itunes:email>
    <itunes:owner>
      <itunes:name>${feedData.author}</itunes:name>
      <itunes:email>${feedData.email}</itunes:email>
    </itunes:owner>
    <itunes:image href="${feedData.imageUrl}" />
    <itunes:category text="${feedData.category}">
      ${feedData.subcategory ? `<itunes:category text="${feedData.subcategory}" />` : ''}
    </itunes:category>
    <itunes:explicit>${feedData.explicit ? 'true' : 'false'}</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    
    ${episodeItems}
  </channel>
</rss>`
}

async function syncFromGoogleDrive(db: any): Promise<number> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${GOOGLE_DRIVE_FOLDER_ID}'+in+parents+and+mimeType+contains+'audio'&key=${GOOGLE_DRIVE_API_KEY}`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Google Drive')
    }
    
    const data = await response.json()
    const driveFiles = data.files || []
    
    let newEpisodes = 0
    
    for (const file of driveFiles) {
      const existingEpisode = await db.collection('episodes').findOne({
        'metadata.driveFileId': file.id
      })
      
      if (!existingEpisode) {
        const episodeCount = await db.collection('episodes').countDocuments()
        
        const episode = {
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
          description: `An AI-generated deep dive conversation exploring ${file.name.replace(/\.[^/.]+$/, '').toLowerCase()}. Created with NotebookLM.`,
          audioUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
          episodeNumber: episodeCount + 1,
          season: 1,
          guid: uuidv4(),
          pubDate: new Date().toISOString(),
          createdAt: new Date(),
          status: 'published',
          metadata: {
            driveFileId: file.id,
            driveFileName: file.name,
            mimeType: file.mimeType,
            size: file.size
          }
        }
        
        await db.collection('episodes').insertOne(episode)
        newEpisodes++
      }
    }
    
    return newEpisodes
    
  } catch (error) {
    console.error('Error syncing from Google Drive:', error)
    return 0
  }
}