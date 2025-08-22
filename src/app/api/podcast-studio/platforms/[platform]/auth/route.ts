import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!
const PODCAST_DB_NAME = process.env.PODCAST_STUDIO_DB || 'gpp-next'

// Platform OAuth configurations
const PLATFORM_CONFIGS = {
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID!,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/podcast-studio/platforms/youtube/callback`,
    scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/podcast-studio/platforms/spotify/callback`,
    scopes: ['user-read-email', 'user-read-private'],
    authUrl: 'https://accounts.spotify.com/authorize'
  },
  apple: {
    // Apple Podcasts uses a different approach - Connect API
    connectId: process.env.APPLE_CONNECT_ID!,
    privateKey: process.env.APPLE_PRIVATE_KEY!,
    keyId: process.env.APPLE_KEY_ID!,
    teamId: process.env.APPLE_TEAM_ID!
  },
  google: {
    // Google Podcasts Manager - uses same OAuth as YouTube but different scopes
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/podcast-studio/platforms/google/callback`,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
  },
  amazon: {
    clientId: process.env.AMAZON_CLIENT_ID!,
    clientSecret: process.env.AMAZON_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/podcast-studio/platforms/amazon/callback`,
    scopes: ['profile'],
    authUrl: 'https://www.amazon.com/ap/oa'
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params
  try {
    const config = PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS]
    
    if (!config) {
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
    }
    
    // Skip Apple Podcasts since it uses different auth
    if (platform === 'apple') {
      return NextResponse.json({
        message: 'Apple Podcasts Connect requires manual setup',
        setupUrl: 'https://podcastsconnect.apple.com/',
        instructions: [
          'Go to Apple Podcasts Connect',
          'Add your RSS feed manually',
          'Submit for review',
          'Connect via RSS feed submission'
        ]
      })
    }

    // Generate state parameter for security
    const state = generateSecureState()
    
    // Store state in database for verification
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(PODCAST_DB_NAME)
    
    await db.collection('podcast-oauth-states').insertOne({
      state,
      platform,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    })
    
    await client.close()

    let authUrl: string

    switch (platform) {
      case 'youtube':
      case 'google':
        const oauth2Config = config as { clientId: string; clientSecret: string; redirectUri: string; scopes: string[] }
        const oauth2Client = new google.auth.OAuth2(
          oauth2Config.clientId,
          oauth2Config.clientSecret,
          oauth2Config.redirectUri
        )
        
        authUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: oauth2Config.scopes,
          state: state,
          prompt: 'consent'
        })
        break

      case 'spotify':
        const spotifyConfig = config as { clientId: string; authUrl: string; scopes: string[]; redirectUri: string }
        const spotifyParams = new URLSearchParams({
          response_type: 'code',
          client_id: spotifyConfig.clientId,
          scope: spotifyConfig.scopes?.join(' ') || '',
          redirect_uri: spotifyConfig.redirectUri,
          state: state,
          show_dialog: 'true'
        })
        authUrl = `${spotifyConfig.authUrl}?${spotifyParams.toString()}`
        break

      case 'amazon':
        const amazonConfig = config as { clientId: string; authUrl: string; scopes: string[]; redirectUri: string }
        const amazonParams = new URLSearchParams({
          response_type: 'code',
          client_id: amazonConfig.clientId,
          scope: amazonConfig.scopes?.join(' ') || '',
          redirect_uri: amazonConfig.redirectUri,
          state: state
        })
        authUrl = `${amazonConfig.authUrl}?${amazonParams.toString()}`
        break

      default:
        return NextResponse.json({ error: 'Platform not implemented' }, { status: 400 })
    }

    // Redirect to platform OAuth
    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error(`OAuth initiation error for ${platform}:`, error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}

function generateSecureState(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}