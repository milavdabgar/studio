'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  MapPin, 
  TrendingUp, 
  TrendingDown,
  Users,
  Building,
  Activity,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import type { Room, Timetable, TimetableEntry } from '@/types/entities';

interface RoomUtilization {
  roomId: string;
  roomName: string;
  roomNumber: string;
  buildingId: string;
  capacity: number;
  type: string;
  utilizationPercentage: number;
  totalHours: number;
  bookedHours: number;
  availableHours: number;
  peakHours: { hour: string; count: number }[];
  dailyUtilization: { [day: string]: number };
  weeklyTrend: { week: string; utilization: number }[];
  conflicts: number;
  maintenanceScheduled: boolean;
  averageOccupancy: number;
  status: 'optimal' | 'underutilized' | 'overutilized' | 'maintenance';
}

interface RoomBooking {
  id: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
  bookedBy: string;
  purpose: string;
  attendees: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  isRecurring: boolean;
  courseId?: string;
  facultyId?: string;
}

interface UtilizationSummary {
  totalRooms: number;
  averageUtilization: number;
  optimalRooms: number;
  underutilizedRooms: number;
  overutilizedRooms: number;
  maintenanceRooms: number;
  totalConflicts: number;
  utilizationTrend: 'up' | 'down' | 'stable';
}

export default function RoomUtilizationPage() {
  const [utilizations, setUtilizations] = useState<RoomUtilization[]>([]);
  const [summary, setSummary] = useState<UtilizationSummary | null>(null);
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    to: new Date()
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'chart'>('grid');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`);

  useEffect(() => {
    fetchUtilizationData();
  }, [dateRange, selectedBuilding, selectedRoomType]);

  const fetchUtilizationData = async () => {
    setLoading(true);
    try {
      // Simulate API call to fetch room utilization data
      const [utilizationData, summaryData, bookingData] = await Promise.all([
        fetchRoomUtilizations(),
        fetchUtilizationSummary(),
        fetchRoomBookings()
      ]);

      setUtilizations(utilizationData);
      setSummary(summaryData);
      setBookings(bookingData);
    } catch (error) {
      console.error('Failed to fetch utilization data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data generation functions
  const fetchRoomUtilizations = async (): Promise<RoomUtilization[]> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      {
        roomId: 'room1',
        roomName: 'Lecture Hall A',
        roomNumber: '101',
        buildingId: 'building1',
        capacity: 100,
        type: 'Lecture Hall',
        utilizationPercentage: 85,
        totalHours: 60,
        bookedHours: 51,
        availableHours: 9,
        peakHours: [
          { hour: '10:00', count: 12 },
          { hour: '14:00', count: 10 },
          { hour: '11:00', count: 8 }
        ],
        dailyUtilization: {
          Monday: 90,
          Tuesday: 85,
          Wednesday: 80,
          Thursday: 88,
          Friday: 75,
          Saturday: 45
        },
        weeklyTrend: [
          { week: 'Week 1', utilization: 82 },
          { week: 'Week 2', utilization: 85 },
          { week: 'Week 3', utilization: 88 },
          { week: 'Week 4', utilization: 85 }
        ],
        conflicts: 2,
        maintenanceScheduled: false,
        averageOccupancy: 78,
        status: 'optimal'
      },
      {
        roomId: 'room2',
        roomName: 'Computer Lab 1',
        roomNumber: '205',
        buildingId: 'building2',
        capacity: 40,
        type: 'Computer Lab',
        utilizationPercentage: 45,
        totalHours: 60,
        bookedHours: 27,
        availableHours: 33,
        peakHours: [
          { hour: '09:00', count: 5 },
          { hour: '15:00', count: 4 },
          { hour: '13:00', count: 3 }
        ],
        dailyUtilization: {
          Monday: 50,
          Tuesday: 40,
          Wednesday: 45,
          Thursday: 48,
          Friday: 35,
          Saturday: 25
        },
        weeklyTrend: [
          { week: 'Week 1', utilization: 48 },
          { week: 'Week 2', utilization: 45 },
          { week: 'Week 3', utilization: 42 },
          { week: 'Week 4', utilization: 45 }
        ],
        conflicts: 0,
        maintenanceScheduled: true,
        averageOccupancy: 32,
        status: 'underutilized'
      },
      {
        roomId: 'room3',
        roomName: 'Seminar Hall',
        roomNumber: '301',
        buildingId: 'building1',
        capacity: 150,
        type: 'Seminar Hall',
        utilizationPercentage: 95,
        totalHours: 60,
        bookedHours: 57,
        availableHours: 3,
        peakHours: [
          { hour: '11:00', count: 15 },
          { hour: '14:00', count: 14 },
          { hour: '10:00', count: 13 }
        ],
        dailyUtilization: {
          Monday: 100,
          Tuesday: 95,
          Wednesday: 98,
          Thursday: 92,
          Friday: 88,
          Saturday: 70
        },
        weeklyTrend: [
          { week: 'Week 1', utilization: 92 },
          { week: 'Week 2', utilization: 95 },
          { week: 'Week 3', utilization: 98 },
          { week: 'Week 4', utilization: 95 }
        ],
        conflicts: 5,
        maintenanceScheduled: false,
        averageOccupancy: 125,
        status: 'overutilized'
      }
    ];
  };

  const fetchUtilizationSummary = async (): Promise<UtilizationSummary> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      totalRooms: 45,
      averageUtilization: 72,
      optimalRooms: 28,
      underutilizedRooms: 12,
      overutilizedRooms: 4,
      maintenanceRooms: 1,
      totalConflicts: 7,
      utilizationTrend: 'up'
    };
  };

  const fetchRoomBookings = async (): Promise<RoomBooking[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return [
      {
        id: 'booking1',
        roomId: 'room1',
        startTime: new Date('2024-07-28T10:00:00'),
        endTime: new Date('2024-07-28T12:00:00'),
        bookedBy: 'Prof. Smith',
        purpose: 'Data Structures Lecture',
        attendees: 85,
        status: 'confirmed',
        isRecurring: true,
        courseId: 'CS101',
        facultyId: 'faculty1'
      },
      {
        id: 'booking2',
        roomId: 'room2',
        startTime: new Date('2024-07-28T14:00:00'),
        endTime: new Date('2024-07-28T16:00:00'),
        bookedBy: 'Dr. Johnson',
        purpose: 'Programming Lab',
        attendees: 30,
        status: 'confirmed',
        isRecurring: true,
        courseId: 'CS102',
        facultyId: 'faculty2'
      }
    ];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'underutilized':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'overutilized':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'maintenance':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'underutilized':
        return <TrendingDown className="h-4 w-4 text-yellow-600" />;
      case 'overutilized':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'maintenance':
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const exportData = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/rooms/utilization/export?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange,
          building: selectedBuilding,
          roomType: selectedRoomType
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `room-utilization.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Room Utilization Dashboard</h1>
          <p className="text-gray-600">Monitor and optimize room usage across campus</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Buildings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buildings</SelectItem>
              <SelectItem value="building1">Building A</SelectItem>
              <SelectItem value="building2">Building B</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Room Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Lecture Hall">Lecture Halls</SelectItem>
              <SelectItem value="Computer Lab">Computer Labs</SelectItem>
              <SelectItem value="Seminar Hall">Seminar Halls</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => exportData('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button variant="outline" onClick={fetchUtilizationData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Rooms</p>
                  <p className="text-2xl font-bold">{summary.totalRooms}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Avg Utilization</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{summary.averageUtilization}%</p>
                    {summary.utilizationTrend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : summary.utilizationTrend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <Activity className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Optimal Rooms</p>
                  <p className="text-2xl font-bold">{summary.optimalRooms}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Conflicts</p>
                  <p className="text-2xl font-bold">{summary.totalConflicts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="chart">Analytics</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="grid" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {utilizations.map((room) => (
              <Card key={room.roomId} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{room.roomName}</h3>
                      <p className="text-sm text-gray-600">
                        Room {room.roomNumber} • {room.type}
                      </p>
                      <p className="text-sm text-gray-600">
                        Capacity: {room.capacity} • Avg: {room.averageOccupancy}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full border flex items-center gap-1 ${getStatusColor(room.status)}`}>
                      {getStatusIcon(room.status)}
                      <span className="text-xs font-medium capitalize">{room.status}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Utilization</span>
                        <span className="text-sm font-bold">{room.utilizationPercentage}%</span>
                      </div>
                      <Progress value={room.utilizationPercentage} className="h-2" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-blue-600">{room.bookedHours}</p>
                        <p className="text-xs text-gray-600">Booked</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">{room.availableHours}</p>
                        <p className="text-xs text-gray-600">Available</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-red-600">{room.conflicts}</p>
                        <p className="text-xs text-gray-600">Conflicts</p>
                      </div>
                    </div>

                    {room.maintenanceScheduled && (
                      <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">Maintenance scheduled</span>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <h4 className="text-sm font-medium mb-2">Peak Hours</h4>
                      <div className="space-y-1">
                        {room.peakHours.slice(0, 3).map((peak, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span>{peak.hour}</span>
                            <span className="font-medium">{peak.count} bookings</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-medium">Room</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Capacity</th>
                      <th className="text-left p-4 font-medium">Utilization</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Conflicts</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {utilizations.map((room) => (
                      <tr key={room.roomId} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{room.roomName}</div>
                            <div className="text-sm text-gray-600">Room {room.roomNumber}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{room.type}</Badge>
                        </td>
                        <td className="p-4">
                          <div className="text-center">
                            <div className="font-medium">{room.capacity}</div>
                            <div className="text-xs text-gray-600">Avg: {room.averageOccupancy}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="w-24">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{room.utilizationPercentage}%</span>
                            </div>
                            <Progress value={room.utilizationPercentage} className="h-2" />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${getStatusColor(room.status)}`}>
                            {getStatusIcon(room.status)}
                            <span className="capitalize">{room.status}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-center">
                            {room.conflicts > 0 ? (
                              <Badge variant="destructive">{room.conflicts}</Badge>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Calendar className="h-3 w-3 mr-1" />
                              Book
                            </Button>
                            <Button size="sm" variant="ghost">
                              Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Utilization Distribution</CardTitle>
                <CardDescription>Room utilization across different categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Optimal (70-85%)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-green-500 rounded-full" 
                          style={{ width: `${(summary?.optimalRooms || 0) / (summary?.totalRooms || 1) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold">{summary?.optimalRooms || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Underutilized (&lt;70%)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-yellow-500 rounded-full" 
                          style={{ width: `${(summary?.underutilizedRooms || 0) / (summary?.totalRooms || 1) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold">{summary?.underutilizedRooms || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overutilized (&gt;85%)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-red-500 rounded-full" 
                          style={{ width: `${(summary?.overutilizedRooms || 0) / (summary?.totalRooms || 1) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold">{summary?.overutilizedRooms || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Maintenance</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-gray-500 rounded-full" 
                          style={{ width: `${(summary?.maintenanceRooms || 0) / (summary?.totalRooms || 1) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold">{summary?.maintenanceRooms || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Utilization Pattern</CardTitle>
                <CardDescription>Average utilization across days of the week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {daysOfWeek.map((day) => {
                    const avgUtilization = utilizations.reduce((sum, room) => 
                      sum + (room.dailyUtilization[day] || 0), 0
                    ) / utilizations.length;
                    
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <div className="w-16 text-sm font-medium">{day.slice(0, 3)}</div>
                        <div className="flex-1">
                          <Progress value={avgUtilization} className="h-3" />
                        </div>
                        <div className="w-12 text-sm font-bold text-right">
                          {Math.round(avgUtilization)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Room Usage Heatmap</CardTitle>
                <CardDescription>Hourly usage pattern across the week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-13 gap-1 text-xs">
                    <div></div>
                    {timeSlots.map(time => (
                      <div key={time} className="text-center font-medium p-2">
                        {time}
                      </div>
                    ))}
                    
                    {daysOfWeek.map(day => (
                      <React.Fragment key={day}>
                        <div className="font-medium p-2 text-right">{day.slice(0, 3)}</div>
                        {timeSlots.map(time => {
                          const intensity = Math.random() * 100; // Mock data
                          const color = intensity > 80 ? 'bg-red-500' :
                                       intensity > 60 ? 'bg-orange-400' :
                                       intensity > 40 ? 'bg-yellow-400' :
                                       intensity > 20 ? 'bg-green-400' : 'bg-gray-200';
                          
                          return (
                            <div 
                              key={`${day}-${time}`}
                              className={`h-8 ${color} rounded flex items-center justify-center text-white text-xs font-medium`}
                              title={`${day} ${time}: ${Math.round(intensity)}% utilization`}
                            >
                              {Math.round(intensity)}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}