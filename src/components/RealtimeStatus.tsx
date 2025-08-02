'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, RotateCw, AlertCircle } from 'lucide-react';
import { useRealtimeConnectionStatus } from '@/hooks/useRealtimeTimetable';

interface RealtimeStatusProps {
  showLabel?: boolean;
  onReconnect?: () => void;
  className?: string;
}

export function RealtimeStatus({ 
  showLabel = false, 
  onReconnect,
  className = '' 
}: RealtimeStatusProps) {
  const { isConnected, connectionState } = useRealtimeConnectionStatus();

  const getStatusConfig = () => {
    switch (connectionState) {
      case 'connected':
        return {
          icon: <Wifi className="h-3 w-3" />,
          label: 'Live Updates',
          variant: 'default' as const,
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          tooltip: 'Real-time updates are active'
        };
      case 'connecting':
        return {
          icon: <RotateCw className="h-3 w-3 animate-spin" />,
          label: 'Connecting...',
          variant: 'secondary' as const,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200',
          tooltip: 'Connecting to real-time updates'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          label: 'Connection Error',
          variant: 'destructive' as const,
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
          tooltip: 'Failed to connect to real-time updates'
        };
      default:
        return {
          icon: <WifiOff className="h-3 w-3" />,
          label: 'Offline',
          variant: 'outline' as const,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200',
          tooltip: 'Real-time updates are offline'
        };
    }
  };

  const config = getStatusConfig();

  if (showLabel) {
    return (
      <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`} data-testid="realtime-status-label">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={config.variant}
                className={`${config.bgColor} ${config.color} gap-1`}
              >
                {config.icon}
                {config.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{config.tooltip}</p>
            </TooltipContent>
          </Tooltip>
          
          {!isConnected && onReconnect && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReconnect}
              className="h-6 px-2 text-xs"
            >
              <RotateCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
        <div className={`inline-flex items-center gap-1 ${className}`} data-testid="realtime-status-icon">
            <div className={`${config.color}`}>
              {config.icon}
            </div>
            {!isConnected && onReconnect && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReconnect}
                className="h-4 w-4 p-0 ml-1"
              >
                <RotateCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Notification toast component for real-time updates
interface RealtimeNotificationProps {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  onDismiss?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

export function RealtimeNotification({
  title,
  message,
  type,
  onDismiss,
  onAction,
  actionLabel = 'View'
}: RealtimeNotificationProps) {
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800'
        };
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800'
        };
      case 'error':
        return {
          icon: '❌',
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800'
        };
      default:
        return {
          icon: 'ℹ️',
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className={`border rounded-lg p-4 ${config.bgColor} ${config.textColor} shadow-lg`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-sm mt-1 opacity-90">{message}</p>
        </div>
        <div className="flex items-center gap-2">
          {onAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAction}
              className="h-7 px-2 text-xs"
            >
              {actionLabel}
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-7 w-7 p-0"
            >
              ×
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Connection indicator for the navigation bar
export function NavRealtimeStatus() {
  const { isConnected, connectionState } = useRealtimeConnectionStatus();

  if (connectionState === 'connected') {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs font-medium">Live</span>
      </div>
    );
  }

  if (connectionState === 'connecting') {
    return (
      <div className="flex items-center gap-1 text-yellow-600">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-xs font-medium">Connecting</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-gray-400">
      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
      <span className="text-xs font-medium">Offline</span>
    </div>
  );
}