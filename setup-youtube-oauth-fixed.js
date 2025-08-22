#!/usr/bin/env node

/**
 * YouTube OAuth Setup - Fixed Version
 * Handles OAuth flow with proper redirect URI
 */

import { config } from 'dotenv'
import { google } from 'googleapis'
import { writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import http from 'http'
import { URL } from 'url'

config({ path: '.env.local' })

async function setupYouTubeAuth() {
  try {
    console.log('🎬 YouTube OAuth Setup for Podcast Distribution\n')
    
    // Load credentials
    const credentialsPath = 'youtube_credentials.json'
    if (!existsSync(credentialsPath)) {
      console.error('❌ youtube_credentials.json not found!')
      return
    }
    
    const credentialsContent = await readFile(credentialsPath, 'utf8')
    const credentials = JSON.parse(credentialsContent)
    const { client_id, client_secret } = credentials.installed
    
    console.log('✅ Credentials loaded successfully')
    
    // Use a specific redirect URI
    const redirectUri = 'http://localhost:8080'
    
    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirectUri
    )
    
    // Generate auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/youtube.upload'],
      prompt: 'consent'
    })
    
    console.log('🔗 Authorization URL generated:')
    console.log('─'.repeat(80))
    console.log(authUrl)
    console.log('─'.repeat(80))
    
    console.log('\n📋 Starting local server to handle OAuth callback...')
    
    // Create a promise to handle the OAuth callback
    const authCode = await new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        const url = new URL(req.url, `http://localhost:8080`)
        
        if (url.pathname === '/') {
          const code = url.searchParams.get('code')
          const error = url.searchParams.get('error')
          
          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' })
            res.end(`
              <html>
                <body>
                  <h1>❌ Authorization Failed</h1>
                  <p>Error: ${error}</p>
                  <p>Please close this window and try again.</p>
                </body>
              </html>
            `)
            server.close()
            reject(new Error(`OAuth error: ${error}`))
            return
          }
          
          if (code) {
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(`
              <html>
                <body>
                  <h1>✅ Authorization Successful!</h1>
                  <p>You can close this window and return to the terminal.</p>
                  <script>window.close();</script>
                </body>
              </html>
            `)
            server.close()
            resolve(code)
            return
          }
        }
        
        // Default response
        res.writeHead(404, { 'Content-Type': 'text/html' })
        res.end('<html><body><h1>404 - Not Found</h1></body></html>')
      })
      
      server.listen(8080, () => {
        console.log('✅ Local server started on http://localhost:8080')
        console.log('\n🌐 Please visit the authorization URL above to complete setup')
        console.log('   (The URL should open automatically in your default browser)')
        
        // Try to open the URL automatically
        const open = async (url) => {
          const { exec } = await import('child_process')
          const start = process.platform === 'darwin' ? 'open' : 
                       process.platform === 'win32' ? 'start' : 'xdg-open'
          exec(`${start} "${url}"`)
        }
        open(authUrl)
      })
      
      // Timeout after 5 minutes
      setTimeout(() => {
        server.close()
        reject(new Error('OAuth timeout - please try again'))
      }, 300000)
    })
    
    console.log('\n⏳ Exchanging authorization code for tokens...')
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(authCode)
    oauth2Client.setCredentials(tokens)
    
    // Save tokens
    const tokenPath = 'youtube_token.json'
    await writeFile(tokenPath, JSON.stringify(tokens, null, 2))
    
    console.log('✅ Authentication successful!')
    console.log(`💾 Tokens saved to: ${tokenPath}`)
    
    // Test the authentication
    console.log('\n🧪 Testing YouTube API access...')
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })
    
    try {
      const response = await youtube.channels.list({
        part: ['snippet'],
        mine: true
      })
      
      if (response.data.items && response.data.items.length > 0) {
        const channel = response.data.items[0]
        console.log(`✅ YouTube API access confirmed!`)
        console.log(`📺 Channel: ${channel.snippet.title}`)
        console.log(`🆔 Channel ID: ${channel.id}`)
        console.log(`👥 Subscribers: ${channel.statistics?.subscriberCount || 'Hidden'}`)
      } else {
        console.log('⚠️  API access works, but no YouTube channels found.')
        console.log('   You may need to create a YouTube channel first.')
      }
    } catch (error) {
      console.log('⚠️  API test warning:', error.message)
      console.log('   Authentication successful, but channel access may be limited.')
    }
    
    console.log('\n🎉 YouTube OAuth Setup Complete!')
    console.log('\n🚀 Your podcast system can now:')
    console.log('✅ Automatically upload new episodes to YouTube')
    console.log('✅ Generate custom thumbnails for each episode')
    console.log('✅ Set proper metadata and descriptions')
    console.log('✅ Handle audio-only uploads with visual overlays')
    
    console.log('\n📋 Next Steps:')
    console.log('1. Start automation: node podcast-automation.js start')
    console.log('2. Add M4A files to your Google Drive folder')
    console.log('3. Episodes will auto-upload to YouTube + RSS feeds')
    console.log('4. Submit RSS feeds to other platforms manually')
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    
    if (error.message.includes('redirect_uri_mismatch')) {
      console.log('\n💡 Fix required in Google Cloud Console:')
      console.log('1. Go to: https://console.cloud.google.com/apis/credentials')
      console.log('2. Edit your OAuth 2.0 Client')
      console.log('3. Add these Authorized redirect URIs:')
      console.log('   - http://localhost:8080')
      console.log('   - http://localhost:3000')
      console.log('   - urn:ietf:wg:oauth:2.0:oob')
      console.log('4. Save and try again')
    }
  }
}

setupYouTubeAuth().catch(console.error)