'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Settings,
  AlertCircle,
  Clock,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCalendarIntegrationService } from '@/lib/services/calendarIntegrationService';
import type { Timetable } from '@/types/entities';

interface CalendarProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  isConnected: boolean;
  lastSync?: Date;
}

interface SyncResult {
  success: boolean;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: string[];
}

interface CalendarIntegrationProps {
  timetable: Timetable;
  userId: string;
  semesterDates: {
    start: Date;
    end: Date;
  };
  className?: string;
}

export function CalendarIntegration({ 
  timetable, 
  userId, 
  semesterDates,
  className = '' 
}: CalendarIntegrationProps) {
  const [providers, setProviders] = useState<CalendarProvider[]>([]);
  const [syncResults, setSyncResults] = useState<Map<string, SyncResult>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [syncingProviders, setSyncingProviders] = useState<Set<string>>(new Set());
  const [autoSync, setAutoSync] = useState(true);
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const calendarService = getCalendarIntegrationService();

  useEffect(() => {
    loadProviders();
    loadSyncStatus();
  }, []);

  const loadProviders = async () => {
    try {
      const allProviders = calendarService.getAllProviders();
      setProviders(allProviders);
      
      // Set default selected providers
      const connectedProviders = allProviders.filter(p => p.isConnected);
      setSelectedProviders(new Set(connectedProviders.map(p => p.id)));
    } catch (error) {
      console.error('Failed to load providers:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load calendar providers"
      });
    }
  };

  const loadSyncStatus = async () => {
    try {
      const status = await calendarService.getSyncStatus(userId);
      // Update provider sync status
      setProviders(prev => prev.map(provider => ({
        ...provider,
        lastSync: status.get(provider.id)?.lastSync
      })));
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const connectProvider = async (providerId: string) => {
    setIsLoading(true);
    setSyncingProviders(prev => new Set([...prev, providerId]));

    try {
      let result;
      
      switch (providerId) {
        case 'google':
          result = await calendarService.connectGoogleCalendar(userId);
          break;
        case 'outlook':
          result = await calendarService.connectOutlookCalendar(userId);
          break;
        case 'apple':
          // Apple Calendar uses iCal export
          result = { success: true };
          break;
        default:
          result = { success: false, error: 'Unknown provider' };
      }

      if (result.success) {
        if (result.authUrl) {
          // Open OAuth flow
          window.open(result.authUrl, '_blank', 'width=600,height=600');
        }
        
        toast({
          title: "Connected Successfully",
          description: `Connected to ${providers.find(p => p.id === providerId)?.name}`
        });
        
        await loadProviders();
      } else {
        throw new Error(result.error || 'Connection failed');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Failed to connect'
      });
    } finally {
      setIsLoading(false);
      setSyncingProviders(prev => {
        const newSet = new Set(prev);
        newSet.delete(providerId);
        return newSet;
      });
    }
  };

  const syncToProvider = async (providerId: string) => {
    setSyncingProviders(prev => new Set([...prev, providerId]));

    try {
      let result: SyncResult;

      switch (providerId) {
        case 'google':
          result = await calendarService.syncToGoogleCalendar(userId, timetable, 'primary', semesterDates);
          break;
        case 'outlook':
          result = await calendarService.syncToOutlookCalendar(userId, timetable, semesterDates);
          break;
        case 'apple':
          const appleResult = await calendarService.addToAppleCalendar(timetable, semesterDates);
          result = {
            success: appleResult.success,
            eventsCreated: appleResult.success ? timetable.entries.length : 0,
            eventsUpdated: 0,
            eventsDeleted: 0,
            errors: appleResult.error ? [appleResult.error] : []
          };
          break;
        default:
          throw new Error('Unknown provider');
      }

      setSyncResults(prev => new Map(prev.set(providerId, result)));

      if (result.success) {
        toast({
          title: "Sync Successful",
          description: `Created ${result.eventsCreated} events in ${providers.find(p => p.id === providerId)?.name}`
        });
        await loadProviders();
      } else {
        throw new Error(result.errors.join(', ') || 'Sync failed');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error instanceof Error ? error.message : 'Failed to sync'
      });
    } finally {
      setSyncingProviders(prev => {
        const newSet = new Set(prev);
        newSet.delete(providerId);
        return newSet;
      });
    }
  };

  const syncAllSelected = async () => {
    if (selectedProviders.size === 0) {
      toast({
        variant: "destructive",
        title: "No Providers Selected",
        description: "Please select at least one calendar provider"
      });
      return;
    }

    setIsLoading(true);
    setSyncingProviders(new Set(selectedProviders));

    try {
      const results = await calendarService.syncToMultipleProviders(
        userId,
        timetable,
        Array.from(selectedProviders),
        semesterDates
      );

      setSyncResults(results);

      let successCount = 0;
      let totalEvents = 0;

      for (const [providerId, result] of results) {
        if (result.success) {
          successCount++;
          totalEvents += result.eventsCreated;
        }
      }

      toast({
        title: "Bulk Sync Complete",
        description: `Successfully synced to ${successCount}/${selectedProviders.size} providers (${totalEvents} events created)`
      });

      await loadProviders();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Bulk Sync Failed",
        description: error instanceof Error ? error.message : 'Failed to sync'
      });
    } finally {
      setIsLoading(false);
      setSyncingProviders(new Set());
    }
  };

  const exportToICal = async () => {
    try {
      const result = await calendarService.exportToICalFile(timetable, semesterDates);
      
      if (result.success) {
        toast({
          title: "Export Successful",
          description: "iCal file has been downloaded"
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error instanceof Error ? error.message : 'Failed to export'
      });
    }
  };

  const disconnectProvider = async (providerId: string) => {
    try {
      const success = await calendarService.disconnectProvider(providerId, userId);
      
      if (success) {
        toast({
          title: "Disconnected",
          description: `Disconnected from ${providers.find(p => p.id === providerId)?.name}`
        });
        await loadProviders();
        setSelectedProviders(prev => {
          const newSet = new Set(prev);
          newSet.delete(providerId);
          return newSet;
        });
      } else {
        throw new Error('Disconnect failed');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Disconnect Failed",
        description: error instanceof Error ? error.message : 'Failed to disconnect'
      });
    }
  };

  const toggleProviderSelection = (providerId: string) => {
    setSelectedProviders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(providerId)) {
        newSet.delete(providerId);
      } else {
        newSet.add(providerId);
      }
      return newSet;
    });
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return '📅';
      case 'outlook':
        return '📧';
      case 'apple':
        return '🍎';
      default:
        return '📅';
    }
  };

  const getProviderColor = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return 'border-blue-500 bg-blue-50';
      case 'outlook':
        return 'border-indigo-500 bg-indigo-50';
      case 'apple':
        return 'border-gray-500 bg-gray-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Sync your timetable with popular calendar applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="providers" className="space-y-4">
            <TabsList>
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="sync">Sync Status</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="providers" className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={syncAllSelected}
                    disabled={isLoading || selectedProviders.size === 0}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Sync Selected ({selectedProviders.size})
                  </Button>
                  
                  <Button variant="outline" onClick={exportToICal} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export iCal
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Auto-sync</label>
                  <Switch checked={autoSync} onCheckedChange={setAutoSync} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((provider) => {
                  const isSelected = selectedProviders.has(provider.id);
                  const isSyncing = syncingProviders.has(provider.id);
                  const syncResult = syncResults.get(provider.id);
                  
                  return (
                    <Card 
                      key={provider.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${getProviderColor(provider.id)} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => provider.isConnected && toggleProviderSelection(provider.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getProviderIcon(provider.id)}</span>
                            <div>
                              <h3 className="font-semibold">{provider.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                {provider.isConnected ? (
                                  <Badge variant="default" className="gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Connected
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="gap-1">
                                    <XCircle className="h-3 w-3" />
                                    Not Connected
                                  </Badge>
                                )}
                                {isSyncing && (
                                  <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {provider.isConnected && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleProviderSelection(provider.id)}
                              className="rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </div>

                        {provider.lastSync && (
                          <div className="text-xs text-gray-600 mb-3">
                            Last sync: {provider.lastSync.toLocaleString()}
                          </div>
                        )}

                        {syncResult && (
                          <div className="text-xs space-y-1 mb-3">
                            {syncResult.success ? (
                              <div className="text-green-600">
                                ✓ {syncResult.eventsCreated} events created
                              </div>
                            ) : (
                              <div className="text-red-600">
                                ✗ {syncResult.errors.join(', ')}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          {!provider.isConnected ? (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                connectProvider(provider.id);
                              }}
                              disabled={isLoading}
                              className="flex-1"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Connect
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  syncToProvider(provider.id);
                                }}
                                disabled={isSyncing}
                                className="flex-1"
                              >
                                {isSyncing ? (
                                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                )}
                                Sync
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  disconnectProvider(provider.id);
                                }}
                              >
                                Disconnect
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="sync" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sync Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from(syncResults.entries()).map(([providerId, result]) => {
                      const provider = providers.find(p => p.id === providerId);
                      if (!provider) return null;

                      return (
                        <div key={providerId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{getProviderIcon(providerId)}</span>
                            <div>
                              <h4 className="font-semibold">{provider.name}</h4>
                              <div className="text-sm text-gray-600">
                                {result.success ? (
                                  <>
                                    {result.eventsCreated} created, {result.eventsUpdated} updated, {result.eventsDeleted} deleted
                                  </>
                                ) : (
                                  <span className="text-red-600">Sync failed</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {result.success ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {syncResults.size === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No sync operations performed yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Integration Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Auto-sync enabled</label>
                      <p className="text-sm text-gray-600">Automatically sync when timetable changes</p>
                    </div>
                    <Switch checked={autoSync} onCheckedChange={setAutoSync} />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Sync Frequency</h4>
                    <select className="w-full p-2 border rounded-md">
                      <option value="realtime">Real-time (immediate)</option>
                      <option value="hourly">Every hour</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Notification Preferences</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Notify on successful sync</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Notify on sync errors</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" />
                        <span className="text-sm">Weekly sync summary</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}