'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getRealtimeTimetableService } from '@/lib/services/realtimeTimetableService';
import { NotificationService } from '@/lib/services/notificationService';
import type { StakeholderType } from '@/types/entities';

interface TimetableChangeEvent {
  type: 'timetable_created' | 'timetable_updated' | 'timetable_deleted' | 'entry_changed' | 'conflict_detected';
  timetableId: string;
  batchId?: string;
  changes?: {
    before: any[];
    after: any[];
    modified: any[];
    added: any[];
    removed: any[];
  };
  conflicts?: any[];
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface UseRealtimeTimetableOptions {
  userId: string;
  stakeholderType: StakeholderType;
  filters?: {
    batchIds?: string[];
    facultyIds?: string[];
    roomIds?: string[];
    buildingIds?: string[];
  };
  channels?: ('websocket' | 'push' | 'email')[];
  onTimetableChange?: (event: TimetableChangeEvent) => void;
  onConnectionChange?: (connected: boolean) => void;
  autoConnect?: boolean;
}

interface UseRealtimeTimetableReturn {
  isConnected: boolean;
  connectionState: string;
  lastUpdate: TimetableChangeEvent | null;
  subscribe: () => string | null;
  unsubscribe: () => void;
  reconnect: () => void;
  getActiveSubscriptions: () => any[];
}

export function useRealtimeTimetable(options: UseRealtimeTimetableOptions): UseRealtimeTimetableReturn {
  const {
    userId,
    stakeholderType,
    filters = {},
    channels = ['websocket'],
    onTimetableChange,
    onConnectionChange,
    autoConnect = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState<TimetableChangeEvent | null>(null);
  
  const serviceRef = useRef<ReturnType<typeof getRealtimeTimetableService> | null>(null);
  const subscriptionIdRef = useRef<string | null>(null);
  const unsubscribersRef = useRef<Array<() => void>>([]);

  // Initialize service
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create a basic notification service instance for the realtime service
      const notificationService = new NotificationService({
        logger: {
          info: console.info,
          error: console.error,
          debug: console.debug,
          warn: console.warn
        }
      });
      
      serviceRef.current = getRealtimeTimetableService(notificationService);
      setConnectionState(serviceRef.current.getConnectionState());
      setIsConnected(serviceRef.current.getConnectionState() === 'connected');
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!serviceRef.current) return;

    const service = serviceRef.current;

    // Connection state listener
    const unsubscribeConnection = service.on('connection', (data: { connected: boolean }) => {
      setIsConnected(data.connected);
      setConnectionState(data.connected ? 'connected' : 'disconnected');
      onConnectionChange?.(data.connected);
    });

    // Timetable change listener
    const unsubscribeTimetable = service.on('timetable_change', (event: TimetableChangeEvent) => {
      setLastUpdate(event);
      onTimetableChange?.(event);
    });

    unsubscribersRef.current.push(unsubscribeConnection, unsubscribeTimetable);

    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [onTimetableChange, onConnectionChange]);

  // Auto-subscribe effect
  useEffect(() => {
    if (autoConnect && serviceRef.current && userId && stakeholderType) {
      const subscriptionId = serviceRef.current.subscribe(
        userId,
        stakeholderType,
        filters,
        channels,
        (event) => {
          setLastUpdate(event);
          onTimetableChange?.(event);
        }
      );
      
      subscriptionIdRef.current = subscriptionId;

      return () => {
        if (subscriptionIdRef.current && serviceRef.current) {
          serviceRef.current.unsubscribe(subscriptionIdRef.current);
          subscriptionIdRef.current = null;
        }
      };
    }
  }, [userId, stakeholderType, JSON.stringify(filters), JSON.stringify(channels), autoConnect, onTimetableChange]);

  const subscribe = useCallback(() => {
    if (!serviceRef.current || !userId || !stakeholderType) return null;

    // Unsubscribe existing subscription
    if (subscriptionIdRef.current) {
      serviceRef.current.unsubscribe(subscriptionIdRef.current);
    }

    const subscriptionId = serviceRef.current.subscribe(
      userId,
      stakeholderType,
      filters,
      channels,
      (event) => {
        setLastUpdate(event);
        onTimetableChange?.(event);
      }
    );

    subscriptionIdRef.current = subscriptionId;
    return subscriptionId;
  }, [userId, stakeholderType, filters, channels, onTimetableChange]);

  const unsubscribe = useCallback(() => {
    if (subscriptionIdRef.current && serviceRef.current) {
      serviceRef.current.unsubscribe(subscriptionIdRef.current);
      subscriptionIdRef.current = null;
    }
  }, []);

  const reconnect = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
      // The service will automatically attempt to reconnect
    }
  }, []);

  const getActiveSubscriptions = useCallback(() => {
    return serviceRef.current?.getActiveSubscriptions() || [];
  }, []);

  return {
    isConnected,
    connectionState,
    lastUpdate,
    subscribe,
    unsubscribe,
    reconnect,
    getActiveSubscriptions
  };
}

// Hook for specific stakeholder types
export function useStudentRealtimeTimetable(
  userId: string,
  batchIds: string[],
  onTimetableChange?: (event: TimetableChangeEvent) => void
) {
  return useRealtimeTimetable({
    userId,
    stakeholderType: 'student',
    filters: { batchIds },
    channels: ['websocket', 'push'],
    onTimetableChange
  });
}

export function useFacultyRealtimeTimetable(
  userId: string,
  facultyIds: string[],
  onTimetableChange?: (event: TimetableChangeEvent) => void
) {
  return useRealtimeTimetable({
    userId,
    stakeholderType: 'faculty',
    filters: { facultyIds },
    channels: ['websocket', 'push', 'email'],
    onTimetableChange
  });
}

export function useHODRealtimeTimetable(
  userId: string,
  batchIds: string[],
  onTimetableChange?: (event: TimetableChangeEvent) => void
) {
  return useRealtimeTimetable({
    userId,
    stakeholderType: 'hod',
    filters: { batchIds },
    channels: ['websocket', 'email'],
    onTimetableChange
  });
}

export function useRoomManagerRealtimeTimetable(
  userId: string,
  roomIds: string[],
  buildingIds: string[],
  onTimetableChange?: (event: TimetableChangeEvent) => void
) {
  return useRealtimeTimetable({
    userId,
    stakeholderType: 'room_manager',
    filters: { roomIds, buildingIds },
    channels: ['websocket', 'email'],
    onTimetableChange
  });
}

// Hook for connection status indicator
export function useRealtimeConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const notificationService = new NotificationService({
        logger: {
          info: console.info,
          error: console.error,
          debug: console.debug,
          warn: console.warn
        }
      });
      
      const service = getRealtimeTimetableService(notificationService);
      
      setConnectionState(service.getConnectionState());
      setIsConnected(service.getConnectionState() === 'connected');

      const unsubscribe = service.on('connection', (data: { connected: boolean }) => {
        setIsConnected(data.connected);
        setConnectionState(data.connected ? 'connected' : 'disconnected');
      });

      return unsubscribe;
    }
  }, []);

  return { isConnected, connectionState };
}