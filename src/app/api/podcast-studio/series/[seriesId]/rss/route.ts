import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!
const PODCAST_DB_NAME = process.env.PODCAST_STUDIO_DB || 'gpp-next'

export async function GET(
  request: NextRequest,
  { params }: { params: { seriesId: string } }
) {
  try {
    const seriesId = params.seriesId
    
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(PODCAST_DB_NAME)
    
    // Get series details
    const series = await db.collection('podcast-series').findOne({ id: seriesId })
    if (!series) {
      await client.close()
      return NextResponse.json({ error: 'Series not found' }, { status: 404 })
    }
    
    // Get published episodes for this series
    const episodes = await db.collection('podcast-episodes').find({
      seriesId: seriesId,
      status: { $in: ['published', 'scheduled'] }
    }).sort({ episodeNumber: -1 }).toArray()
    
    await client.close()
    
    // Generate RSS feed
    const rssXml = generateSeriesRSSFeed(series, episodes)
    
    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    })
    
  } catch (error) {
    console.error('RSS feed generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate RSS feed' },
      { status: 500 }
    )
  }
}

function generateSeriesRSSFeed(series: any, episodes: any[]): string {
  const lastBuildDate = new Date().toUTCString()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  
  const episodeItems = episodes.map(episode => {
    const pubDate = new Date(episode.publishDate || episode.createdAt).toUTCString()
    const episodeUrl = `${baseUrl}/podcast-studio/episodes/${episode.id}`
    const audioUrl = episode.audioUrl
    
    return `
    <item>
      <title><![CDATA[${episode.title}]]></title>
      <description><![CDATA[${episode.description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${episode.id}</guid>
      <link>${episodeUrl}</link>
      <enclosure url="${audioUrl}" type="${episode.mimeType || 'audio/mpeg'}" ${episode.fileSize ? `length="${episode.fileSize}"` : ''} />
      
      <!-- iTunes/Apple Podcasts tags -->
      <itunes:author>${series.author}</itunes:author>
      <itunes:duration>${episode.duration || '00:00:00'}</itunes:duration>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:season>${episode.season || 1}</itunes:season>
      <itunes:episode>${episode.episodeNumber}</itunes:episode>
      <itunes:explicit>${episode.explicit || series.explicit ? 'true' : 'false'}</itunes:explicit>
      ${episode.thumbnail ? `<itunes:image href="${episode.thumbnail}" />` : ''}
      
      <!-- Podcast Index tags -->
      ${episode.transcript ? `<podcast:transcript url="${episode.transcript}" type="text/plain" />` : ''}
      <podcast:season>${episode.season || 1}</podcast:season>
      <podcast:episode>${episode.episodeNumber}</podcast:episode>
      
      <!-- Custom tags -->
      <category>${series.category}</category>
      <language>${series.language}</language>
    </item>`
  }).join('')
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:podcast="https://podcastindex.org/namespace/1.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${series.name}]]></title>
    <description><![CDATA[${series.description}]]></description>
    <link>${series.website}</link>
    <language>${series.language}</language>
    <copyright>${series.copyright || `© ${new Date().getFullYear()} ${series.author}`}</copyright>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <managingEditor>${series.email} (${series.author})</managingEditor>
    <webMaster>${series.email} (${series.author})</webMaster>
    
    <!-- Self-referencing link -->
    <atom:link href="${baseUrl}/api/podcast-studio/series/${series.id}/rss" rel="self" type="application/rss+xml" />
    
    <!-- iTunes/Apple Podcasts tags -->
    <itunes:author>${series.author}</itunes:author>
    <itunes:email>${series.email}</itunes:email>
    <itunes:owner>
      <itunes:name>${series.author}</itunes:name>
      <itunes:email>${series.email}</itunes:email>
    </itunes:owner>
    <itunes:image href="${series.artwork || `${baseUrl}/default-podcast-artwork.jpg`}" />
    <itunes:category text="${series.category}">
      ${series.subcategory ? `<itunes:category text="${series.subcategory}" />` : ''}
    </itunes:category>
    <itunes:explicit>${series.explicit ? 'true' : 'false'}</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <itunes:summary><![CDATA[${series.description}]]></itunes:summary>
    
    <!-- Podcast Index tags -->
    <podcast:locked>no</podcast:locked>
    <podcast:guid>${series.id}</podcast:guid>
    
    <!-- Generator -->
    <generator>Claude Code Podcast Studio</generator>
    
    ${episodeItems}
  </channel>
</rss>`
}