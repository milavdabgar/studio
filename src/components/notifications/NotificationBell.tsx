// src/components/notifications/NotificationBell.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, X, Info, ExternalLink, CheckCircle as CheckCircleIcon, AlertTriangle as AlertTriangleIcon, Clock } from 'lucide-react'; // Renamed CheckCircle to CheckCircleIcon, AlertTriangle to AlertTriangleIcon
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Notification } from '@/types/entities';
import { notificationService } from '@/lib/api/notifications';
import { formatDistanceToNow, parseISO } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface UserCookie {
  id?: string;
  // other user properties
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


const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const popoverRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        if (parsedUser && parsedUser.id) {
          setUserId(parsedUser.id);
        }
      } catch (error) {
        console.error("Error parsing user cookie for notifications:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getNotificationsForUser(userId);
        setNotifications(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setUnreadCount(data.filter(n => !n.isRead).length);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error fetching notifications",
          description: (error as Error).message,
        });
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [userId, toast]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true, updatedAt: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark notification as read.",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      await notificationService.markAllNotificationsAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, updatedAt: new Date().toISOString() })));
      setUnreadCount(0);
      toast({ title: "Success", description: "All notifications marked as read." });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark all notifications as read.",
      });
    }
  };

  const getIconForType = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'error': return <X className="h-4 w-4 text-red-500" />;
      case 'reminder': return <Clock className="h-4 w-4 text-purple-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" ref={popoverRef}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 min-w-4 p-0 flex items-center justify-center rounded-full text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Open notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0" align="end">
        <div className="p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Notifications</h3>
            {notifications.length > 0 && unreadCount > 0 && (
              <Button variant="link" size="sm" className="text-xs p-0 h-auto" onClick={handleMarkAllAsRead}>
                <CheckCheck className="mr-1 h-3 w-3" /> Mark all as read
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <ScrollArea className="h-72 max-h-[60vh]">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No new notifications.</p>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id}>
                <div className={`p-3 hover:bg-muted/50 ${!notification.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIconForType(notification.type)}</div>
                    <div className="flex-1">
                      <p className={`text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.createdAt ? formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true }) : 'Unknown time'}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMarkAsRead(notification.id)} title="Mark as read">
                        <CheckCheck className="h-4 w-4 text-green-600"/>
                      </Button>
                    )}
                  </div>
                  {notification.link && (
                    <Button variant="link" size="sm" className="text-xs p-0 h-auto mt-1 flex items-center" onClick={() => setIsOpen(false)} asChild>
                      <Link href={notification.link}>
                        <ExternalLink className="h-3 w-3 mr-1"/> View Details
                      </Link>
                    </Button>
                  )}
                </div>
                <Separator />
              </div>
            ))
          )}
        </ScrollArea>
        <div className="p-2 border-t text-center dark:border-gray-700">
            <Button variant="link" size="sm" className="text-xs w-full" onClick={() => setIsOpen(false)} asChild>
                <Link href="/notifications">
                    View All Notifications
                </Link>
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;