import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!
const PODCAST_DB_NAME = process.env.PODCAST_STUDIO_DB || 'gpp-next'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/podcast-studio?error=${error}&platform=${platform}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/podcast-studio?error=missing_code&platform=${platform}`
      )
    }

    // Verify state parameter
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(PODCAST_DB_NAME)
    
    const stateRecord = await db.collection('podcast-oauth-states').findOne({
      state,
      platform,
      expiresAt: { $gt: new Date() }
    })

    if (!stateRecord) {
      await client.close()
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/podcast-studio?error=invalid_state&platform=${platform}`
      )
    }

    // Remove used state
    await db.collection('podcast-oauth-states').deleteOne({ _id: stateRecord._id })

    let tokenData: any
    let userInfo: any

    switch (platform) {
      case 'youtube':
      case 'google':
        tokenData = await handleGoogleCallback(code, platform)
        userInfo = await getGoogleUserInfo(tokenData.tokens, platform)
        break

      case 'spotify':
        tokenData = await handleSpotifyCallback(code)
        userInfo = await getSpotifyUserInfo(tokenData.access_token)
        break

      case 'amazon':
        tokenData = await handleAmazonCallback(code)
        userInfo = await getAmazonUserInfo(tokenData.access_token)
        break

      default:
        await client.close()
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_BASE_URL}/admin/podcast-studio?error=unsupported_platform&platform=${platform}`
        )
    }

    // Store platform connection
    await db.collection('podcast-platform-connections').updateOne(
      { platform, userId: 'admin' }, // In a real app, this would be the actual user ID
      {
        $set: {
          platform,
          userId: 'admin',
          tokens: tokenData,
          userInfo,
          connectedAt: new Date(),
          status: 'connected',
          expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at * 1000) : null
        }
      },
      { upsert: true }
    )

    await client.close()

    // Redirect back to admin with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/admin/podcast-studio?success=connected&platform=${platform}`
    )

  } catch (error) {
    console.error(`OAuth callback error for ${platform}:`, error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/admin/podcast-studio?error=callback_failed&platform=${platform}`
    )
  }
}

async function handleGoogleCallback(code: string, platform: string) {
  const config = {
    youtube: {
      clientId: process.env.YOUTUBE_CLIENT_ID!,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/podcast-studio/platforms/youtube/callback`
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/podcast-studio/platforms/google/callback`
    }
  }

  const platformConfig = config[platform as keyof typeof config]
  
  const oauth2Client = new google.auth.OAuth2(
    platformConfig.clientId,
    platformConfig.clientSecret,
    platformConfig.redirectUri
  )

  const { tokens } = await oauth2Client.getToken(code)
  return { tokens }
}

async function getGoogleUserInfo(tokens: any, platform: string) {
  const config = {
    youtube: {
      clientId: process.env.YOUTUBE_CLIENT_ID!,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET!
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }
  }
  
  const platformConfig = config[platform as keyof typeof config]
  
  const oauth2Client = new google.auth.OAuth2(
    platformConfig.clientId,
    platformConfig.clientSecret
  )
  oauth2Client.setCredentials(tokens)

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
  const { data } = await oauth2.userinfo.get()
  
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    picture: data.picture
  }
}

async function handleSpotifyCallback(code: string) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/podcast-studio/platforms/spotify/callback`
    })
  })

  if (!response.ok) {
    throw new Error(`Spotify token exchange failed: ${response.status}`)
  }

  return await response.json()
}

async function getSpotifyUserInfo(accessToken: string) {
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error(`Spotify user info failed: ${response.status}`)
  }

  const data = await response.json()
  return {
    id: data.id,
    email: data.email,
    name: data.display_name,
    picture: data.images?.[0]?.url
  }
}

async function handleAmazonCallback(code: string) {
  const response = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/podcast-studio/platforms/amazon/callback`,
      client_id: process.env.AMAZON_CLIENT_ID!,
      client_secret: process.env.AMAZON_CLIENT_SECRET!
    })
  })

  if (!response.ok) {
    throw new Error(`Amazon token exchange failed: ${response.status}`)
  }

  return await response.json()
}

async function getAmazonUserInfo(accessToken: string) {
  const response = await fetch('https://api.amazon.com/user/profile', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error(`Amazon user info failed: ${response.status}`)
  }

  const data = await response.json()
  return {
    id: data.user_id,
    email: data.email,
    name: data.name
  }
}