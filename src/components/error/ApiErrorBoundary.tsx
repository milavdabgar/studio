'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ApiErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

function ApiErrorFallback({ 
  onRetry, 
  fallbackTitle = "Failed to load data",
  fallbackMessage = "There was a problem loading the data. Please check your connection and try again."
}: Omit<ApiErrorBoundaryProps, 'children'>) {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      if (onRetry) {
        await onRetry();
      } else {
        // Default retry behavior - reload the page
        window.location.reload();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <div className="min-h-[200px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {isOnline ? (
              <AlertCircle className="h-12 w-12 text-orange-500" />
            ) : (
              <WifiOff className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle className="text-lg font-bold">
            {isOnline ? fallbackTitle : "No internet connection"}
          </CardTitle>
          <CardDescription>
            {isOnline 
              ? fallbackMessage 
              : "Please check your internet connection and try again."
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center">
          <Button 
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-2 mx-auto"
          >
            {isRetrying ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : isOnline ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <Wifi className="h-4 w-4" />
            )}
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ApiErrorBoundary({ 
  children, 
  onRetry, 
  fallbackTitle, 
  fallbackMessage 
}: ApiErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <ApiErrorFallback 
          onRetry={onRetry}
          fallbackTitle={fallbackTitle}
          fallbackMessage={fallbackMessage}
        />
      }
      onError={(error, errorInfo) => {
        // Log API errors with additional context
        console.error('API Error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}