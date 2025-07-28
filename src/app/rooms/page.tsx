"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Building, 
  MapPin, 
  Users, 
  Clock, 
  Plus,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Eye,
  Settings,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BookOpen,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Room {
  id: string;
  roomNumber: string;
  building: string;
  floor: number;
  capacity: number;
  type: 'lecture' | 'lab' | 'seminar' | 'auditorium';
  amenities: string[];
  status: 'available' | 'occupied' | 'maintenance';
  location: string;
}

interface RoomUtilization {
  roomId: string;
  roomNumber: string;
  totalSlots: number;
  occupiedSlots: number;
  utilizationPercentage: number;
  peakHours: string[];
  currentStatus: 'available' | 'occupied' | 'maintenance';
  nextAvailable?: string;
  todaySchedule: {
    timeSlot: string;
    subject: string;
    faculty: string;
    batch: string;
  }[];
}

interface BookingRequest {
  id: string;
  roomId: string;
  roomNumber: string;
  requestedBy: string;
  purpose: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  attendeeCount: number;
}

interface RoomMetrics {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  avgUtilization: number;
  pendingBookings: number;
}

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string;
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookiePart = parts.pop();
    if (cookiePart) {
        return cookiePart.split(';').shift();
    }
  }
  return undefined;
}

const getRoomTypeColor = (type: Room['type']) => {
  switch (type) {
    case 'lecture': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'lab': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'seminar': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'auditorium': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'occupied': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = "blue" }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  trend?: { value: number; isPositive: boolean };
  color?: string;
}) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl sm:text-3xl font-bold">{value}</p>
            {trend && (
              <Badge variant={trend.isPositive ? "default" : "destructive"} className="text-xs">
                {trend.isPositive ? "+" : ""}{trend.value}%
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          <Icon className={`h-6 w-6 sm:h-8 sm:w-8 text-${color}-500`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function RoomManagementPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomUtilization, setRoomUtilization] = useState<RoomUtilization[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [roomMetrics, setRoomMetrics] = useState<RoomMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch {
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    }
  }, [toast]);

  useEffect(() => {
    const fetchRoomData = async () => {
      setIsLoading(true);
      try {
        // Mock data - replace with actual API calls
        const mockRooms: Room[] = [
          {
            id: '1',
            roomNumber: 'A101',
            building: 'Academic Block A',
            floor: 1,
            capacity: 60,
            type: 'lecture',
            amenities: ['Projector', 'Whiteboard', 'AC', 'WiFi'],
            status: 'available',
            location: 'Ground Floor, East Wing'
          },
          {
            id: '2',
            roomNumber: 'B201',
            building: 'Academic Block B',
            floor: 2,
            capacity: 40,
            type: 'lab',
            amenities: ['Computers', 'Projector', 'AC', 'WiFi', 'Power Outlets'],
            status: 'occupied',
            location: 'Second Floor, North Wing'
          },
          {
            id: '3',
            roomNumber: 'C301',
            building: 'Academic Block C',
            floor: 3,
            capacity: 25,
            type: 'seminar',
            amenities: ['Smart Board', 'Conference Table', 'AC', 'WiFi'],
            status: 'available',
            location: 'Third Floor, Central Wing'
          },
          {
            id: '4',
            roomNumber: 'D401',
            building: 'Academic Block D',
            floor: 4,
            capacity: 80,
            type: 'lab',
            amenities: ['Computers', 'Projector', 'AC', 'WiFi', 'Server Room'],
            status: 'maintenance',
            location: 'Fourth Floor, West Wing'
          },
          {
            id: '5',
            roomNumber: 'Main Hall',
            building: 'Central Building',
            floor: 1,
            capacity: 500,
            type: 'auditorium',
            amenities: ['Stage', 'Audio System', 'Projector', 'AC', 'WiFi', 'Recording Equipment'],
            status: 'available',
            location: 'Ground Floor, Main Building'
          }
        ];

        const mockUtilization: RoomUtilization[] = [
          {
            roomId: '1',
            roomNumber: 'A101',
            totalSlots: 8,
            occupiedSlots: 6,
            utilizationPercentage: 75,
            peakHours: ['10:00-11:00', '14:00-15:00'],
            currentStatus: 'available',
            nextAvailable: '16:00',
            todaySchedule: [
              { timeSlot: '09:00-10:00', subject: 'Mathematics', faculty: 'Dr. Smith', batch: 'CS-A' },
              { timeSlot: '10:00-11:00', subject: 'Physics', faculty: 'Prof. Johnson', batch: 'EE-B' },
              { timeSlot: '14:00-15:00', subject: 'Chemistry', faculty: 'Dr. Brown', batch: 'ME-C' }
            ]
          },
          {
            roomId: '2',
            roomNumber: 'B201',
            totalSlots: 8,
            occupiedSlots: 7,
            utilizationPercentage: 88,
            peakHours: ['11:00-12:00', '15:00-16:00'],
            currentStatus: 'occupied',
            nextAvailable: '17:00',
            todaySchedule: [
              { timeSlot: '09:00-10:00', subject: 'Data Structures Lab', faculty: 'Prof. Davis', batch: 'CS-A' },
              { timeSlot: '11:00-12:00', subject: 'Database Lab', faculty: 'Dr. Wilson', batch: 'CS-B' },
              { timeSlot: '15:00-16:00', subject: 'Network Lab', faculty: 'Prof. Taylor', batch: 'CS-C' }
            ]
          }
        ];

        const mockBookingRequests: BookingRequest[] = [
          {
            id: '1',
            roomId: '3',
            roomNumber: 'C301',
            requestedBy: 'Dr. Sarah Johnson',
            purpose: 'Faculty Meeting',
            date: new Date('2024-07-29'),
            startTime: '14:00',
            endTime: '16:00',
            status: 'pending',
            priority: 'high',
            attendeeCount: 15
          },
          {
            id: '2',
            roomId: '5',
            roomNumber: 'Main Hall',
            requestedBy: 'Student Council',
            purpose: 'Cultural Event',
            date: new Date('2024-08-01'),
            startTime: '18:00',
            endTime: '21:00',
            status: 'pending',
            priority: 'medium',
            attendeeCount: 200
          },
          {
            id: '3',
            roomId: '1',
            roomNumber: 'A101',
            requestedBy: 'Prof. Michael Brown',
            purpose: 'Guest Lecture',
            date: new Date('2024-07-30'),
            startTime: '10:00',
            endTime: '12:00',
            status: 'approved',
            priority: 'medium',
            attendeeCount: 50
          }
        ];

        const mockMetrics: RoomMetrics = {
          totalRooms: mockRooms.length,
          availableRooms: mockRooms.filter(r => r.status === 'available').length,
          occupiedRooms: mockRooms.filter(r => r.status === 'occupied').length,
          maintenanceRooms: mockRooms.filter(r => r.status === 'maintenance').length,
          avgUtilization: Math.round(mockUtilization.reduce((acc, r) => acc + r.utilizationPercentage, 0) / mockUtilization.length),
          pendingBookings: mockBookingRequests.filter(b => b.status === 'pending').length
        };

        setRooms(mockRooms);
        setRoomUtilization(mockUtilization);
        setBookingRequests(mockBookingRequests);
        setRoomMetrics(mockMetrics);

      } catch (error) {
        console.error("Error fetching room data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load room data." });
      }
      setIsLoading(false);
    };

    fetchRoomData();
  }, [toast]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           room.building.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || room.type === filterType;
      const matchesStatus = filterStatus === 'all' || room.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [rooms, searchTerm, filterType, filterStatus]);

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject') => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBookingRequests(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: action === 'approve' ? 'approved' : 'rejected' }
            : booking
        )
      );
      
      toast({
        title: `Booking ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `The booking request has been ${action === 'approve' ? 'approved' : 'rejected'} successfully.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${action} booking request. Please try again.`
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <Card className="shadow-xl">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-primary flex items-center gap-2">
                <Building className="h-5 w-5 sm:h-6 sm:w-6" /> 
                Room Management & Booking System
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Manage room utilization, bookings, and facility resources.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Refresh </span>Data
              </Button>
              <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">New </span>Booking
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Booking</DialogTitle>
                    <DialogDescription>Request a room booking for your event or class.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">Booking form would be implemented here with room selection, date/time picker, and purpose details.</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsBookingDialogOpen(false)}>
                      Submit Request
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      {roomMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
          <MetricCard
            title="Total Rooms"
            value={roomMetrics.totalRooms}
            subtitle="Managed facilities"
            icon={Building}
            color="blue"
          />
          <MetricCard
            title="Available"
            value={roomMetrics.availableRooms}
            subtitle="Ready for use"
            icon={CheckCircle}
            color="green"
          />
          <MetricCard
            title="Occupied"
            value={roomMetrics.occupiedRooms}
            subtitle="Currently in use"
            icon={Users}
            color="red"
          />
          <MetricCard
            title="Maintenance"
            value={roomMetrics.maintenanceRooms}
            subtitle="Under repair"
            icon={AlertTriangle}
            color="yellow"
          />
          <MetricCard
            title="Utilization"
            value={`${roomMetrics.avgUtilization}%`}
            subtitle="Average usage"
            icon={TrendingUp}
            trend={{ value: 8, isPositive: true }}
            color="purple"
          />
          <MetricCard
            title="Pending"
            value={roomMetrics.pendingBookings}
            subtitle="Booking requests"
            icon={Clock}
            color="orange"
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="rooms" className="text-xs sm:text-sm">Rooms</TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs sm:text-sm">Bookings</TabsTrigger>
            <TabsTrigger value="utilization" className="text-xs sm:text-sm">Usage</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Current Room Status */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base sm:text-lg">Real-time Room Status</CardTitle>
                <CardDescription className="text-sm">Current availability across all facilities</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 sm:space-y-4">
                  {rooms.slice(0, 5).map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm sm:text-base">{room.roomNumber}</h4>
                          <Badge className={`${getRoomTypeColor(room.type)} text-xs`}>
                            {room.type}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {room.building} • Capacity: {room.capacity}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(room.status)} text-xs ml-2`}>
                        {room.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Booking Requests */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base sm:text-lg">Your Requests</CardTitle>
                <CardDescription className="text-sm">Your recent booking requests</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 sm:space-y-4">
                  {bookingRequests.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="p-2 sm:p-3 border rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm sm:text-base">{booking.roomNumber}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">{booking.purpose}</p>
                        </div>
                        <Badge className={`${getStatusColor(booking.status)} text-xs self-start sm:self-auto`}>
                          {booking.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        <p>{booking.date.toLocaleDateString()} • {booking.startTime}-{booking.endTime}</p>
                      </div>
                    </div>
                  ))}
                  <div className="text-center py-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setIsBookingDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Request New Booking
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4 sm:space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="lecture">Lecture</SelectItem>
                <SelectItem value="lab">Lab</SelectItem>
                <SelectItem value="seminar">Seminar</SelectItem>
                <SelectItem value="auditorium">Auditorium</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Room Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredRooms.map((room) => (
              <Card key={room.id} className="border hover:shadow-lg transition-shadow">
                <CardHeader className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                        {room.roomNumber}
                        <Badge className={`${getRoomTypeColor(room.type)} text-xs`}>
                          {room.type}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {room.building} • Floor {room.floor}
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(room.status)} text-xs shrink-0`}>
                      {room.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div>
                        <span className="text-muted-foreground">Capacity:</span>
                        <div className="font-medium flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {room.capacity}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Location:</span>
                        <div className="font-medium flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{room.location.split(',')[0]}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs sm:text-sm text-muted-foreground">Amenities:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {room.amenities.slice(0, 3).map((amenity) => (
                          <Badge key={amenity} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {room.amenities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{room.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs sm:text-sm"
                        onClick={() => setSelectedRoom(room)}
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs sm:text-sm"
                        disabled={room.status !== 'available'}
                        onClick={() => setIsBookingDialogOpen(true)}
                      >
                        <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Book
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRooms.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <Building className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm sm:text-base">
                No rooms found matching your search criteria.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4 sm:space-y-6">
          <div className="space-y-4">
            {bookingRequests.map((booking) => (
              <Card key={booking.id} className="border">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h4 className="font-semibold text-sm sm:text-base">{booking.roomNumber}</h4>
                        <Badge className={`${getStatusColor(booking.status)} text-xs self-start sm:self-auto`}>
                          {booking.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs self-start sm:self-auto">
                          {booking.priority.toUpperCase()} PRIORITY
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs sm:text-sm">
                        <div>
                          <span className="text-muted-foreground">Purpose:</span>
                          <div className="font-medium">{booking.purpose}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Requested by:</span>
                          <div className="font-medium">{booking.requestedBy}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date & Time:</span>
                          <div className="font-medium">
                            {booking.date.toLocaleDateString()} • {booking.startTime}-{booking.endTime}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Attendees:</span>
                          <div className="font-medium flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {booking.attendeeCount}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="utilization" className="space-y-4 sm:space-y-6">
          <div className="space-y-4 sm:space-y-6">
            {roomUtilization.map((util) => (
              <Card key={util.roomId} className="border">
                <CardHeader className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">Room {util.roomNumber}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(util.currentStatus)} text-xs`}>
                        {util.currentStatus.toUpperCase()}
                      </Badge>
                      <Badge 
                        className={`text-xs ${
                          util.utilizationPercentage >= 80 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : util.utilizationPercentage >= 60
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {util.utilizationPercentage}% utilized
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>Daily Utilization</span>
                      <span>{util.occupiedSlots}/{util.totalSlots} time slots</span>
                    </div>
                    <Progress value={util.utilizationPercentage} className="h-2 sm:h-3" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs sm:text-sm text-muted-foreground">Peak Hours:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {util.peakHours.map((hour) => (
                            <Badge key={hour} variant="outline" className="text-xs">
                              {hour}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {util.nextAvailable && (
                        <div>
                          <span className="text-xs sm:text-sm text-muted-foreground">Next Available:</span>
                          <div className="font-medium text-sm sm:text-base">{util.nextAvailable}</div>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-xs sm:text-sm text-muted-foreground font-medium">Today's Schedule:</span>
                      <div className="mt-2 space-y-2">
                        {util.todaySchedule.map((schedule, index) => (
                          <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-muted rounded text-xs sm:text-sm">
                            <div className="flex-1">
                              <span className="font-medium">{schedule.timeSlot}</span>
                              <span className="mx-2">•</span>
                              <span>{schedule.subject}</span>
                            </div>
                            <div className="text-muted-foreground">
                              {schedule.faculty} • {schedule.batch}
                            </div>
                          </div>
                        ))}
                        {util.todaySchedule.length === 0 && (
                          <div className="text-center py-4 text-xs sm:text-sm text-muted-foreground">
                            No classes scheduled for today
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}