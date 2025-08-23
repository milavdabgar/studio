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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

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
  const [isUploadingEpisode, setIsUploadingEpisode] = useState(false)
  const [isEditingEpisode, setIsEditingEpisode] = useState<string | null>(null)
  const [editingSeries, setEditingSeries] = useState<PodcastSeries | null>(null)

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
    try {
      const response = await fetch('/api/podcast-studio/series')
      if (response.ok) {
        const data = await response.json()
        setSeries(data.series || [])
      } else {
        console.error('Failed to load series')
        setSeries([])
      }
    } catch (error) {
      console.error('Error loading series:', error)
      setSeries([])
    }
  }

  const loadEpisodes = async () => {
    try {
      const response = await fetch('/api/podcast-studio/episodes')
      if (response.ok) {
        const data = await response.json()
        setEpisodes(data.episodes || [])
      } else {
        console.error('Failed to load episodes')
        setEpisodes([])
      }
    } catch (error) {
      console.error('Error loading episodes:', error)
      setEpisodes([])
    }
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
          <Button variant="outline" size="sm" onClick={(e) => {
            e.stopPropagation() // Prevent card click
            setEditingSeries(series)
          }}>
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
          <Button variant="outline" onClick={() => setIsUploadingEpisode(true)}>
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

      {/* Create Series Dialog */}
      <Dialog open={isCreatingSeries} onOpenChange={setIsCreatingSeries}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Podcast Series</DialogTitle>
            <DialogDescription>
              Set up a new podcast series with all the necessary details for multi-platform distribution.
            </DialogDescription>
          </DialogHeader>
          <CreateSeriesForm onClose={() => setIsCreatingSeries(false)} onSubmit={async (seriesData) => {
            try {
              const formData = new FormData()
              Object.entries(seriesData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                  formData.append(key, value.toString())
                }
              })
              
              const response = await fetch('/api/podcast-studio/series', {
                method: 'POST',
                body: formData
              })
              
              if (response.ok) {
                await loadSeries() // Refresh series list
                setIsCreatingSeries(false)
                console.log('Series created successfully!')
              } else {
                const error = await response.json()
                console.error('Failed to create series:', error.error)
              }
            } catch (error) {
              console.error('Error creating series:', error)
            }
          }} />
        </DialogContent>
      </Dialog>

      {/* Upload Episode Dialog */}
      <Dialog open={isUploadingEpisode} onOpenChange={setIsUploadingEpisode}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Upload New Episode</DialogTitle>
            <DialogDescription>
              Upload and configure a new podcast episode for your series.
            </DialogDescription>
          </DialogHeader>
          <UploadEpisodeForm 
            series={series} 
            onClose={() => setIsUploadingEpisode(false)} 
            onSubmit={async (episodeData) => {
              try {
                const formData = new FormData()
                Object.entries(episodeData).forEach(([key, value]) => {
                  if (value !== null && value !== undefined) {
                    if (key === 'audioFile' && value instanceof File) {
                      formData.append(key, value)
                    } else {
                      formData.append(key, value.toString())
                    }
                  }
                })
                
                const response = await fetch('/api/podcast-studio/episodes', {
                  method: 'POST',
                  body: formData
                })
                
                if (response.ok) {
                  await loadEpisodes() // Refresh episodes list
                  await loadSeries() // Refresh series (for episode count)
                  setIsUploadingEpisode(false)
                  console.log('Episode uploaded successfully!')
                } else {
                  const error = await response.json()
                  console.error('Failed to upload episode:', error.error)
                }
              } catch (error) {
                console.error('Error uploading episode:', error)
              }
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* Edit Series Dialog */}
      <Dialog open={!!editingSeries} onOpenChange={() => setEditingSeries(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Series: {editingSeries?.name}</DialogTitle>
            <DialogDescription>
              Edit series settings, manage platforms, or delete the series.
            </DialogDescription>
          </DialogHeader>
          {editingSeries && (
            <EditSeriesForm 
              series={editingSeries} 
              onClose={() => setEditingSeries(null)} 
              onSave={async (updatedSeries) => {
                try {
                  const formData = new FormData()
                  Object.entries(updatedSeries).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                      if (key === 'artwork' && value instanceof File) {
                        formData.append(key, value)
                      } else if (typeof value === 'object') {
                        formData.append(key, JSON.stringify(value))
                      } else {
                        formData.append(key, value.toString())
                      }
                    }
                  })
                  
                  const response = await fetch('/api/podcast-studio/series', {
                    method: 'PUT',
                    body: formData
                  })
                  
                  if (response.ok) {
                    await loadSeries() // Refresh series list
                    setEditingSeries(null)
                    console.log('Series updated successfully!')
                  } else {
                    const error = await response.json()
                    console.error('Failed to update series:', error.error)
                  }
                } catch (error) {
                  console.error('Error updating series:', error)
                }
              }}
              onDelete={async () => {
                try {
                  const response = await fetch(`/api/podcast-studio/series?id=${editingSeries.id}`, {
                    method: 'DELETE'
                  })
                  
                  if (response.ok) {
                    await loadSeries() // Refresh series list
                    setEditingSeries(null)
                    console.log('Series deleted successfully!')
                  } else {
                    const error = await response.json()
                    console.error('Failed to delete series:', error.error)
                  }
                } catch (error) {
                  console.error('Error deleting series:', error)
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Form component for creating new series
function CreateSeriesForm({ onClose, onSubmit }: { onClose: () => void, onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Technology',
    language: 'en-US',
    author: 'Milav Dabgar',
    email: 'mail@milav.in',
    website: 'https://milav.in',
    explicit: false,
    artwork: null as File | null
  })

  const categories = [
    'Technology', 'Education', 'Business', 'Science', 'Health', 'News', 
    'Sports', 'Entertainment', 'Arts', 'History', 'Comedy', 'Documentary'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, artwork: file }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[600px] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="series-name">Series Name *</Label>
          <Input
            id="series-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="My Awesome Podcast"
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe your podcast series..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            value={formData.author}
            onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="email">Contact Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="website">Website URL</Label>
        <Input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="artwork">Series Artwork (JPG/PNG, 1400x1400 minimum)</Label>
        <Input
          id="artwork"
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileChange}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="explicit"
          checked={formData.explicit}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, explicit: checked }))}
        />
        <Label htmlFor="explicit">Contains explicit content</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.name}>
          Create Series
        </Button>
      </DialogFooter>
    </form>
  )
}

// Form component for uploading episodes
function UploadEpisodeForm({ series, onClose, onSubmit }: { 
  series: PodcastSeries[], 
  onClose: () => void, 
  onSubmit: (data: any) => void 
}) {
  const [formData, setFormData] = useState({
    seriesId: '',
    title: '',
    description: '',
    audioFile: null as File | null,
    duration: '',
    explicit: false,
    season: 1,
    episode: 1,
    publishDate: new Date().toISOString().split('T')[0],
    tags: '',
    transcript: ''
  })

  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          onSubmit(formData)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, audioFile: file }))
      // You could calculate duration here using audio APIs
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[600px] overflow-y-auto">
      <div>
        <Label htmlFor="episode-series">Select Series *</Label>
        <Select value={formData.seriesId} onValueChange={(value) => setFormData(prev => ({ ...prev, seriesId: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a series..." />
          </SelectTrigger>
          <SelectContent>
            {series.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="episode-title">Episode Title *</Label>
        <Input
          id="episode-title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Episode title..."
          required
        />
      </div>

      <div>
        <Label htmlFor="episode-description">Episode Description</Label>
        <Textarea
          id="episode-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe this episode..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="audio-file">Audio File * (MP3, M4A, WAV)</Label>
        <Input
          id="audio-file"
          type="file"
          accept="audio/mp3,audio/mpeg,audio/m4a,audio/wav"
          onChange={handleAudioChange}
          required
        />
        {formData.audioFile && (
          <p className="text-sm text-muted-foreground mt-1">
            Selected: {formData.audioFile.name} ({Math.round(formData.audioFile.size / 1024 / 1024)} MB)
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="season">Season</Label>
          <Input
            id="season"
            type="number"
            min="1"
            value={formData.season}
            onChange={(e) => setFormData(prev => ({ ...prev, season: parseInt(e.target.value) }))}
          />
        </div>
        <div>
          <Label htmlFor="episode">Episode Number</Label>
          <Input
            id="episode"
            type="number"
            min="1"
            value={formData.episode}
            onChange={(e) => setFormData(prev => ({ ...prev, episode: parseInt(e.target.value) }))}
          />
        </div>
        <div>
          <Label htmlFor="publish-date">Publish Date</Label>
          <Input
            id="publish-date"
            type="date"
            value={formData.publishDate}
            onChange={(e) => setFormData(prev => ({ ...prev, publishDate: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          placeholder="AI, technology, research"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="episode-explicit"
          checked={formData.explicit}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, explicit: checked }))}
        />
        <Label htmlFor="episode-explicit">Contains explicit content</Label>
      </div>

      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
          <p className="text-sm text-center mt-2">Uploading... {uploadProgress}%</p>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.seriesId || !formData.title || !formData.audioFile || isUploading}>
          {isUploading ? 'Uploading...' : 'Upload Episode'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Form component for editing series
function EditSeriesForm({ series, onClose, onSave, onDelete }: { 
  series: PodcastSeries, 
  onClose: () => void, 
  onSave: (data: PodcastSeries) => void,
  onDelete: () => void
}) {
  const [formData, setFormData] = useState({
    ...series,
    artwork: null as File | null
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const categories = [
    'Technology', 'Education', 'Business', 'Science', 'Health', 'News', 
    'Sports', 'Entertainment', 'Arts', 'History', 'Comedy', 'Documentary'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { artwork, ...seriesData } = formData
    onSave(seriesData as PodcastSeries)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, artwork: file }))
    }
  }

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete()
    } else {
      setShowDeleteConfirm(true)
      setTimeout(() => setShowDeleteConfirm(false), 5000) // Reset after 5 seconds
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[600px] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-series-name">Series Name *</Label>
          <Input
            id="edit-series-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-author">Author</Label>
          <Input
            id="edit-author"
            value={formData.author}
            onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="edit-email">Contact Email</Label>
          <Input
            id="edit-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="edit-website">Website URL</Label>
        <Input
          id="edit-website"
          type="url"
          value={formData.website}
          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="edit-artwork">Update Artwork (JPG/PNG, 1400x1400 minimum)</Label>
        <Input
          id="edit-artwork"
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileChange}
        />
        <p className="text-sm text-muted-foreground mt-1">Leave empty to keep current artwork</p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="edit-explicit"
          checked={formData.explicit}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, explicit: checked }))}
        />
        <Label htmlFor="edit-explicit">Contains explicit content</Label>
      </div>

      {/* Platform Status */}
      <div>
        <Label>Platform Distribution Status</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {Object.entries(formData.platforms).map(([platform, config]) => {
            const icons = {
              youtube: <Youtube className="h-4 w-4" />,
              spotify: <Music className="h-4 w-4" />,
              apple: <Apple className="h-4 w-4" />,
              google: <Podcast className="h-4 w-4" />,
              amazon: <Music className="h-4 w-4" />
            }

            const statusColors = {
              connected: 'text-green-600',
              pending: 'text-yellow-600',
              approved: 'text-green-600',
              not_connected: 'text-gray-600'
            }

            return (
              <div key={platform} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  {icons[platform as keyof typeof icons]}
                  <span className="capitalize">{platform}</span>
                </div>
                <Badge 
                  variant={(config.status === 'connected' || config.status === 'approved') ? 'default' : 'secondary'}
                  className={statusColors[(config.status || 'not_connected') as keyof typeof statusColors]}
                >
                  {(config.status || 'not_connected').replace('_', ' ')}
                </Badge>
              </div>
            )
          })}
        </div>
      </div>

      <DialogFooter className="flex justify-between">
        <Button 
          type="button" 
          variant={showDeleteConfirm ? "destructive" : "outline"}
          onClick={handleDelete}
          className="mr-auto"
        >
          {showDeleteConfirm ? (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Confirm Delete
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Series
            </>
          )}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!formData.name}>
            Save Changes
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}