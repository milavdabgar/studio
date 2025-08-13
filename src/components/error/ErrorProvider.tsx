'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

interface ErrorContextType {
  reportError: (error: Error, context?: string) => void;
  clearError: () => void;
  hasError: boolean;
  lastError: Error | null;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
  enableToastNotifications?: boolean;
  enableConsoleLogging?: boolean;
}

export function ErrorProvider({ 
  children, 
  enableToastNotifications = true,
  enableConsoleLogging = true 
}: ErrorProviderProps) {
  const [hasError, setHasError] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const reportError = (error: Error, context = 'Unknown') => {
    setHasError(true);
    setLastError(error);

    // Console logging
    if (enableConsoleLogging) {
      console.error(`Error in ${context}:`, error);
    }

    // Toast notification for user feedback
    if (enableToastNotifications) {
      toast({
        title: "Something went wrong",
        description: `${context}: ${error.message}`,
        variant: "destructive",
      });
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to external error tracking
      // Sentry.captureException(error, { tags: { context } });
    }
  };

  const clearError = () => {
    setHasError(false);
    setLastError(null);
  };

  const value: ErrorContextType = {
    reportError,
    clearError,
    hasError,
    lastError
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

// Hook for handling async operations with error reporting
export function useAsyncError() {
  const { reportError } = useError();

  const executeAsync = async <T,>(
    asyncFn: () => Promise<T>,
    context = 'Async Operation'
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), context);
      return null;
    }
  };

  return { executeAsync };
}