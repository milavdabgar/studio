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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, Upload, Edit, Trash2, Play, Pause, Eye, EyeOff, 
  Youtube, Music, Apple, Podcast, Settings, BarChart3,
  Calendar, Clock, Globe, Users, TrendingUp, CheckCircle,
  AlertCircle, XCircle, Upload as UploadIcon
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PodcastSeries {
  id: string
  name: string
  description: string
  category: string
  language: string
  artwork: string
  author: string
  email: string
  website: string
  explicit: boolean
  platforms: {
    youtube: { enabled: boolean, channelId?: string, status?: string }
    spotify: { enabled: boolean, showId?: string, status?: string }
    apple: { enabled: boolean, feedId?: string, status?: string }
    google: { enabled: boolean, status?: string }
    amazon: { enabled: boolean, status?: string }
  }
  rssUrl: string
  episodeCount: number
  subscribers: number
  createdAt: string
}

interface Episode {
  id: string
  seriesId: string
  title: string
  description: string
  audioUrl: string
  duration: string
  fileSize: number
  episodeNumber: number
  season: number
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  publishDate: string
  platforms: {
    youtube: { published: boolean, videoId?: string, status?: string }
    spotify: { published: boolean, status?: string }
    apple: { published: boolean, status?: string }
    google: { published: boolean, status?: string }
    amazon: { published: boolean, status?: string }
  }
  analytics: {
    downloads: number
    views: number
    avgListenTime: string
  }
  createdAt: string
  updatedAt: string
}

export default function PodcastStudioPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [series, setSeries] = useState<PodcastSeries[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [selectedSeries, setSelectedSeries] = useState<string>('all')
  const [isCreatingSeries, setIsCreatingSeries] = useState(false)
  const [isEditingEpisode, setIsEditingEpisode] = useState<string | null>(null)

  // Platform connection states
  const [platformConnections, setPlatformConnections] = useState({
    youtube: { connected: false, user: null, expires: null },
    spotify: { connected: false, user: null, expires: null },
    apple: { connected: false, user: null, expires: null },
    google: { connected: false, user: null, expires: null },
    amazon: { connected: false, user: null, expires: null }
  })

  useEffect(() => {
    loadSeries()
    loadEpisodes()
    checkPlatformConnections()
  }, [])

  const loadSeries = async () => {
    // Mock data for now
    setSeries([
      {
        id: '1',
        name: 'AI Research Insights',
        description: 'Deep dive conversations into cutting-edge AI research',
        category: 'Technology',
        language: 'en-US',
        artwork: '/podcast-artwork-ai.jpg',
        author: 'Milav Dabgar',
        email: 'mail@milav.in',
        website: 'https://milav.in',
        explicit: false,
        platforms: {
          youtube: { enabled: true, channelId: 'UC123...', status: 'connected' },
          spotify: { enabled: true, status: 'pending' },
          apple: { enabled: true, status: 'approved' },
          google: { enabled: true, status: 'connected' },
          amazon: { enabled: false, status: 'not_connected' }
        },
        rssUrl: 'https://milav.in/api/podcasts/ai-research',
        episodeCount: 9,
        subscribers: 1250,
        createdAt: '2025-08-15'
      }
    ])
  }

  const loadEpisodes = async () => {
    // Mock data for now
    setEpisodes([
      {
        id: '1',
        seriesId: '1',
        title: 'Convolutional Neural Network Approach to Automatic Modulation Classification',
        description: 'An in-depth exploration of CNN-based approaches for automatic modulation classification in cognitive radio systems.',
        audioUrl: 'https://drive.google.com/uc?export=download&id=1tvjVPcmMfs-wG0o74r_aJgbFbz3N92AA',
        duration: '18:45',
        fileSize: 94024364,
        episodeNumber: 1,
        season: 1,
        status: 'published',
        publishDate: '2025-08-20',
        platforms: {
          youtube: { published: true, videoId: 'ABC123', status: 'published' },
          spotify: { published: true, status: 'published' },
          apple: { published: true, status: 'published' },
          google: { published: true, status: 'published' },
          amazon: { published: false, status: 'not_published' }
        },
        analytics: {
          downloads: 342,
          views: 1250,
          avgListenTime: '14:20'
        },
        createdAt: '2025-08-15',
        updatedAt: '2025-08-20'
      }
    ])
  }

  const checkPlatformConnections = async () => {
    try {
      const response = await fetch('/api/podcast-studio/platforms/status')
      const data = await response.json()
      setPlatformConnections(data.connections || platformConnections)
    } catch (error) {
      console.error('Failed to load platform connections:', error)
    }
  }

  const connectPlatform = async (platform: string) => {
    try {
      window.open(`/api/podcast-studio/platforms/${platform}/auth`, '_blank')
    } catch (error) {
      console.error(`Failed to connect to ${platform}:`, error)
    }
  }

  const publishEpisode = async (episodeId: string, platforms: string[]) => {
    try {
      const response = await fetch('/api/podcast-studio/episodes/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId, platforms })
      })
      
      if (response.ok) {
        loadEpisodes() // Refresh episodes
      }
    } catch (error) {
      console.error('Failed to publish episode:', error)
    }
  }

  const SeriesCard = ({ series }: { series: PodcastSeries }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => setSelectedSeries(series.id)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {series.name}
              <Badge variant="secondary">{series.episodeCount} episodes</Badge>
            </CardTitle>
            <CardDescription>{series.description}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline">{series.category}</Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              {series.subscribers.toLocaleString()}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {Object.entries(series.platforms).map(([platform, config]) => {
              const icons = {
                youtube: <Youtube className="h-4 w-4" />,
                spotify: <Music className="h-4 w-4" />,
                apple: <Apple className="h-4 w-4" />,
                google: <Podcast className="h-4 w-4" />,
                amazon: <Music className="h-4 w-4" />
              }
              
              const statusColors = {
                connected: 'bg-green-500',
                pending: 'bg-yellow-500',
                approved: 'bg-green-500',
                not_connected: 'bg-gray-300'
              }
              
              return config.enabled ? (
                <div key={platform} className="flex items-center gap-1">
                  {icons[platform as keyof typeof icons]}
                  <div className={`w-2 h-2 rounded-full ${statusColors[config.status as keyof typeof statusColors]}`} />
                </div>
              ) : null
            })}
          </div>
          <Button variant="outline" size="sm">
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const EpisodeRow = ({ episode }: { episode: Episode }) => (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline">E{episode.episodeNumber}</Badge>
              <h3 className="font-medium">{episode.title}</h3>
              <Badge variant={
                episode.status === 'published' ? 'default' : 
                episode.status === 'scheduled' ? 'secondary' : 
                'outline'
              }>
                {episode.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {episode.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {episode.duration}
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                {episode.analytics.downloads} downloads
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(episode.publishDate).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <div className="flex gap-1">
              {Object.entries(episode.platforms).map(([platform, config]) => {
                const icons = {
                  youtube: <Youtube className="h-3 w-3" />,
                  spotify: <Music className="h-3 w-3" />,
                  apple: <Apple className="h-3 w-3" />,
                  google: <Podcast className="h-3 w-3" />,
                  amazon: <Music className="h-3 w-3" />
                }
                
                return (
                  <div key={platform} className={`p-1 rounded ${
                    config.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {icons[platform as keyof typeof icons]}
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditingEpisode(episode.id)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Podcast Studio</h1>
          <p className="text-muted-foreground">Professional podcast management and distribution</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreatingSeries(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Series
          </Button>
          <Button variant="outline">
            <UploadIcon className="h-4 w-4 mr-2" />
            Upload Episode
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="series">Series</TabsTrigger>
          <TabsTrigger value="episodes">Episodes</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Dashboard Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">3</div>
                <div className="text-muted-foreground">Active Series</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">47</div>
                <div className="text-muted-foreground">Total Episodes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">12.4K</div>
                <div className="text-muted-foreground">Total Downloads</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">5</div>
                <div className="text-muted-foreground">Connected Platforms</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Episode "CNN Modulation Classification" published to YouTube</span>
                  <Badge variant="outline">2 hours ago</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Spotify review pending for "AI Research Insights"</span>
                  <Badge variant="outline">1 day ago</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="series" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map((s) => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="episodes" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Select value={selectedSeries} onValueChange={setSelectedSeries}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Series" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Series</SelectItem>
                  {series && series.length > 0 && series.map((s) => (
                    <SelectItem key={s.id} value={s.id || `series-${Math.random()}`}>
                      {s.name || 'Unnamed Series'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Episode
            </Button>
          </div>

          <div className="space-y-3">
            {episodes
              .filter(ep => selectedSeries === 'all' || ep.seriesId === selectedSeries)
              .map((episode) => (
                <EpisodeRow key={episode.id} episode={episode} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(platformConnections).map(([platform, connection]) => {
              const platformInfo = {
                youtube: { name: 'YouTube', icon: <Youtube className="h-6 w-6" />, color: 'text-red-600' },
                spotify: { name: 'Spotify', icon: <Music className="h-6 w-6" />, color: 'text-green-600' },
                apple: { name: 'Apple Podcasts', icon: <Apple className="h-6 w-6" />, color: 'text-gray-600' },
                google: { name: 'Google Podcasts', icon: <Podcast className="h-6 w-6" />, color: 'text-blue-600' },
                amazon: { name: 'Amazon Music', icon: <Music className="h-6 w-6" />, color: 'text-orange-600' }
              }
              
              const info = platformInfo[platform as keyof typeof platformInfo]
              
              return (
                <Card key={platform}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={info.color}>{info.icon}</div>
                      {info.name}
                      {connection.connected ? (
                        <Badge variant="default">Connected</Badge>
                      ) : (
                        <Badge variant="outline">Not Connected</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {connection.connected ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Connected as: {connection.user || 'Unknown User'}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                          <Button variant="outline" size="sm">
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Connect your {info.name} account to enable automatic publishing
                        </p>
                        <Button onClick={() => connectPlatform(platform)}>
                          Connect with OAuth
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Downloads</span>
                    <span className="font-medium">12,453</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg. Listen Time</span>
                    <span className="font-medium">16:42</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Completion Rate</span>
                    <span className="font-medium">73%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}