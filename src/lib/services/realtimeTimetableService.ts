import React from 'react';
import type { 
  Timetable, 
  TimetableEntry, 
  TimetableConflict,
  StakeholderType,
  NotificationType 
} from '@/types/entities';
import { TimetableNotificationService } from './timetableNotificationService';
import { NotificationService } from './notificationService';

interface TimetableChangeEvent {
  type: 'timetable_created' | 'timetable_updated' | 'timetable_deleted' | 'entry_changed' | 'conflict_detected';
  timetableId: string;
  batchId?: string;
  changes?: {
    before: TimetableEntry[];
    after: TimetableEntry[];
    modified: TimetableEntry[];
    added: TimetableEntry[];
    removed: TimetableEntry[];
  };
  conflicts?: TimetableConflict[];
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface RealtimeSubscription {
  id: string;
  userId: string;
  stakeholderType: StakeholderType;
  filters: {
    batchIds?: string[];
    facultyIds?: string[];
    roomIds?: string[];
    buildingIds?: string[];
  };
  channels: ('websocket' | 'push' | 'email')[];
  callback?: (event: TimetableChangeEvent) => void;
}

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'timetable_change' | 'heartbeat' | 'error';
  payload: any;
  subscriptionId?: string;
  timestamp: string;
}

export class RealtimeTimetableService {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private notificationService: TimetableNotificationService;
  private eventListeners: Map<string, Array<(event: TimetableChangeEvent) => void>> = new Map();

  constructor(
    private baseNotificationService: NotificationService,
    private wsUrl: string = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/timetable',
    private enableWebSocket: boolean = process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true'
  ) {
    this.notificationService = new TimetableNotificationService(baseNotificationService);
    console.info('🚀 Initializing RealtimeTimetableService');
    
    if (this.enableWebSocket) {
      console.info('🔌 WebSocket enabled, attempting connection...');
      this.initializeConnection();
    } else {
      console.info('📱 WebSocket disabled, running in polling mode only');
      this.connectionState = 'disconnected';
    }
  }

  private initializeConnection() {
    if (typeof window === 'undefined' || !this.enableWebSocket) return; // Skip in SSR or if disabled

    try {
      this.connectionState = 'connecting';
      console.info(`🔌 Attempting WebSocket connection to: ${this.wsUrl}`);
      
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
      console.info('💡 Real-time updates will be disabled. The app will continue to work normally.');
      this.connectionState = 'error';
      // Don't schedule reconnect on initialization failure to avoid spam
    }
  }

  private handleOpen() {
    console.log('WebSocket connection established');
    this.connectionState = 'connected';
    this.reconnectAttempts = 0;
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Resubscribe to existing subscriptions
    this.resubscribeAll();
    
    // Emit connection event
    this.emit('connection', { connected: true });
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'timetable_change':
          this.handleTimetableChange(message.payload as TimetableChangeEvent);
          break;
        case 'heartbeat':
          // Heartbeat response - connection is alive
          break;
        case 'error':
          console.error('WebSocket error:', message.payload);
          break;
        default:
          console.warn('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent) {
    const isNormalClosure = event.code === 1000;
    const isConnectionRefused = event.code === 1006; // Connection refused/failed
    
    if (isConnectionRefused) {
      console.info('🔌 WebSocket server not available (connection refused). Real-time updates disabled.');
    } else {
      console.log('WebSocket connection closed:', event.code, event.reason);
    }
    
    this.connectionState = 'disconnected';
    this.stopHeartbeat();
    
    if (!isNormalClosure && !isConnectionRefused) {
      this.scheduleReconnect();
    }
    
    this.emit('connection', { connected: false, code: event.code, reason: event.reason });
  }

  private handleError(error: Event) {
    // Extract meaningful error information from WebSocket Event
    const errorInfo = {
      type: error.type,
      timestamp: new Date().toISOString(),
      readyState: this.ws?.readyState,
      url: this.wsUrl
    };
    
    console.error('WebSocket connection error:', errorInfo);
    console.info('💡 This is expected if no WebSocket server is running. The app will continue to work without real-time updates.');
    
    this.connectionState = 'error';
    this.emit('error', { error: errorInfo });
  }

  private handleTimetableChange(event: TimetableChangeEvent) {
    // Process the change event and notify relevant subscribers
    const affectedSubscriptions = this.getAffectedSubscriptions(event);
    
    for (const subscription of affectedSubscriptions) {
      // Call subscription callback if exists
      if (subscription.callback) {
        subscription.callback(event);
      }
      
      // Send notifications through preferred channels
      this.sendRealtimeNotification(subscription, event);
    }
    
    // Emit to general event listeners
    this.emit('timetable_change', event);
  }

  private getAffectedSubscriptions(event: TimetableChangeEvent): RealtimeSubscription[] {
    return Array.from(this.subscriptions.values()).filter(subscription => {
      // Check if subscription filters match the event
      if (event.batchId && subscription.filters.batchIds?.length) {
        if (!subscription.filters.batchIds.includes(event.batchId)) {
          return false;
        }
      }
      
      if (event.changes?.modified.length) {
        // Check faculty filters
        if (subscription.filters.facultyIds?.length) {
          const hasFacultyMatch = event.changes.modified.some(entry => 
            subscription.filters.facultyIds!.includes(entry.facultyId)
          );
          if (!hasFacultyMatch) return false;
        }
        
        // Check room filters
        if (subscription.filters.roomIds?.length) {
          const hasRoomMatch = event.changes.modified.some(entry => 
            entry.roomId && subscription.filters.roomIds!.includes(entry.roomId)
          );
          if (!hasRoomMatch) return false;
        }
      }
      
      return true;
    });
  }

  private async sendRealtimeNotification(subscription: RealtimeSubscription, event: TimetableChangeEvent) {
    try {
      const templateKey = this.getNotificationTemplate(event.type, subscription.stakeholderType);
      const notificationData = this.buildNotificationData(event, subscription);
      
      // Send through notification service if not just websocket
      if (subscription.channels.some(c => c !== 'websocket')) {
        await this.baseNotificationService.sendNotification({
          userId: subscription.userId,
          type: this.mapEventToNotificationType(event.type),
          title: notificationData.title,
          message: notificationData.message,
          channels: subscription.channels.filter(c => c !== 'websocket') as any[],
          priority: this.getNotificationPriority(event.type),
          data: {
            timetableId: event.timetableId,
            eventType: event.type,
            timestamp: event.timestamp,
            ...event.metadata
          }
        });
      }
    } catch (error) {
      console.error('Failed to send realtime notification:', error);
    }
  }

  private getNotificationTemplate(eventType: string, stakeholderType: StakeholderType): string {
    const templateMap = {
      timetable_created: {
        student: 'student-timetable-published',
        faculty: 'faculty-schedule-assigned',
        hod: 'hod-timetable-ready',
        room_manager: 'room-booking-confirmed',
        lab_assistant: 'lab-schedule-assigned',
        admin: 'admin-timetable-created',
        dean: 'dean-timetable-review',
        registrar: 'registrar-timetable-approved',
        parent: 'parent-timetable-notification'
      },
      timetable_updated: {
        student: 'student-timetable-changed',
        faculty: 'faculty-schedule-changed',
        hod: 'hod-timetable-ready',
        room_manager: 'room-booking-confirmed',
        lab_assistant: 'lab-schedule-changed',
        admin: 'admin-timetable-updated',
        dean: 'dean-timetable-review',
        registrar: 'registrar-timetable-approved',
        parent: 'parent-timetable-notification'
      },
      entry_changed: {
        student: 'student-schedule-changed',
        faculty: 'faculty-schedule-changed',
        hod: 'hod-conflict-detected',
        room_manager: 'room-conflict-detected',
        lab_assistant: 'lab-conflict-detected',
        admin: 'admin-conflict-detected',
        dean: 'dean-conflict-detected',
        registrar: 'registrar-conflict-detected',
        parent: 'parent-schedule-changed'
      },
      conflict_detected: {
        student: 'student-schedule-changed',
        faculty: 'faculty-schedule-changed',
        hod: 'hod-conflict-detected',
        room_manager: 'room-conflict-detected',
        lab_assistant: 'lab-conflict-detected',
        admin: 'admin-conflict-detected',
        dean: 'dean-conflict-detected',
        registrar: 'registrar-conflict-detected',
        parent: 'parent-schedule-changed'
      }
    };
    
    return templateMap[eventType as keyof typeof templateMap]?.[stakeholderType] || 'default';
  }

  private buildNotificationData(event: TimetableChangeEvent, subscription: RealtimeSubscription) {
    const baseData = {
      title: this.getEventTitle(event.type),
      message: this.getEventMessage(event),
      timetableId: event.timetableId,
      timestamp: event.timestamp
    };
    
    return baseData;
  }

  private getEventTitle(eventType: string): string {
    const titleMap = {
      timetable_created: '📅 New Timetable Published',
      timetable_updated: '🔄 Timetable Updated',
      timetable_deleted: '❌ Timetable Removed',
      entry_changed: '⏰ Schedule Changed',
      conflict_detected: '⚠️ Conflict Detected'
    };
    
    return titleMap[eventType as keyof typeof titleMap] || 'Timetable Notification';
  }

  private getEventMessage(event: TimetableChangeEvent): string {
    switch (event.type) {
      case 'timetable_created':
        return 'A new timetable has been published for your batch.';
      case 'timetable_updated':
        return `Timetable has been updated with ${event.changes?.modified.length || 0} changes.`;
      case 'entry_changed':
        return `${event.changes?.modified.length || 0} classes have been rescheduled.`;
      case 'conflict_detected':
        return `${event.conflicts?.length || 0} scheduling conflicts need attention.`;
      default:
        return 'Your timetable has been updated.';
    }
  }

  private mapEventToNotificationType(eventType: string): string {
    const typeMap = {
      timetable_created: 'timetable_update',
      timetable_updated: 'timetable_update',
      timetable_deleted: 'timetable_update',
      entry_changed: 'schedule_change',
      conflict_detected: 'administrative_alert'
    };
    
    return typeMap[eventType as keyof typeof typeMap] || 'timetable_update';
  }

  private getNotificationPriority(eventType: string): 'low' | 'medium' | 'high' | 'urgent' {
    const priorityMap = {
      timetable_created: 'high' as const,
      timetable_updated: 'high' as const,
      timetable_deleted: 'urgent' as const,
      entry_changed: 'high' as const,
      conflict_detected: 'urgent' as const
    };
    
    return priorityMap[eventType as keyof typeof priorityMap] || 'medium';
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          payload: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(`⚠️ Max WebSocket reconnection attempts (${this.maxReconnectAttempts}) reached. Real-time updates disabled.`);
      console.info('💡 The app will continue to work normally without real-time timetable updates.');
      this.connectionState = 'error';
      return;
    }
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`🔄 Scheduling WebSocket reconnection attempt ${this.reconnectAttempts + 1} in ${delay}ms`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.initializeConnection();
    }, delay);
  }

  private resubscribeAll() {
    for (const subscription of this.subscriptions.values()) {
      this.sendSubscription(subscription);
    }
  }

  private send(message: WebSocketMessage) {
    if (!this.enableWebSocket) {
      // WebSocket is disabled, silently ignore
      return;
    }
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message queued');
      // Could implement message queuing here
    }
  }

  private sendSubscription(subscription: RealtimeSubscription) {
    this.send({
      type: 'subscribe',
      payload: {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        stakeholderType: subscription.stakeholderType,
        filters: subscription.filters
      },
      subscriptionId: subscription.id,
      timestamp: new Date().toISOString()
    });
  }

  // Public API methods
  public subscribe(
    userId: string,
    stakeholderType: StakeholderType,
    filters: RealtimeSubscription['filters'],
    channels: RealtimeSubscription['channels'] = ['websocket'],
    callback?: (event: TimetableChangeEvent) => void
  ): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      userId,
      stakeholderType,
      filters,
      channels,
      callback
    };
    
    this.subscriptions.set(subscriptionId, subscription);
    
    if (this.enableWebSocket && this.connectionState === 'connected') {
      this.sendSubscription(subscription);
    }
    
    return subscriptionId;
  }

  public unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;
    
    this.subscriptions.delete(subscriptionId);
    
    if (this.connectionState === 'connected') {
      this.send({
        type: 'unsubscribe',
        payload: { subscriptionId },
        subscriptionId,
        timestamp: new Date().toISOString()
      });
    }
    
    return true;
  }

  public publishTimetableChange(event: TimetableChangeEvent) {
    // For server-side publishing of events
    if (this.connectionState === 'connected') {
      this.send({
        type: 'timetable_change',
        payload: event,
        timestamp: new Date().toISOString()
      });
    }
    
    // Also handle locally for immediate feedback
    this.handleTimetableChange(event);
  }

  public getConnectionState(): string {
    return this.connectionState;
  }

  public getActiveSubscriptions(): RealtimeSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  // Event emitter functionality
  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  public on(event: string, callback: (data: any) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  public off(event: string, callback?: (data: any) => void) {
    if (!callback) {
      this.eventListeners.delete(event);
      return;
    }
    
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  public disconnect() {
    this.stopHeartbeat();
    this.subscriptions.clear();
    this.eventListeners.clear();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.connectionState = 'disconnected';
  }

  // React hook integration
  public getRealtimeTimetableData(
    userId: string,
    stakeholderType: StakeholderType,
    filters: RealtimeSubscription['filters'] = {},
    channels: RealtimeSubscription['channels'] = ['websocket']
  ) {
    // Simple getter method without React Hooks
    return {
      isConnected: this.connectionState === 'connected',
      lastUpdate: null,
      subscribe: (callback: (event: TimetableChangeEvent) => void) => 
        this.subscribe(userId, stakeholderType, filters, channels, callback),
      unsubscribe: (id: string) => this.unsubscribe(id)
    };
  }
}

// Global singleton instance
let realtimeServiceInstance: RealtimeTimetableService | null = null;

export const getRealtimeTimetableService = (baseNotificationService?: NotificationService): RealtimeTimetableService => {
  if (!realtimeServiceInstance && baseNotificationService) {
    realtimeServiceInstance = new RealtimeTimetableService(baseNotificationService);
  }
  
  return realtimeServiceInstance!;
};

export default RealtimeTimetableService;