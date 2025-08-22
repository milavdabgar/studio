#!/usr/bin/env node

/**
 * YouTube OAuth Setup
 * Interactive setup for YouTube authentication
 */

import { config } from 'dotenv'
import { google } from 'googleapis'
import { writeFile, readFile, existsSync } from 'fs/promises'
import readline from 'readline'

config({ path: '.env.local' })

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve))

async function setupYouTubeAuth() {
  try {
    console.log('🎬 YouTube OAuth Setup for Podcast Distribution\n')
    
    // Load credentials
    const credentialsPath = 'youtube_credentials.json'
    if (!existsSync(credentialsPath)) {
      console.error('❌ youtube_credentials.json not found!')
      console.log('Please ensure you have downloaded the OAuth credentials from Google Cloud Console.')
      return
    }
    
    const credentialsContent = await readFile(credentialsPath, 'utf8')
    const credentials = JSON.parse(credentialsContent)
    const { client_id, client_secret, redirect_uris } = credentials.installed
    
    console.log('✅ Credentials loaded successfully')
    console.log(`📱 Client ID: ${client_id}`)
    
    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    )
    
    // Generate auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/youtube.upload'],
      prompt: 'consent' // Force consent screen to get refresh token
    })
    
    console.log('\n🔗 Step 1: Visit this authorization URL:')
    console.log('─'.repeat(80))
    console.log(authUrl)
    console.log('─'.repeat(80))
    
    console.log('\n📋 Instructions:')
    console.log('1. Copy the URL above and paste it in your browser')
    console.log('2. Sign in with your Google account that has YouTube access')
    console.log('3. Grant permissions to upload videos')
    console.log('4. Copy the authorization code from the success page')
    console.log('5. Paste the code below\n')
    
    const code = await question('🔑 Enter the authorization code: ')
    
    if (!code.trim()) {
      console.log('❌ No code provided. Exiting.')
      rl.close()
      return
    }
    
    console.log('\n⏳ Exchanging code for tokens...')
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code.trim())
    oauth2Client.setCredentials(tokens)
    
    // Save tokens
    const tokenPath = 'youtube_token.json'
    await writeFile(tokenPath, JSON.stringify(tokens, null, 2))
    
    console.log('✅ Authentication successful!')
    console.log(`💾 Tokens saved to: ${tokenPath}`)
    
    // Test the authentication
    console.log('\n🧪 Testing API access...')
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
      } else {
        console.log('⚠️  API access works, but no YouTube channels found.')
        console.log('   Consider creating a YouTube channel for your account.')
      }
    } catch (error) {
      console.log('⚠️  API access test failed:', error.message)
      console.log('   This might be normal if you haven\'t created a YouTube channel yet.')
    }
    
    console.log('\n🎉 Setup Complete!')
    console.log('Your podcast system can now automatically upload to YouTube.')
    console.log('\n🚀 Next Steps:')
    console.log('1. Start the podcast automation: node podcast-automation.js start')
    console.log('2. Add new M4A files to your Google Drive folder')
    console.log('3. Episodes will automatically upload to YouTube')
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    
    if (error.message.includes('invalid_grant')) {
      console.log('\n💡 Possible solutions:')
      console.log('1. Make sure you copied the complete authorization code')
      console.log('2. Try the authorization process again (codes expire quickly)')
      console.log('3. Ensure your system clock is correct')
    }
  } finally {
    rl.close()
  }
}

setupYouTubeAuth().catch(console.error)