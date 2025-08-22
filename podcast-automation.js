#!/usr/bin/env node

/**
 * Podcast Automation System
 * Automated workflow for processing and distributing podcasts
 */

import { exec } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

const CONFIG = {
  googleDrive: {
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '1q4WfSEztt3vxZex4qhIO8rd1VIjwopYZ',
    apiKey: process.env.GOOGLE_DRIVE_API_KEY
  },
  domains: {
    primary: 'gppalanpur.ac.in',
    personal: 'milav.in', 
    backup: 'gppalanpur.in'
  },
  youtube: {
    credentialsFile: 'youtube_credentials.json',
    enabled: true
  },
  platforms: {
    spotify: { enabled: true, requiresManual: true },
    apple: { enabled: true, requiresManual: true },
    google: { enabled: true, requiresManual: true },
    amazon: { enabled: true, requiresManual: true },
    youtube: { enabled: true, requiresManual: false }
  },
  automation: {
    checkInterval: 300000, // 5 minutes
    enableAutoUpload: true,
    enableNotifications: true
  }
}

class PodcastAutomation {
  constructor() {
    this.isRunning = false
    this.lastCheck = null
    this.processedFiles = new Set()
  }

  async start() {
    console.log('🎧 Starting Podcast Automation System...')
    console.log(`📁 Monitoring Google Drive folder: ${CONFIG.googleDrive.folderId}`)
    console.log(`🌐 Primary domain: ${CONFIG.domains.primary}`)
    
    this.isRunning = true
    
    // Initial sync
    await this.performSync()
    
    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.performSync()
    }, CONFIG.automation.checkInterval)
    
    console.log('✅ Automation system started successfully')
    console.log(`🔄 Checking for new files every ${CONFIG.automation.checkInterval / 1000} seconds`)
  }

  async stop() {
    console.log('🛑 Stopping Podcast Automation System...')
    this.isRunning = false
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
    
    console.log('✅ Automation system stopped')
  }

  async performSync() {
    if (!this.isRunning) return
    
    try {
      console.log(`🔍 Checking for new podcast files... (${new Date().toISOString()})`)
      
      // Call the sync API
      const response = await this.callAPI('/api/podcasts/sync', 'POST', {
        action: 'sync-now'
      })
      
      if (response.newEpisodes > 0) {
        console.log(`🆕 Found ${response.newEpisodes} new episodes!`)
        
        // Auto-distribute if enabled
        if (CONFIG.automation.enableAutoUpload) {
          await this.autoDistribute(response.newEpisodes)
        }
        
        // Send notifications
        if (CONFIG.automation.enableNotifications) {
          await this.sendNotifications(response)
        }
      } else {
        console.log('📭 No new episodes found')
      }
      
      this.lastCheck = new Date()
      
    } catch (error) {
      console.error('❌ Sync failed:', error.message)
    }
  }

  async autoDistribute(newEpisodeCount) {
    try {
      console.log('🚀 Auto-distributing new episodes...')
      
      const enabledPlatforms = Object.entries(CONFIG.platforms)
        .filter(([_, config]) => config.enabled)
        .map(([platform, _]) => platform)
      
      const response = await this.callAPI('/api/podcasts/distribute', 'POST', {
        action: 'submit-to-platforms',
        platforms: enabledPlatforms
      })
      
      // Process results
      for (const [platform, result] of Object.entries(response.results)) {
        if (result.status === 'submitted') {
          console.log(`✅ ${platform}: Successfully submitted`)
        } else if (result.status === 'manual_submission_required') {
          console.log(`⚠️  ${platform}: Manual submission required`)
          console.log(`   📋 Submission URL: ${result.submissionUrl}`)
          console.log(`   🔗 RSS URL: ${result.rssUrl}`)
        } else {
          console.log(`❌ ${platform}: ${result.message}`)
        }
      }
      
    } catch (error) {
      console.error('❌ Auto-distribution failed:', error.message)
    }
  }

  async sendNotifications(syncResult) {
    try {
      const message = `🎧 New Podcast Episodes Available!\n` +
        `📊 Episodes added: ${syncResult.newEpisodes}\n` +
        `📁 Files processed: ${syncResult.filesProcessed}\n` +
        `🕐 Sync time: ${new Date().toLocaleString()}\n\n` +
        `🔗 RSS Feed: https://${CONFIG.domains.primary}/api/podcasts\n` +
        `🎯 Admin Panel: https://${CONFIG.domains.primary}/admin/podcasts`
      
      console.log('📢 Sending notifications...')
      console.log(message)
      
      // Here you could integrate with Slack, Discord, Email, etc.
      await this.logNotification(message)
      
    } catch (error) {
      console.error('❌ Notification failed:', error.message)
    }
  }

  async callAPI(endpoint, method = 'GET', body = null) {
    const baseUrl = `https://${CONFIG.domains.primary}`
    const url = `${baseUrl}${endpoint}`
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    const fetch = (await import('node-fetch')).default
    const response = await fetch(url, options)
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  }

  async logNotification(message) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'notification',
      message
    }
    
    const logFile = path.join(__dirname, 'podcast-automation.log')
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n')
  }

  async generateStatusReport() {
    try {
      console.log('📊 Generating status report...')
      
      // Get current episodes
      const episodes = await this.callAPI('/api/podcasts?format=json')
      
      // Get sync status
      const syncStatus = await this.callAPI('/api/podcasts/sync?action=sync-status')
      
      // Get distribution URLs
      const distributionUrls = await this.callAPI('/api/podcasts/distribute?action=submission-guide')
      
      const report = {
        timestamp: new Date().toISOString(),
        system: {
          status: this.isRunning ? 'running' : 'stopped',
          lastCheck: this.lastCheck,
          uptime: this.lastCheck ? Date.now() - this.lastCheck.getTime() : 0
        },
        episodes: {
          total: episodes.episodes?.length || 0,
          latest: episodes.episodes?.[0]?.title || 'None'
        },
        sync: {
          lastSync: syncStatus.lastSync?.timestamp || 'Never',
          lastSyncStatus: syncStatus.lastSync?.status || 'Unknown'
        },
        domains: CONFIG.domains,
        rssFeeds: Object.values(CONFIG.domains).map(domain => 
          `https://${domain}/api/podcasts`
        ),
        platforms: CONFIG.platforms
      }
      
      console.log('📋 Status Report:')
      console.log(JSON.stringify(report, null, 2))
      
      return report
      
    } catch (error) {
      console.error('❌ Failed to generate status report:', error.message)
      return null
    }
  }
}

// CLI Interface
async function main() {
  const automation = new PodcastAutomation()
  
  const command = process.argv[2]
  
  switch (command) {
    case 'start':
      await automation.start()
      
      // Keep process running
      process.on('SIGINT', async () => {
        await automation.stop()
        process.exit(0)
      })
      
      process.on('SIGTERM', async () => {
        await automation.stop()
        process.exit(0)
      })
      
      // Keep alive
      setInterval(() => {}, 1000)
      break
      
    case 'sync':
      await automation.performSync()
      break
      
    case 'status':
      await automation.generateStatusReport()
      break
      
    case 'stop':
      console.log('🛑 Stopping any running automation processes...')
      break
      
    default:
      console.log(`
🎧 Podcast Automation System

Usage:
  node podcast-automation.js <command>

Commands:
  start    - Start the automation system
  sync     - Perform a one-time sync
  status   - Show system status
  stop     - Stop the automation system

Environment Variables:
  GOOGLE_DRIVE_API_KEY      - Google Drive API key
  GOOGLE_DRIVE_FOLDER_ID    - Google Drive folder ID
  MONGODB_URI               - MongoDB connection string
  NEXT_PUBLIC_BASE_URL      - Base URL for API calls

Examples:
  node podcast-automation.js start
  node podcast-automation.js sync
  node podcast-automation.js status
      `)
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { PodcastAutomation, CONFIG }