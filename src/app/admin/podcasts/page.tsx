'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, RefreshCw, Upload, ExternalLink, Settings, BarChart3 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Episode {
  id: string
  title: string
  description: string
  audioUrl: string
  episodeNumber: number
  pubDate: string
  status: string
  distribution?: {
    platforms: Record<string, any>
  }
}

interface SyncStatus {
  timestamp: string
  status: string
  filesProcessed: number
  newEpisodes: number
  errors: string[]
}

export default function PodcastAdminPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState({
    title: 'AI Generated Insights',
    description: 'Deep dive conversations powered by NotebookLM',
    author: 'Milav Dabgar',
    email: 'mail@milav.in',
    website: 'https://milav.in',
    platforms: {
      youtube: { enabled: true },
      spotify: { enabled: true },
      apple: { enabled: true },
      google: { enabled: true },
      amazon: { enabled: true }
    }
  })

  const domains = [
    { name: 'Primary', url: 'gppalanpur.ac.in' },
    { name: 'Personal', url: 'milav.in' },
    { name: 'Backup', url: 'gppalanpur.in' }
  ]

  useEffect(() => {
    loadEpisodes()
    loadSyncStatus()
  }, [])

  const loadEpisodes = async () => {
    try {
      const response = await fetch('/api/podcasts?format=json')
      const data = await response.json()
      setEpisodes(data.episodes || [])
    } catch (error) {
      console.error('Failed to load episodes:', error)
    }
  }

  const loadSyncStatus = async () => {
    try {
      const response = await fetch('/api/podcasts/sync?action=sync-status')
      const data = await response.json()
      setSyncStatus(data.lastSync)
    } catch (error) {
      console.error('Failed to load sync status:', error)
    }
  }

  const handleSync = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/podcasts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync-now' })
      })
      const result = await response.json()
      
      if (result.newEpisodes > 0) {
        await loadEpisodes()
      }
      
      setSyncStatus(result)
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDistribute = async (platforms: string[]) => {
    setLoading(true)
    try {
      const response = await fetch('/api/podcasts/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit-to-platforms',
          platforms
        })
      })
      const result = await response.json()
      console.log('Distribution result:', result)
    } catch (error) {
      console.error('Distribution failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = async () => {
    try {
      const response = await fetch('/api/podcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-config',
          ...config
        })
      })
      if (response.ok) {
        alert('Configuration updated successfully!')
      }
    } catch (error) {
      console.error('Failed to update config:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Podcast Management</h1>
          <p className="text-muted-foreground">Manage your podcast distribution and episodes</p>
        </div>
        <Button onClick={handleSync} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Sync Now
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="episodes">Episodes</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* RSS Feed URLs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                RSS Feed URLs
              </CardTitle>
              <CardDescription>
                Your podcast RSS feeds are available on all your domains
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {domains.map((domain) => (
                <div key={domain.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{domain.name}</div>
                    <div className="text-sm text-muted-foreground">
                      https://{domain.url}/api/podcasts
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(`https://${domain.url}/api/podcasts`)}
                  >
                    Copy URL
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sync Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Sync Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {syncStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {syncStatus.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                    <span className="font-medium capitalize">{syncStatus.status}</span>
                    <Badge variant="secondary">
                      {new Date(syncStatus.timestamp).toLocaleString()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Files Processed:</span>
                      <span className="ml-2 font-medium">{syncStatus.filesProcessed}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">New Episodes:</span>
                      <span className="ml-2 font-medium">{syncStatus.newEpisodes}</span>
                    </div>
                  </div>
                  {syncStatus.errors?.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {syncStatus.errors.length} error(s) occurred during sync
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground">No sync data available</div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{episodes.length}</div>
                <div className="text-muted-foreground">Total Episodes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {Object.values(config.platforms).filter(p => p.enabled).length}
                </div>
                <div className="text-muted-foreground">Active Platforms</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{domains.length}</div>
                <div className="text-muted-foreground">Domain Endpoints</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="episodes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Episodes</CardTitle>
              <CardDescription>Manage your podcast episodes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {episodes.map((episode) => (
                  <div key={episode.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{episode.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Episode {episode.episodeNumber} • {new Date(episode.pubDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm mt-2 line-clamp-2">{episode.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant={episode.status === 'published' ? 'default' : 'secondary'}>
                          {episode.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {episodes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No episodes found. Sync with Google Drive to add episodes.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Platform Distribution
              </CardTitle>
              <CardDescription>
                Distribute your podcast to various platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(config.platforms).map(([platform, settings]) => (
                <div key={platform} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(checked) => {
                        setConfig(prev => ({
                          ...prev,
                          platforms: {
                            ...prev.platforms,
                            [platform]: { ...settings, enabled: checked }
                          }
                        }))
                      }}
                    />
                    <div>
                      <div className="font-medium capitalize">{platform}</div>
                      <div className="text-sm text-muted-foreground">
                        {platform === 'youtube' ? 'Automatic upload' : 'Manual submission required'}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDistribute([platform])}
                    disabled={!settings.enabled || loading}
                  >
                    Distribute
                  </Button>
                </div>
              ))}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => handleDistribute(
                    Object.entries(config.platforms)
                      .filter(([_, settings]) => settings.enabled)
                      .map(([platform, _]) => platform)
                  )}
                  disabled={loading}
                  className="w-full"
                >
                  Distribute to All Enabled Platforms
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Podcast Configuration
              </CardTitle>
              <CardDescription>
                Configure your podcast metadata and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Podcast Title</Label>
                  <Input
                    id="title"
                    value={config.title}
                    onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={config.author}
                    onChange={(e) => setConfig(prev => ({ ...prev, author: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={config.email}
                    onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={config.website}
                    onChange={(e) => setConfig(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={config.description}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <Button onClick={updateConfig} className="w-full">
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}