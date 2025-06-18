// src/app/notifications/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BellRing, CheckCheck, XCircle, Info, AlertTriangle as AlertTriangleIcon, CheckCircle as CheckCircleIcon, Filter, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Notification, NotificationType } from '@/types/entities';
import { notificationService } from '@/lib/api/notifications';
import { formatDistanceToNow, parseISO } from 'date-fns';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ExternalLink } from 'lucide-react'; // Added ExternalLink


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

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];
const NOTIFICATION_TYPE_OPTIONS: (NotificationType | 'all' | 'unread')[] = ['all', 'unread', 'info', 'success', 'warning', 'error', 'update', 'reminder', 'assignment_new', 'assignment_graded', 'enrollment_request', 'enrollment_approved', 'enrollment_rejected', 'project_status_change', 'project_location_update', 'event_schedule_update', 'event_results_published', 'meeting_scheduled', 'new_material'];


export default function AllNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const [filterType, setFilterType] = useState<NotificationType | 'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        if (parsedUser && parsedUser.id) {
          setUserId(parsedUser.id);
        } else {
          toast({ variant: "destructive", title: "User ID Missing", description: "Could not identify user for notifications." });
          setIsLoading(false);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
        setIsLoading(false);
      }
    } else {
        toast({ variant: "destructive", title: "Authentication Error", description: "User not logged in." });
        setIsLoading(false);
    }
  }, [toast]);

  const fetchNotifications = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await notificationService.getNotificationsForUser(userId);
      setNotifications(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not load notifications." });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, toast]);


  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true, updatedAt: new Date().toISOString() } : n)
      );
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to mark notification as read." });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      await notificationService.markAllNotificationsAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, updatedAt: new Date().toISOString() })));
      toast({ title: "Success", description: "All notifications marked as read." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to mark all as read." });
    }
  };
  
  const handleDeleteNotification = async (notificationId: string) => {
    // Note: Delete API is not implemented yet, this is a placeholder for UI
    if (window.confirm("Are you sure you want to delete this notification? This is a mock action.")) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast({title: "Mock Delete", description: `Notification ${notificationId} would be deleted.`});
    }
  };


  const getIconForType = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'reminder': return <Clock className="h-5 w-5 text-purple-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
        if (filterType === 'all') return true;
        if (filterType === 'unread') return !n.isRead;
        return n.type === filterType;
    });
  }, [notifications, filterType]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredNotifications.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNotifications, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [filterType, itemsPerPage]);


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }
   if (!userId) {
    return <div className="text-center py-10 text-muted-foreground">User not identified. Cannot load notifications.</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex-grow">
                <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                    <BellRing className="h-6 w-6" /> All Notifications
                </CardTitle>
                <CardDescription>View and manage all your system notifications.</CardDescription>
            </div>
            {notifications.some(n => !n.isRead) && (
                <Button onClick={handleMarkAllAsRead} size="sm">
                    <CheckCheck className="mr-2 h-4 w-4"/> Mark All as Read
                </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg">
            <Label htmlFor="notificationTypeFilter" className="text-sm">Filter by Type:</Label>
            <Select value={filterType} onValueChange={(value) => setFilterType(value as NotificationType | 'all' | 'unread')}>
                <SelectTrigger id="notificationTypeFilter" className="mt-1">
                    <SelectValue placeholder="All Notifications"/>
                </SelectTrigger>
                <SelectContent>
                    {NOTIFICATION_TYPE_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          {paginatedNotifications.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
                <BellRing className="mx-auto h-12 w-12 mb-4" />
                <p>No notifications match your current filter, or you have no notifications yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {paginatedNotifications.map(notification => (
                <li key={notification.id} className={`p-4 border rounded-lg flex items-start gap-4 hover:shadow-md transition-shadow ${!notification.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
                  <div className="flex-shrink-0 mt-1">{getIconForType(notification.type)}</div>
                  <div className="flex-grow">
                    <p className={`text-sm ${!notification.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true })}
                      {notification.isRead && notification.updatedAt && notification.updatedAt !== notification.createdAt && 
                       ` (read ${formatDistanceToNow(parseISO(notification.updatedAt), { addSuffix: true })})`}
                    </p>
                    {notification.link && (
                      <Button variant="link" size="sm" className="text-xs p-0 h-auto mt-1 text-primary flex items-center gap-1" asChild>
                        <Link href={notification.link}>
                            <ExternalLink className="h-3 w-3"/> View Details
                        </Link>
                      </Button>
                    )}
                  </div>
                  <div className="flex-shrink-0 space-x-1">
                    {!notification.isRead && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMarkAsRead(notification.id)} title="Mark as read">
                        <CheckCheck className="h-4 w-4 text-green-600"/>
                      </Button>
                    )}
                    {/* <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteNotification(notification.id)} title="Delete notification">
                        <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button> */}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        {filteredNotifications.length > 0 && (
            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t">
                <div className="text-sm text-muted-foreground">Showing {paginatedNotifications.length > 0 ? Math.min((currentPage -1) * itemsPerPage + 1, filteredNotifications.length): 0} to {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length} notifications.</div>
                <div className="flex items-center gap-2">
                    <Select value={String(itemsPerPage)} onValueChange={(value) => {setItemsPerPage(Number(value)); setCurrentPage(1);}}>
                        <SelectTrigger className="w-[70px] h-8 text-xs"><SelectValue placeholder={String(itemsPerPage)} /></SelectTrigger>
                        <SelectContent side="top">{ITEMS_PER_PAGE_OPTIONS.map(sz => <SelectItem key={sz} value={String(sz)} className="text-xs">{sz}</SelectItem>)}</SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /><span className="sr-only">First</span></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /><span className="sr-only">Prev</span></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /><span className="sr-only">Next</span></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}><ChevronsRight className="h-4 w-4" /><span className="sr-only">Last</span></Button>
                    </div>
                </div>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}