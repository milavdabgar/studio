// src/components/notifications/RealTimeAssessmentNotifications.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Clock, CheckCircle, AlertTriangle, BookOpen, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow, parseISO, addDays } from 'date-fns';
import Link from 'next/link';
import type { Assessment, Notification } from '@/types/entities';

interface AssessmentNotificationProps {
  studentId: string;
  refreshInterval?: number; // milliseconds
}

interface UpcomingAssessment extends Assessment {
  courseName?: string;
  timeUntilDue?: string;
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
}

interface RecentNotification extends Notification {
  assessmentName?: string;
  courseName?: string;
}

const RealTimeAssessmentNotifications: React.FC<AssessmentNotificationProps> = ({
  studentId,
  refreshInterval = 30000 // 30 seconds default
}) => {
  const [upcomingAssessments, setUpcomingAssessments] = useState<UpcomingAssessment[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<RecentNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchUpcomingAssessments = useCallback(async () => {
    try {
      const response = await fetch(`/api/assessments?studentId=${studentId}&status=pending&upcoming=true`);
      if (response.ok) {
        const assessments = await response.json();
        const enrichedAssessments = assessments.map((assessment: Assessment) => ({
          ...assessment,
          timeUntilDue: assessment.dueDate ? formatDistanceToNow(parseISO(assessment.dueDate), { addSuffix: true }) : undefined,
          urgencyLevel: getUrgencyLevel(assessment.dueDate)
        }));
        setUpcomingAssessments(enrichedAssessments);
      }
    } catch (error) {
      console.error('Error fetching upcoming assessments:', error);
    }
  }, [studentId]);

  const fetchRecentNotifications = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${studentId}&type=assessment&recent=true&limit=5`);
      if (response.ok) {
        const notifications = await response.json();
        setRecentNotifications(notifications);
      }
    } catch (error) {
      console.error('Error fetching recent notifications:', error);
    }
  }, [studentId]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchUpcomingAssessments(), fetchRecentNotifications()]);
    setLastRefresh(new Date());
    setIsLoading(false);
  }, [fetchUpcomingAssessments, fetchRecentNotifications]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshData, refreshInterval]);

  const getUrgencyLevel = (dueDate?: string): 'low' | 'medium' | 'high' | 'critical' => {
    if (!dueDate) return 'low';
    
    const now = new Date();
    const due = parseISO(dueDate);
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDue < 0) return 'critical'; // overdue
    if (hoursUntilDue < 24) return 'high';
    if (hoursUntilDue < 72) return 'medium';
    return 'low';
  };


  const getUrgencyBadgeVariant = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment_new':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'assignment_graded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'reminder':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const calculateProgress = (assessment: UpcomingAssessment): number => {
    if (!assessment.dueDate) return 0;
    
    const now = new Date();
    const due = parseISO(assessment.dueDate);
    const created = assessment.createdAt ? parseISO(assessment.createdAt) : addDays(due, -7); // assume 7 days if no created date
    
    const totalTime = due.getTime() - created.getTime();
    const timeElapsed = now.getTime() - created.getTime();
    
    return Math.min(100, Math.max(0, (timeElapsed / totalTime) * 100));
  };

  if (isLoading && upcomingAssessments.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Assessment Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full" data-testid="assessment-notifications">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Assessment Notifications
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live
            </div>
            <span>
              Updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upcoming Assessments */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Assessments ({upcomingAssessments.length})
          </h3>
          {upcomingAssessments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No upcoming assessments</p>
          ) : (
            <div className="space-y-3">
              {upcomingAssessments.slice(0, 5).map((assessment) => (
                <div key={assessment.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{assessment.name}</h4>
                        <Badge variant={getUrgencyBadgeVariant(assessment.urgencyLevel || 'low')}>
                          {assessment.urgencyLevel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {assessment.courseName || 'Course'} • Due {assessment.timeUntilDue}
                      </p>
                      <div className="flex items-center gap-2">
                        <Progress value={calculateProgress(assessment)} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(calculateProgress(assessment))}%
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/student/assessments?id=${assessment.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Recent Notifications */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Recent Updates ({recentNotifications.length})
          </h3>
          {recentNotifications.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent notifications</p>
          ) : (
            <div className="space-y-2">
              {recentNotifications.map((notification) => (
                <div key={notification.id} className={`flex items-start gap-3 p-2 rounded-lg ${!notification.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {notification.link && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={notification.link}>
                        View
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href="/student/assessments">
              View All Assessments
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href="/notifications">
              All Notifications
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeAssessmentNotifications;