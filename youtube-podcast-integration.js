#!/usr/bin/env node

/**
 * YouTube Podcast Integration
 * Node.js version of the Python YouTube publisher
 */

import { config } from 'dotenv'
import { createReadStream, existsSync, unlinkSync } from 'fs'
import { writeFile } from 'fs/promises'
import { google } from 'googleapis'
import { createCanvas, loadImage } from 'canvas'

config({ path: '.env.local' })

const youtube = google.youtube('v3')

class YouTubePodcastPublisher {
  constructor() {
    this.auth = null
    this.authenticated = false
  }

  async authenticate() {
    try {
      console.log('🔐 Authenticating with YouTube API...')
      
      // Check if credentials file exists
      if (!existsSync('youtube_credentials.json')) {
        throw new Error('youtube_credentials.json not found. Please download from Google Cloud Console.')
      }

      // Set up OAuth2 client
      const credentials = JSON.parse(await import('fs').then(fs => fs.readFileSync('youtube_credentials.json', 'utf8')))
      const { client_id, client_secret, redirect_uris } = credentials.installed

      const oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      )

      // Check if we have a saved token
      let token = null
      try {
        if (existsSync('youtube_token.json')) {
          token = JSON.parse(await import('fs').then(fs => fs.readFileSync('youtube_token.json', 'utf8')))
          oauth2Client.setCredentials(token)
          
          // Check if token is still valid
          const tokenInfo = await oauth2Client.getTokenInfo(token.access_token)
          console.log('✅ Using saved YouTube token')
        }
      } catch (error) {
        console.log('⚠️ Saved token is invalid, need to re-authenticate')
        token = null
      }

      // If no valid token, get a new one
      if (!token) {
        const authUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: ['https://www.googleapis.com/auth/youtube.upload']
        })

        console.log('\n🌐 Please visit this URL to authorize the application:')
        console.log(authUrl)
        console.log('\nAfter authorization, you will get a code. Enter it here:')

        // In a real implementation, you'd want to handle this more gracefully
        // For now, we'll simulate the process
        throw new Error('Manual OAuth flow required. Please run this interactively.')
      }

      this.auth = oauth2Client
      google.options({ auth: oauth2Client })
      this.authenticated = true
      
      console.log('✅ YouTube authentication successful')
      return true

    } catch (error) {
      console.error('❌ YouTube authentication failed:', error.message)
      return false
    }
  }

  async createThumbnail(title, outputPath = 'temp_thumbnail.png') {
    try {
      console.log('🎨 Creating podcast thumbnail...')
      
      const canvas = createCanvas(1280, 720)
      const ctx = canvas.getContext('2d')

      // Background
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, 1280, 720)

      // Podcast icon circle
      const centerX = 640
      const centerY = 240
      const radius = 80

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.fillStyle = '#ff6b6b'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.stroke()

      // Play triangle
      ctx.beginPath()
      ctx.moveTo(centerX - 15, centerY - 15)
      ctx.lineTo(centerX - 15, centerY + 15)
      ctx.lineTo(centerX + 15, centerY)
      ctx.closePath()
      ctx.fillStyle = '#ffffff'
      ctx.fill()

      // Title text
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 48px Arial'
      ctx.textAlign = 'center'
      
      // Word wrap for long titles
      const words = title.split(' ')
      const lines = []
      let currentLine = ''
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word
        const metrics = ctx.measureText(testLine)
        
        if (metrics.width > 1000 && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      if (currentLine) lines.push(currentLine)

      // Draw title lines
      const startY = centerY + radius + 80
      lines.slice(0, 3).forEach((line, index) => {
        ctx.fillText(line, centerX, startY + (index * 60))
      })

      // Podcast label
      ctx.font = '24px Arial'
      ctx.fillStyle = '#cccccc'
      ctx.fillText('🎧 PODCAST', centerX, 650)

      // Save thumbnail
      const buffer = canvas.toBuffer('image/png')
      await writeFile(outputPath, buffer)
      
      console.log(`✅ Thumbnail created: ${outputPath}`)
      return outputPath

    } catch (error) {
      console.error('⚠️ Could not create thumbnail:', error.message)
      return null
    }
  }

  async uploadPodcast(audioUrl, title, description = '', options = {}) {
    try {
      if (!this.authenticated) {
        throw new Error('Not authenticated. Call authenticate() first.')
      }

      console.log(`📤 Uploading "${title}" to YouTube...`)
      
      // Create thumbnail
      const thumbnailPath = await this.createThumbnail(title)
      
      // For now, we'll use a placeholder since we need to download the audio file
      // In a real implementation, you'd download from Google Drive first
      console.log('📁 Audio URL:', audioUrl)
      console.log('🔒 Privacy: private (default)')
      
      // This would be the actual upload code:
      /*
      const requestMetadata = {
        snippet: {
          title: title,
          description: description + '\n\n🎧 This is an audio-only podcast episode.',
          tags: options.tags || ['podcast', 'audio', 'AI', 'research'],
          categoryId: '22' // Education
        },
        status: {
          privacyStatus: options.privacy || 'private',
          selfDeclaredMadeForKids: false
        }
      }

      const media = {
        body: createReadStream(localAudioFile)
      }

      const response = await youtube.videos.insert({
        part: 'snippet,status',
        requestBody: requestMetadata,
        media: media
      })

      const videoId = response.data.id
      */

      // For demo purposes, return a mock response
      const mockVideoId = 'demo_video_' + Date.now()
      const videoUrl = `https://www.youtube.com/watch?v=${mockVideoId}`
      
      console.log('✅ Upload successful (simulated)')
      console.log(`🔗 Video URL: ${videoUrl}`)
      console.log(`🆔 Video ID: ${mockVideoId}`)

      // Clean up thumbnail
      if (thumbnailPath && existsSync(thumbnailPath)) {
        unlinkSync(thumbnailPath)
      }

      return {
        videoId: mockVideoId,
        videoUrl: videoUrl,
        title: title,
        uploadTime: new Date().toISOString()
      }

    } catch (error) {
      console.error('❌ Upload failed:', error.message)
      throw error
    }
  }
}

// Export for use in the podcast system
export { YouTubePodcastPublisher }

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    const publisher = new YouTubePodcastPublisher()
    
    const command = process.argv[2]
    
    switch (command) {
      case 'auth':
        await publisher.authenticate()
        break
        
      case 'test':
        await publisher.authenticate()
        if (publisher.authenticated) {
          await publisher.uploadPodcast(
            'https://example.com/test.m4a',
            'Test Podcast Episode',
            'This is a test upload'
          )
        }
        break
        
      default:
        console.log(`
🎬 YouTube Podcast Integration

Usage:
  node youtube-podcast-integration.js <command>

Commands:
  auth  - Authenticate with YouTube
  test  - Test upload functionality

Setup:
  1. Download youtube_credentials.json from Google Cloud Console
  2. Run 'node youtube-podcast-integration.js auth'
  3. Follow the authentication flow
        `)
    }
  }
  
  main().catch(console.error)
}