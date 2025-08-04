'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  pageName?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  showDetails?: boolean;
}

function PageErrorFallback({ 
  pageName = "this page",
  showBackButton = true,
  showHomeButton = true,
  showDetails = false 
}: Omit<PageErrorBoundaryProps, 'children'>) {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <AlertTriangle className="h-20 w-20 text-red-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-red-600 mb-2">
            Page Error
          </CardTitle>
          <CardDescription className="text-lg">
            We encountered an error while loading {pageName}. This might be a temporary issue.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              What you can try:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
              <li>• Refresh the page to try again</li>
              <li>• Check your internet connection</li>
              <li>• Go back to the previous page</li>
              <li>• Contact support if the problem persists</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
            
            {showBackButton && (
              <Button 
                variant="outline"
                onClick={handleGoBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            )}
            
            {showHomeButton && (
              <Button 
                variant="outline"
                onClick={handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            )}
          </div>

          {showDetails && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Bug className="h-4 w-4" />
                <span className="font-medium text-sm">Error Details</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This error has been logged and will be reviewed by our team. 
                If you need immediate assistance, please contact support with the timestamp: {new Date().toISOString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function PageErrorBoundary({ 
  children, 
  pageName,
  showBackButton = true,
  showHomeButton = true,
  showDetails = false
}: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <PageErrorFallback 
          pageName={pageName}
          showBackButton={showBackButton}
          showHomeButton={showHomeButton}
          showDetails={showDetails}
        />
      }
      showDetails={showDetails}
      onError={(error, errorInfo) => {
        // Enhanced logging for page errors
        const errorData = {
          type: 'PageError',
          page: pageName || 'Unknown',
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          referrer: document.referrer
        };

        console.error('Page Error Boundary:', errorData);

        // In production, send to error tracking service
        if (process.env.NODE_ENV === 'production') {
          // Example: Send to error tracking service
          // analytics.track('Page Error', errorData);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}