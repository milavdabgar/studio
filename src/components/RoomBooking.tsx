'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, Users, MapPin, AlertCircle, CheckCircle2, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Room } from '@/types/entities';

interface RoomBooking {
  id?: string;
  roomId: string;
  startDate: string;
  startTime: string;
  endTime: string;
  bookedBy: string;
  contactEmail: string;
  purpose: string;
  description?: string;
  expectedAttendees: number;
  isRecurring: boolean;
  recurrencePattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
    daysOfWeek?: string[];
  };
  equipment?: string[];
  specialRequirements?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

interface TimeSlot {
  time: string;
  available: boolean;
  bookedBy?: string;
  purpose?: string;
}

interface RoomBookingProps {
  selectedRoom?: Room;
  selectedDate?: Date;
  onBookingCreated?: (booking: RoomBooking) => void;
  mode?: 'dialog' | 'inline';
}

export function RoomBooking({ 
  selectedRoom, 
  selectedDate, 
  onBookingCreated,
  mode = 'dialog' 
}: RoomBookingProps) {
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<RoomBooking>({
    roomId: selectedRoom?.id || '',
    startDate: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    bookedBy: '',
    contactEmail: '',
    purpose: '',
    description: '',
    expectedAttendees: 1,
    isRecurring: false,
    equipment: [],
    status: 'pending'
  });
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const { toast } = useToast();

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const equipmentOptions = [
    'Projector', 'Whiteboard', 'Audio System', 'Microphone',
    'Computer', 'Video Conferencing', 'Smart Board', 'Screen'
  ];

  useEffect(() => {
    if (open || mode === 'inline') {
      fetchRooms();
    }
  }, [open, mode]);

  useEffect(() => {
    if (booking.roomId && booking.startDate) {
      checkAvailability();
    }
  }, [booking.roomId, booking.startDate]);

  useEffect(() => {
    if (booking.roomId && booking.startDate && booking.startTime && booking.endTime) {
      validateBooking();
    }
  }, [booking.roomId, booking.startDate, booking.startTime, booking.endTime, booking.expectedAttendees]);

  const fetchRooms = async () => {
    try {
      // Mock API call to fetch rooms
      const mockRooms: Room[] = [
        {
          id: 'room1',
          roomNumber: '101',
          name: 'Lecture Hall A',
          buildingId: 'building1',
          type: 'Lecture Hall',
          capacity: 100,
          status: 'active'
        },
        {
          id: 'room2',
          roomNumber: '205',
          name: 'Computer Lab 1',
          buildingId: 'building2',
          type: 'Computer Lab',
          capacity: 40,
          status: 'active'
        },
        {
          id: 'room3',
          roomNumber: '301',
          name: 'Seminar Hall',
          buildingId: 'building1',
          type: 'Seminar Hall',
          capacity: 150,
          status: 'active'
        }
      ];
      setRooms(mockRooms);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const checkAvailability = async () => {
    try {
      // Mock API call to check room availability
      const mockSlots: TimeSlot[] = timeSlots.map(time => ({
        time,
        available: Math.random() > 0.3, // 70% chance of being available
        bookedBy: Math.random() > 0.7 ? 'Prof. Smith' : undefined,
        purpose: Math.random() > 0.7 ? 'Data Structures Lecture' : undefined
      }));
      setAvailableSlots(mockSlots);
    } catch (error) {
      console.error('Failed to check availability:', error);
    }
  };

  const validateBooking = async () => {
    setIsValidating(true);
    const newConflicts: string[] = [];

    try {
      // Check room capacity
      const room = rooms.find(r => r.id === booking.roomId);
      if (room && room.capacity && booking.expectedAttendees > room.capacity) {
        newConflicts.push(`Expected attendees (${booking.expectedAttendees}) exceed room capacity (${room.capacity})`);
      }

      // Check time slot availability
      const startSlot = availableSlots.find(slot => slot.time === booking.startTime);
      if (startSlot && !startSlot.available) {
        newConflicts.push(`Time slot ${booking.startTime} is already booked`);
      }

      // Check end time is after start time
      if (booking.startTime >= booking.endTime) {
        newConflicts.push('End time must be after start time');
      }

      // Check booking duration (max 4 hours)
      const startMinutes = timeToMinutes(booking.startTime);
      const endMinutes = timeToMinutes(booking.endTime);
      const durationHours = (endMinutes - startMinutes) / 60;
      
      if (durationHours > 4) {
        newConflicts.push('Booking duration cannot exceed 4 hours');
      }

      if (durationHours < 0.5) {
        newConflicts.push('Minimum booking duration is 30 minutes');
      }

      setConflicts(newConflicts);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const submitBooking = async () => {
    if (conflicts.length > 0) {
      toast({
        variant: "destructive",
        title: "Booking Conflicts",
        description: "Please resolve all conflicts before submitting"
      });
      return;
    }

    if (!booking.bookedBy || !booking.contactEmail || !booking.purpose) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields"
      });
      return;
    }

    setLoading(true);

    try {
      // Mock API call to create booking
      const newBooking: RoomBooking = {
        ...booking,
        id: `booking_${Date.now()}`,
        status: 'pending'
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Booking Submitted",
        description: "Your room booking request has been submitted for approval"
      });

      onBookingCreated?.(newBooking);
      
      if (mode === 'dialog') {
        setOpen(false);
      }
      
      // Reset form
      setBooking({
        roomId: selectedRoom?.id || '',
        startDate: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        bookedBy: '',
        contactEmail: '',
        purpose: '',
        description: '',
        expectedAttendees: 1,
        isRecurring: false,
        equipment: [],
        status: 'pending'
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to create booking"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEquipment = (equipment: string) => {
    setBooking(prev => ({
      ...prev,
      equipment: prev.equipment?.includes(equipment)
        ? prev.equipment.filter(e => e !== equipment)
        : [...(prev.equipment || []), equipment]
    }));
  };

  const BookingForm = () => (
    <div className="space-y-6">
      {/* Room Selection */}
      <div className="space-y-2">
        <Label htmlFor="room">Room *</Label>
        <Select
          value={booking.roomId}
          onValueChange={(value) => setBooking(prev => ({ ...prev, roomId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a room" />
          </SelectTrigger>
          <SelectContent>
            {rooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{room.name} ({room.roomNumber})</span>
                  <Badge variant="outline">{room.type}</Badge>
                  <span className="text-xs text-gray-500">Capacity: {room.capacity || 'N/A'}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={booking.startDate}
            onChange={(e) => setBooking(prev => ({ ...prev, startDate: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time *</Label>
          <Select
            value={booking.startTime}
            onValueChange={(value) => setBooking(prev => ({ ...prev, startTime: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((time) => {
                const slot = availableSlots.find(s => s.time === time);
                const isAvailable = slot?.available !== false;
                
                return (
                  <SelectItem 
                    key={time} 
                    value={time}
                    disabled={!isAvailable}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{time}</span>
                      {!isAvailable && (
                        <Badge variant="destructive" className="text-xs">Booked</Badge>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time *</Label>
          <Select
            value={booking.endTime}
            onValueChange={(value) => setBooking(prev => ({ ...prev, endTime: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((time) => (
                <SelectItem key={time} value={time}>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{time}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Booking Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bookedBy">Booked By *</Label>
          <Input
            id="bookedBy"
            value={booking.bookedBy}
            onChange={(e) => setBooking(prev => ({ ...prev, bookedBy: e.target.value }))}
            placeholder="Your name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact Email *</Label>
          <Input
            id="contactEmail"
            type="email"
            value={booking.contactEmail}
            onChange={(e) => setBooking(prev => ({ ...prev, contactEmail: e.target.value }))}
            placeholder="your.email@example.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose *</Label>
        <Input
          id="purpose"
          value={booking.purpose}
          onChange={(e) => setBooking(prev => ({ ...prev, purpose: e.target.value }))}
          placeholder="e.g., Team Meeting, Workshop, Lecture"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={booking.description}
          onChange={(e) => setBooking(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Additional details about your booking..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="attendees">Expected Attendees *</Label>
        <Input
          id="attendees"
          type="number"
          min="1"
          value={booking.expectedAttendees}
          onChange={(e) => setBooking(prev => ({ ...prev, expectedAttendees: parseInt(e.target.value) || 1 }))}
        />
      </div>

      {/* Equipment Requirements */}
      <div className="space-y-2">
        <Label>Equipment Requirements</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {equipmentOptions.map((equipment) => (
            <label key={equipment} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={booking.equipment?.includes(equipment) || false}
                onChange={() => toggleEquipment(equipment)}
                className="rounded"
              />
              <span className="text-sm">{equipment}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialRequirements">Special Requirements</Label>
        <Textarea
          id="specialRequirements"
          value={booking.specialRequirements}
          onChange={(e) => setBooking(prev => ({ ...prev, specialRequirements: e.target.value }))}
          placeholder="Any special setup or requirements..."
          rows={2}
        />
      </div>

      {/* Recurring Booking */}
      <div className="flex items-center space-x-2">
        <Switch
          checked={booking.isRecurring}
          onCheckedChange={(checked) => setBooking(prev => ({ ...prev, isRecurring: checked }))}
        />
        <Label>Recurring booking</Label>
      </div>

      {booking.isRecurring && (
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={booking.recurrencePattern?.frequency || 'weekly'}
                onValueChange={(value: any) => setBooking(prev => ({
                  ...prev,
                  recurrencePattern: { 
                    frequency: value,
                    interval: prev.recurrencePattern?.interval || 1,
                    endDate: prev.recurrencePattern?.endDate,
                    daysOfWeek: prev.recurrencePattern?.daysOfWeek 
                  }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={booking.recurrencePattern?.endDate || ''}
                onChange={(e) => setBooking(prev => ({
                  ...prev,
                  recurrencePattern: { 
                    frequency: prev.recurrencePattern?.frequency || 'weekly',
                    interval: prev.recurrencePattern?.interval || 1,
                    endDate: e.target.value,
                    daysOfWeek: prev.recurrencePattern?.daysOfWeek 
                  }
                }))}
                min={booking.startDate}
              />
            </div>
          </div>
        </div>
      )}

      {/* Conflicts Display */}
      {conflicts.length > 0 && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800 mb-2">Booking Conflicts</h4>
              <ul className="space-y-1">
                {conflicts.map((conflict, index) => (
                  <li key={index} className="text-sm text-red-700">
                    • {conflict}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success Validation */}
      {conflicts.length === 0 && booking.bookedBy && booking.contactEmail && booking.purpose && (
        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800 font-medium">Booking details are valid</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={submitBooking}
          disabled={loading || conflicts.length > 0 || isValidating}
          className="flex-1"
        >
          {loading ? 'Submitting...' : 'Submit Booking Request'}
        </Button>
        
        {mode === 'dialog' && (
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );

  if (mode === 'inline') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book Room
          </CardTitle>
          <CardDescription>
            Reserve a room for your event or meeting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingForm />
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Book Room
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book Room
          </DialogTitle>
          <DialogDescription>
            Reserve a room for your event or meeting. All bookings require approval.
          </DialogDescription>
        </DialogHeader>
        
        <BookingForm />
      </DialogContent>
    </Dialog>
  );
}