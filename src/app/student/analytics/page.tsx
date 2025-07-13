// src/app/student/analytics/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Download, Share2, Calendar } from "lucide-react";
import Link from 'next/link';
import AssessmentAnalyticsDashboard from '@/components/analytics/AssessmentAnalyticsDashboard';

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

export default function StudentAnalyticsPage() {
  const [user, setUser] = useState<UserCookie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing auth cookie:', error);
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    } else {
      toast({ variant: "destructive", title: "Authentication Error", description: "User not logged in." });
    }
    setIsLoading(false);
  }, [toast]);

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Your analytics data is being prepared for download.",
    });
    // Implementation would export data to CSV/PDF
  };

  const handleShareAnalytics = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Academic Analytics',
        text: 'Check out my academic performance dashboard',
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Analytics page link copied to clipboard.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!user || !user.id) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to view your analytics dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Academic Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into your academic performance and progress
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline" onClick={handleShareAnalytics}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button asChild>
            <Link href="/student/dashboard">
              <Calendar className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <AssessmentAnalyticsDashboard 
        studentId={user.id} 
        timeRange="30d"
        className="w-full"
      />

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Improve Your Performance</CardTitle>
          <CardDescription>
            Based on your analytics, here are some resources to help you excel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4" asChild>
              <Link href="/student/resources" className="flex flex-col items-center text-center space-y-2">
                <BarChart3 className="h-8 w-8" />
                <div>
                  <div className="font-medium">Study Materials</div>
                  <div className="text-xs opacity-70">Access course resources</div>
                </div>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4" asChild>
              <Link href="/student/assessments" className="flex flex-col items-center text-center space-y-2">
                <Calendar className="h-8 w-8" />
                <div>
                  <div className="font-medium">Upcoming Assessments</div>
                  <div className="text-xs opacity-70">View and prepare</div>
                </div>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4" asChild>
              <Link href="/student/results" className="flex flex-col items-center text-center space-y-2">
                <Download className="h-8 w-8" />
                <div>
                  <div className="font-medium">Detailed Results</div>
                  <div className="text-xs opacity-70">Review past performance</div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}