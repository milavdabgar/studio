import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!
const PODCAST_DB_NAME = process.env.PODCAST_STUDIO_DB || 'gpp-next'

interface Episode {
  id: string
  title: string
  seriesId: string
  publishDate: string
  status: string
  duration?: string
  analytics?: {
    downloads?: number
    views?: number
    avgListenTime?: string
    completionRate?: number
    platformBreakdown?: Record<string, any>
  }
  linkedCourses?: Array<{
    courseId: string
    courseName: string
    linkType: string
  }>
  platforms?: Record<string, any>
  createdAt: string
}

interface AnalyticsQuery {
  seriesId?: string
  episodeId?: string
  startDate?: string
  endDate?: string
  platform?: string
  metric?: 'downloads' | 'views' | 'duration' | 'engagement' | 'demographics'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query: AnalyticsQuery = {
      seriesId: searchParams.get('seriesId') || undefined,
      episodeId: searchParams.get('episodeId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      platform: searchParams.get('platform') || undefined,
      metric: (searchParams.get('metric') as AnalyticsQuery['metric']) || undefined
    }

    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(PODCAST_DB_NAME)

    // Build analytics data based on request
    const analytics = await generateAnalytics(db, query)
    
    await client.close()

    return NextResponse.json({
      success: true,
      data: analytics,
      query,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Analytics retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    )
  }
}

async function generateAnalytics(db: any, query: AnalyticsQuery) {
  const analytics: any = {
    overview: {},
    episodes: [],
    platforms: {},
    engagement: {},
    demographics: {},
    trends: {}
  }

  // Date range filter
  const dateFilter: any = {}
  if (query.startDate) dateFilter.$gte = new Date(query.startDate)
  if (query.endDate) dateFilter.$lte = new Date(query.endDate)
  const hasDateFilter = Object.keys(dateFilter).length > 0

  // Build match criteria
  const matchCriteria: any = {}
  if (query.seriesId) matchCriteria.seriesId = query.seriesId
  if (query.episodeId) matchCriteria.id = query.episodeId
  if (hasDateFilter) matchCriteria.createdAt = dateFilter

  // Get episodes with analytics
  const episodes: Episode[] = await db.collection('podcast-episodes').find(matchCriteria).toArray()
  
  if (episodes.length === 0) {
    return {
      ...analytics,
      message: 'No episodes found for the specified criteria'
    }
  }

  // Calculate overview metrics
  analytics.overview = {
    totalEpisodes: episodes.length,
    totalDownloads: episodes.reduce((sum: number, ep: Episode) => sum + (ep.analytics?.downloads || 0), 0),
    totalViews: episodes.reduce((sum: number, ep: Episode) => sum + (ep.analytics?.views || 0), 0),
    averageDuration: calculateAverageDuration(episodes),
    publishedEpisodes: episodes.filter((ep: Episode) => ep.status === 'published').length,
    scheduledEpisodes: episodes.filter((ep: Episode) => ep.status === 'scheduled').length,
    draftEpisodes: episodes.filter((ep: Episode) => ep.status === 'draft').length
  }

  // Episode-specific analytics
  analytics.episodes = episodes.map((episode: Episode) => ({
    id: episode.id,
    title: episode.title,
    seriesId: episode.seriesId,
    publishDate: episode.publishDate,
    status: episode.status,
    duration: episode.duration,
    analytics: {
      downloads: episode.analytics?.downloads || 0,
      views: episode.analytics?.views || 0,
      avgListenTime: episode.analytics?.avgListenTime || '00:00',
      completionRate: episode.analytics?.completionRate || 0,
      platformBreakdown: episode.analytics?.platformBreakdown || {}
    },
    linkedCourses: episode.linkedCourses || [],
    platforms: episode.platforms || {}
  }))

  // Platform analytics
  const platformData: any = {}
  episodes.forEach(episode => {
    Object.keys(episode.platforms || {}).forEach(platform => {
      if (!platformData[platform]) {
        platformData[platform] = {
          totalEpisodes: 0,
          publishedEpisodes: 0,
          totalDownloads: 0,
          totalViews: 0,
          avgEngagement: 0
        }
      }
      
      const platformInfo = episode.platforms?.[platform]
      if (platformInfo?.published) {
        platformData[platform].publishedEpisodes++
        platformData[platform].totalDownloads += episode.analytics?.platformBreakdown?.[platform]?.downloads || 0
        platformData[platform].totalViews += episode.analytics?.platformBreakdown?.[platform]?.views || 0
      }
      platformData[platform].totalEpisodes++
    })
  })

  analytics.platforms = platformData

  // Engagement metrics
  analytics.engagement = {
    averageCompletionRate: episodes.reduce((sum, ep) => 
      sum + (ep.analytics?.completionRate || 0), 0) / episodes.length,
    averageListenTime: calculateAverageListenTime(episodes),
    topPerformingEpisodes: episodes
      .sort((a, b) => (b.analytics?.downloads || 0) - (a.analytics?.downloads || 0))
      .slice(0, 5)
      .map(ep => ({
        id: ep.id,
        title: ep.title,
        downloads: ep.analytics?.downloads || 0,
        completionRate: ep.analytics?.completionRate || 0
      })),
    engagementTrends: generateEngagementTrends(episodes)
  }

  // Course integration analytics
  const courseLinkedEpisodes = episodes.filter(ep => ep.linkedCourses && ep.linkedCourses.length > 0)
  analytics.courseIntegration = {
    linkedEpisodes: courseLinkedEpisodes.length,
    totalCourseConnections: courseLinkedEpisodes.reduce((sum, ep) => sum + (ep.linkedCourses?.length || 0), 0),
    topLinkedCourses: getTopLinkedCourses(courseLinkedEpisodes),
    linkTypeDistribution: getLinkTypeDistribution(courseLinkedEpisodes)
  }

  // Time-based trends
  if (!query.episodeId) { // Only for multi-episode analytics
    analytics.trends = {
      downloadsOverTime: generateTimeSeriesData(episodes, 'downloads'),
      episodePublishingTrend: generatePublishingTrend(episodes),
      platformGrowth: generatePlatformGrowthTrend(episodes)
    }
  }

  return analytics
}

function calculateAverageDuration(episodes: any[]): string {
  const totalSeconds = episodes.reduce((sum, ep) => {
    const duration = ep.duration || '00:00'
    const [minutes, seconds] = duration.split(':').map(Number)
    return sum + (minutes * 60 + (seconds || 0))
  }, 0)
  
  const avgSeconds = Math.round(totalSeconds / episodes.length)
  const avgMinutes = Math.floor(avgSeconds / 60)
  const remainingSeconds = avgSeconds % 60
  
  return `${avgMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

function calculateAverageListenTime(episodes: any[]): string {
  const totalListenSeconds = episodes.reduce((sum, ep) => {
    const listenTime = ep.analytics?.avgListenTime || '00:00'
    const [minutes, seconds] = listenTime.split(':').map(Number)
    return sum + (minutes * 60 + (seconds || 0))
  }, 0)
  
  const avgSeconds = Math.round(totalListenSeconds / episodes.length)
  const avgMinutes = Math.floor(avgSeconds / 60)
  const remainingSeconds = avgSeconds % 60
  
  return `${avgMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

function generateEngagementTrends(episodes: any[]) {
  return episodes
    .sort((a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime())
    .map(ep => ({
      date: ep.publishDate,
      downloads: ep.analytics?.downloads || 0,
      completionRate: ep.analytics?.completionRate || 0,
      title: ep.title
    }))
}

function getTopLinkedCourses(episodes: any[]) {
  const courseCount: { [key: string]: { count: number, courseName: string, downloads: number } } = {}
  
  episodes.forEach(episode => {
    episode.linkedCourses?.forEach((course: any) => {
      if (!courseCount[course.courseId]) {
        courseCount[course.courseId] = {
          count: 0,
          courseName: course.courseName,
          downloads: 0
        }
      }
      courseCount[course.courseId].count++
      courseCount[course.courseId].downloads += episode.analytics?.downloads || 0
    })
  })
  
  return Object.entries(courseCount)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 5)
    .map(([courseId, data]) => ({
      courseId,
      ...data
    }))
}

function getLinkTypeDistribution(episodes: any[]) {
  const linkTypes: { [key: string]: number } = {}
  
  episodes.forEach(episode => {
    episode.linkedCourses?.forEach((course: any) => {
      linkTypes[course.linkType] = (linkTypes[course.linkType] || 0) + 1
    })
  })
  
  return linkTypes
}

function generateTimeSeriesData(episodes: any[], metric: string) {
  const timeData: { [key: string]: number } = {}
  
  episodes.forEach(episode => {
    const date = new Date(episode.publishDate || episode.createdAt).toISOString().split('T')[0]
    timeData[date] = (timeData[date] || 0) + (episode.analytics?.[metric] || 0)
  })
  
  return Object.entries(timeData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }))
}

function generatePublishingTrend(episodes: any[]) {
  const monthlyCount: { [key: string]: number } = {}
  
  episodes.forEach(episode => {
    const date = new Date(episode.publishDate || episode.createdAt)
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
    monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1
  })
  
  return Object.entries(monthlyCount)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))
}

function generatePlatformGrowthTrend(episodes: any[]) {
  const platformTrends: { [key: string]: { [key: string]: number } } = {}
  
  episodes.forEach(episode => {
    const date = new Date(episode.publishDate || episode.createdAt).toISOString().split('T')[0]
    Object.keys(episode.platforms || {}).forEach(platform => {
      if (!platformTrends[platform]) platformTrends[platform] = {}
      platformTrends[platform][date] = (platformTrends[platform][date] || 0) + 1
    })
  })
  
  return platformTrends
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { episodeId, event, platform, data, timestamp = new Date() } = body

    if (!episodeId || !event) {
      return NextResponse.json(
        { error: 'Episode ID and event type are required' },
        { status: 400 }
      )
    }

    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(PODCAST_DB_NAME)

    // Record analytics event
    const analyticsEvent = {
      episodeId,
      event, // 'play', 'download', 'complete', 'skip', etc.
      platform,
      data,
      timestamp: new Date(timestamp),
      createdAt: new Date()
    }

    await db.collection('podcast-analytics-events').insertOne(analyticsEvent)

    // Update episode analytics aggregates
    const updateQuery: any = {
      $set: { 'analytics.lastUpdated': new Date() }
    }

    switch (event) {
      case 'download':
        updateQuery.$inc = { 'analytics.downloads': 1 }
        if (platform) {
          updateQuery.$inc[`analytics.platformBreakdown.${platform}.downloads`] = 1
        }
        break
      case 'play':
        updateQuery.$inc = { 'analytics.views': 1 }
        if (platform) {
          updateQuery.$inc[`analytics.platformBreakdown.${platform}.views`] = 1
        }
        break
      case 'complete':
        updateQuery.$inc = { 'analytics.completions': 1 }
        break
    }

    await db.collection('podcast-episodes').updateOne(
      { id: episodeId },
      updateQuery
    )

    await client.close()

    return NextResponse.json({
      success: true,
      message: 'Analytics event recorded successfully',
      eventId: analyticsEvent
    })

  } catch (error) {
    console.error('Analytics event recording error:', error)
    return NextResponse.json(
      { error: 'Failed to record analytics event' },
      { status: 500 }
    )
  }
}