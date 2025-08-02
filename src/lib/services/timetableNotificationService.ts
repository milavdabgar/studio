import { NotificationService, NotificationRequest, BatchNotificationRequest } from './notificationService';
import type { 
  Timetable,
  TimetableEntry,
  Faculty,
  Student,
  Room,
  Batch,
  StakeholderType,
  NotificationType,
  TimetableConflict
} from '@/types/entities';

interface TimetableNotificationTemplate {
  student: {
    timetable_published: {
      title: string;
      message: string;
      channels: ('email' | 'push' | 'sms')[];
    };
    schedule_changed: {
      title: string;
      message: string;
      channels: ('email' | 'push' | 'sms')[];
    };
    class_cancelled: {
      title: string;
      message: string;
      channels: ('push' | 'sms')[];
    };
  };
  faculty: {
    schedule_assigned: {
      title: string;
      message: string;
      channels: ('email' | 'push')[];
    };
    schedule_changed: {
      title: string;
      message: string;
      channels: ('email' | 'push')[];
    };
    room_changed: {
      title: string;
      message: string;
      channels: ('email' | 'push')[];
    };
    workload_alert: {
      title: string;
      message: string;
      channels: ('email')[];
    };
  };
  hod: {
    approval_required: {
      title: string;
      message: string;
      channels: ('email' | 'push')[];
    };
    conflict_detected: {
      title: string;
      message: string;
      channels: ('email' | 'push')[];
    };
    workload_imbalance: {
      title: string;
      message: string;
      channels: ('email')[];
    };
  };
  room_manager: {
    booking_confirmed: {
      title: string;
      message: string;
      channels: ('email')[];
    };
    conflict_detected: {
      title: string;
      message: string;
      channels: ('email' | 'push')[];
    };
    maintenance_scheduled: {
      title: string;
      message: string;
      channels: ('email')[];
    };
  };
}

interface TimetableChangeDetails {
  type: 'time_change' | 'room_change' | 'faculty_change' | 'cancellation' | 'addition';
  oldValue?: string;
  newValue?: string;
  reason?: string;
  affectedEntries: TimetableEntry[];
}

interface StakeholderGroup {
  students: Array<{ id: string; name: string; email?: string; phone?: string; batchId: string }>;
  faculty: Array<{ id: string; name: string; email?: string; phone?: string; department: string }>;
  hods: Array<{ id: string; name: string; email?: string; phone?: string; department: string }>;
  roomManagers: Array<{ id: string; name: string; email?: string; phone?: string; buildingId?: string }>;
}

export class TimetableNotificationService {
  private notificationService: NotificationService;
  private templates: TimetableNotificationTemplate;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
    this.templates = this.initializeTemplates();
  }

  private initializeTemplates(): TimetableNotificationTemplate {
    return {
      student: {
        timetable_published: {
          title: 'New Timetable Published 📅',
          message: 'Your timetable for {{academicYear}} Semester {{semester}} has been published. Check your schedule now!',
          channels: ['email', 'push']
        },
        schedule_changed: {
          title: 'Schedule Update ⚠️',
          message: 'Your {{courseName}} class schedule has changed. {{changeDetails}}. Please review your updated timetable.',
          channels: ['email', 'push', 'sms']
        },
        class_cancelled: {
          title: 'Class Cancelled ❌',
          message: 'Your {{courseName}} class on {{date}} at {{time}} has been cancelled. {{reason}}',
          channels: ['push', 'sms']
        }
      },
      faculty: {
        schedule_assigned: {
          title: 'Teaching Schedule Assigned 👨‍🏫',
          message: 'Your teaching schedule for {{academicYear}} Semester {{semester}} is ready. Total hours: {{totalHours}}.',
          channels: ['email', 'push']
        },
        schedule_changed: {
          title: 'Schedule Change Alert 🔄',
          message: 'Your {{courseName}} class has been rescheduled from {{oldTime}} to {{newTime}} on {{date}}.',
          channels: ['email', 'push']
        },
        room_changed: {
          title: 'Room Change Notice 🏢',
          message: 'Your {{courseName}} class on {{date}} has been moved from {{oldRoom}} to {{newRoom}}.',
          channels: ['email', 'push']
        },
        workload_alert: {
          title: 'Workload Alert ⚖️',
          message: 'Your current workload is {{workloadHours}} hours/week, which {{alertType}} the recommended range.',
          channels: ['email']
        }
      },
      hod: {
        approval_required: {
          title: 'Timetable Approval Required 📋',
          message: 'Timetable for {{batchName}} ({{academicYear}} Semester {{semester}}) requires your approval.',
          channels: ['email', 'push']
        },
        conflict_detected: {
          title: 'Timetable Conflicts Detected ⚠️',
          message: 'Critical conflicts found in {{batchName}} timetable. {{conflictCount}} issues need resolution.',
          channels: ['email', 'push']
        },
        workload_imbalance: {
          title: 'Faculty Workload Imbalance 📊',
          message: 'Workload imbalance detected in your department. {{facultyName}} has {{workloadType}} allocation.',
          channels: ['email']
        }
      },
      room_manager: {
        booking_confirmed: {
          title: 'Room Booking Confirmed 🏛️',
          message: '{{roomName}} booked for {{courseName}} on {{date}} from {{startTime}} to {{endTime}}.',
          channels: ['email']
        },
        conflict_detected: {
          title: 'Room Conflict Alert 🚨',
          message: 'Booking conflict for {{roomName}} on {{date}} at {{time}}. Multiple reservations detected.',
          channels: ['email', 'push']
        },
        maintenance_scheduled: {
          title: 'Room Maintenance Scheduled 🔧',
          message: 'Maintenance for {{roomName}} on {{date}} from {{startTime}} to {{endTime}}. Classes relocated.',
          channels: ['email']
        }
      }
    };
  }

  async notifyTimetablePublished(
    timetable: Timetable,
    stakeholders: StakeholderGroup
  ): Promise<{ success: boolean; results: any[] }> {
    // Check if stakeholders exist
    const hasStakeholders = stakeholders.students.length > 0 || 
                           stakeholders.faculty.length > 0 || 
                           stakeholders.hods.length > 0 || 
                           stakeholders.roomManagers.length > 0;

    if (!hasStakeholders) {
      return { success: false, results: [] };
    }

    const results = [];

    try {
      // Notify students
      const studentNotifications = await this.notifyStudentsOfPublication(timetable, stakeholders.students);
      results.push(...studentNotifications);

      // Notify faculty
      const facultyNotifications = await this.notifyFacultyOfAssignment(timetable, stakeholders.faculty);
      results.push(...facultyNotifications);

      // Notify HODs
      const hodNotifications = await this.notifyHODsOfPublication(timetable, stakeholders.hods);
      results.push(...hodNotifications);

      // Notify room managers
      const roomNotifications = await this.notifyRoomManagersOfBookings(timetable, stakeholders.roomManagers);
      results.push(...roomNotifications);

      const success = results.some(r => r.success);
      return { success, results };
    } catch (error) {
      return { success: false, results: [] };
    }
  }

  async notifyTimetableChanges(
    timetable: Timetable,
    changes: TimetableChangeDetails[],
    stakeholders: StakeholderGroup
  ): Promise<{ success: boolean; results: any[] }> {
    const results = [];

    for (const change of changes) {
      // Get affected stakeholders for this specific change
      const affectedStakeholders = await this.getAffectedStakeholders(change.affectedEntries, stakeholders);

      switch (change.type) {
        case 'time_change':
          results.push(...await this.notifyTimeChange(change, affectedStakeholders));
          break;
        case 'room_change':
          results.push(...await this.notifyRoomChange(change, affectedStakeholders));
          break;
        case 'faculty_change':
          results.push(...await this.notifyFacultyChange(change, affectedStakeholders));
          break;
        case 'cancellation':
          results.push(...await this.notifyClassCancellation(change, affectedStakeholders));
          break;
        case 'addition':
          results.push(...await this.notifyClassAddition(change, affectedStakeholders));
          break;
      }
    }

    const success = results.some(r => r.success);
    return { success, results };
  }

  async notifyConflicts(
    conflicts: TimetableConflict[],
    stakeholders: StakeholderGroup
  ): Promise<{ success: boolean; results: any[] }> {
    const results = [];

    if (conflicts.length === 0) {
      return { success: true, results: [] };
    }

    // Group conflicts by severity
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
    const highConflicts = conflicts.filter(c => c.severity === 'high');

    if (criticalConflicts.length > 0) {
      // Notify HODs immediately for critical conflicts
      for (const hod of stakeholders.hods) {
        const result = await this.notificationService.sendNotification({
          userId: hod.id,
          type: 'timetable_conflict',
          title: this.templates.hod.conflict_detected.title,
          message: this.interpolateTemplate(
            this.templates.hod.conflict_detected.message,
            {
              batchName: criticalConflicts[0].batchId,
              conflictCount: criticalConflicts.length
            }
          ),
          channels: this.templates.hod.conflict_detected.channels,
          priority: 'urgent'
        });
        results.push(result);
      }
    }

    // Notify room managers for room conflicts
    const roomConflicts = conflicts.filter(c => c.type === 'room' || c.type === 'room_conflict');
    for (const conflict of roomConflicts) {
      for (const manager of stakeholders.roomManagers) {
        const result = await this.notificationService.sendNotification({
          userId: manager.id,
          type: 'room_conflict',
          title: this.templates.room_manager.conflict_detected.title,
          message: this.interpolateTemplate(
            this.templates.room_manager.conflict_detected.message,
            {
              roomName: conflict.roomId,
              date: conflict.dayOfWeek,
              time: conflict.timeSlot
            }
          ),
          channels: this.templates.room_manager.conflict_detected.channels,
          priority: 'high'
        });
        results.push(result);
      }
    }

    const success = results.length === 0 || results.some(r => r.success);
    return { success, results };
  }

  async notifyWorkloadAlerts(
    workloadAlerts: Array<{
      facultyId: string;
      facultyName: string;
      workloadHours: number;
      alertType: 'overload' | 'underload';
      department: string;
    }>,
    stakeholders: StakeholderGroup
  ): Promise<{ success: boolean; results: any[] }> {
    const results = [];

    for (const alert of workloadAlerts) {
      // Notify the faculty member
      const facultyResult = await this.notificationService.sendNotification({
        userId: alert.facultyId,
        type: 'workload_alert',
        title: this.templates.faculty.workload_alert.title,
        message: this.interpolateTemplate(
          this.templates.faculty.workload_alert.message,
          {
            workloadHours: alert.workloadHours,
            alertType: alert.alertType === 'overload' ? 'exceeds' : 'is below'
          }
        ),
        channels: this.templates.faculty.workload_alert.channels,
        priority: 'medium'
      });
      results.push(facultyResult);

      // Notify HOD
      const departmentHOD = stakeholders.hods.find(h => h.department === alert.department);
      if (departmentHOD) {
        const hodResult = await this.notificationService.sendNotification({
          userId: departmentHOD.id,
          type: 'workload_imbalance',
          title: this.templates.hod.workload_imbalance.title,
          message: this.interpolateTemplate(
            this.templates.hod.workload_imbalance.message,
            {
              facultyName: alert.facultyName,
              workloadType: alert.alertType
            }
          ),
          channels: this.templates.hod.workload_imbalance.channels,
          priority: 'medium'
        });
        results.push(hodResult);
      }
    }

    const success = results.some(r => r.success);
    return { success, results };
  }

  private async notifyStudentsOfPublication(
    timetable: Timetable,
    students: StakeholderGroup['students']
  ): Promise<any[]> {
    const results = [];
    // If timetable has batchId, filter by it; otherwise notify all students
    const batchStudents = (timetable as any).batchId ? 
      students.filter(s => s.batchId === (timetable as any).batchId) :
      students;
    
    // Send individual notifications to each student
    for (const student of batchStudents) {
      const result = await this.notificationService.sendNotification({
        userId: student.id,
        type: 'timetable_published',
        title: this.templates.student.timetable_published.title,
        message: this.interpolateTemplate(
          this.templates.student.timetable_published.message,
          {
            academicYear: timetable.academicYear,
            semester: timetable.semester
          }
        ),
        channels: this.templates.student.timetable_published.channels,
        priority: 'high'
      });
      results.push(result);
    }

    return results;
  }

  private async notifyFacultyOfAssignment(
    timetable: Timetable,
    faculty: StakeholderGroup['faculty']
  ): Promise<any[]> {
    const results = [];
    
    // Get faculty involved in this timetable
    const involvedFacultyIds = [...new Set(timetable.entries.map(e => e.facultyId))];
    const involvedFaculty = faculty.filter(f => involvedFacultyIds.includes(f.id));

    for (const facultyMember of involvedFaculty) {
      const facultyEntries = timetable.entries.filter(e => e.facultyId === facultyMember.id);
      const totalHours = this.calculateTotalHours(facultyEntries);

      const result = await this.notificationService.sendNotification({
        userId: facultyMember.id,
        type: 'schedule_assigned',
        title: this.templates.faculty.schedule_assigned.title,
        message: this.interpolateTemplate(
          this.templates.faculty.schedule_assigned.message,
          {
            academicYear: timetable.academicYear,
            semester: timetable.semester,
            totalHours: totalHours.toFixed(1)
          }
        ),
        channels: this.templates.faculty.schedule_assigned.channels,
        priority: 'medium'
      });
      results.push(result);
    }

    return results;
  }

  private async notifyHODsOfPublication(
    timetable: Timetable,
    hods: StakeholderGroup['hods']
  ): Promise<any[]> {
    const results = [];

    for (const hod of hods) {
      const result = await this.notificationService.sendNotification({
        userId: hod.id,
        type: 'timetable_published',
        title: this.templates.hod.approval_required.title,
        message: this.interpolateTemplate(
          this.templates.hod.approval_required.message,
          {
            batchName: timetable.batchId,
            academicYear: timetable.academicYear,
            semester: timetable.semester
          }
        ),
        channels: this.templates.hod.approval_required.channels,
        priority: 'high'
      });
      results.push(result);
    }

    return results;
  }

  private async notifyRoomManagersOfBookings(
    timetable: Timetable,
    roomManagers: StakeholderGroup['roomManagers']
  ): Promise<any[]> {
    const results = [];
    
    // Group entries by room
    const roomBookings = new Map<string, TimetableEntry[]>();
    for (const entry of timetable.entries) {
      if (entry.roomId) {
        if (!roomBookings.has(entry.roomId)) {
          roomBookings.set(entry.roomId, []);
        }
        roomBookings.get(entry.roomId)!.push(entry);
      }
    }

    for (const [roomId, entries] of roomBookings) {
      for (const manager of roomManagers) {
        for (const entry of entries) {
          const result = await this.notificationService.sendNotification({
            userId: manager.id,
            type: 'room_booking',
            title: this.templates.room_manager.booking_confirmed.title,
            message: this.interpolateTemplate(
              this.templates.room_manager.booking_confirmed.message,
              {
                roomName: roomId,
                courseName: entry.courseId,
                date: entry.dayOfWeek,
                startTime: entry.startTime,
                endTime: entry.endTime
              }
            ),
            channels: this.templates.room_manager.booking_confirmed.channels,
            priority: 'low'
          });
          results.push(result);
        }
      }
    }

    return results;
  }

  private async notifyTimeChange(
    change: TimetableChangeDetails,
    stakeholders: StakeholderGroup
  ): Promise<any[]> {
    const results = [];
    
    for (const entry of change.affectedEntries) {
      // Notify students in the batch
      const affectedStudents = stakeholders.students.filter(s => 
        // Get batch ID from entry context
        true // Placeholder - would need batch context
      );

      for (const student of affectedStudents) {
        const result = await this.notificationService.sendNotification({
          userId: student.id,
          type: 'schedule_changed',
          title: this.templates.student.schedule_changed.title,
          message: this.interpolateTemplate(
            this.templates.student.schedule_changed.message,
            {
              courseName: entry.courseId,
              changeDetails: `Time changed from ${change.oldValue} to ${change.newValue}`
            }
          ),
          channels: this.templates.student.schedule_changed.channels,
          priority: 'high'
        });
        results.push(result);
      }

      // Notify faculty
      const faculty = stakeholders.faculty.find(f => f.id === entry.facultyId);
      if (faculty) {
        const result = await this.notificationService.sendNotification({
          userId: faculty.id,
          type: 'schedule_changed',
          title: this.templates.faculty.schedule_changed.title,
          message: this.interpolateTemplate(
            this.templates.faculty.schedule_changed.message,
            {
              courseName: entry.courseId,
              oldTime: change.oldValue,
              newTime: change.newValue,
              date: entry.dayOfWeek
            }
          ),
          channels: this.templates.faculty.schedule_changed.channels,
          priority: 'high'
        });
        results.push(result);
      }
    }

    return results;
  }

  private async notifyRoomChange(
    change: TimetableChangeDetails,
    stakeholders: StakeholderGroup
  ): Promise<any[]> {
    const results = [];
    
    for (const entry of change.affectedEntries) {
      const faculty = stakeholders.faculty.find(f => f.id === entry.facultyId);
      if (faculty) {
        const result = await this.notificationService.sendNotification({
          userId: faculty.id,
          type: 'room_changed',
          title: this.templates.faculty.room_changed.title,
          message: this.interpolateTemplate(
            this.templates.faculty.room_changed.message,
            {
              courseName: entry.courseId,
              date: entry.dayOfWeek,
              oldRoom: change.oldValue,
              newRoom: change.newValue
            }
          ),
          channels: this.templates.faculty.room_changed.channels,
          priority: 'medium'
        });
        results.push(result);
      }
    }

    return results;
  }

  private async notifyFacultyChange(
    change: TimetableChangeDetails,
    stakeholders: StakeholderGroup
  ): Promise<any[]> {
    const results = [];
    
    for (const entry of change.affectedEntries) {
      // Notify students about faculty change
      const affectedStudents = stakeholders.students;
      
      for (const student of affectedStudents) {
        const result = await this.notificationService.sendNotification({
          userId: student.id,
          type: 'schedule_changed',
          title: this.templates.student.schedule_changed.title,
          message: this.interpolateTemplate(
            this.templates.student.schedule_changed.message,
            {
              courseName: entry.courseId,
              changeDetails: `Faculty changed from ${change.oldValue} to ${change.newValue}`
            }
          ),
          channels: this.templates.student.schedule_changed.channels,
          priority: 'medium'
        });
        results.push(result);
      }
    }

    return results;
  }

  private async notifyClassCancellation(
    change: TimetableChangeDetails,
    stakeholders: StakeholderGroup
  ): Promise<any[]> {
    const results = [];
    
    for (const entry of change.affectedEntries) {
      // Notify students (would need batch context)
      const affectedStudents = stakeholders.students; // Placeholder
      
      for (const student of affectedStudents) {
        const result = await this.notificationService.sendNotification({
          userId: student.id,
          type: 'class_cancelled',
          title: this.templates.student.class_cancelled.title,
          message: this.interpolateTemplate(
            this.templates.student.class_cancelled.message,
            {
              courseName: entry.courseId,
              date: entry.dayOfWeek,
              time: `${entry.startTime}-${entry.endTime}`,
              reason: change.reason || 'No reason provided'
            }
          ),
          channels: this.templates.student.class_cancelled.channels,
          priority: 'urgent'
        });
        results.push(result);
      }
    }

    return results;
  }

  private async notifyClassAddition(
    change: TimetableChangeDetails,
    stakeholders: StakeholderGroup
  ): Promise<any[]> {
    const results = [];
    
    for (const entry of change.affectedEntries) {
      // Notify students about new class
      const affectedStudents = stakeholders.students;
      
      for (const student of affectedStudents) {
        const result = await this.notificationService.sendNotification({
          userId: student.id,
          type: 'schedule_changed',
          title: this.templates.student.schedule_changed.title,
          message: this.interpolateTemplate(
            this.templates.student.schedule_changed.message,
            {
              courseName: entry.courseId,
              changeDetails: `New class added: ${change.newValue}`
            }
          ),
          channels: this.templates.student.schedule_changed.channels,
          priority: 'medium'
        });
        results.push(result);
      }
    }

    return results;
  }

  private async getAffectedStakeholders(
    entries: TimetableEntry[],
    allStakeholders: StakeholderGroup
  ): Promise<StakeholderGroup> {
    // Filter stakeholders based on affected entries
    const facultyIds = [...new Set(entries.map(e => e.facultyId))];
    const roomIds = [...new Set(entries.map(e => e.roomId).filter(Boolean))];
    
    return {
      students: allStakeholders.students, // Would need batch filtering
      faculty: allStakeholders.faculty.filter(f => facultyIds.includes(f.id)),
      hods: allStakeholders.hods, // All HODs for department oversight
      roomManagers: allStakeholders.roomManagers.filter(rm => 
        roomIds.some(roomId => roomId && rm.buildingId === roomId)
      )
    };
  }

  private calculateTotalHours(entries: TimetableEntry[]): number {
    return entries.reduce((total, entry) => {
      // If entry has duration property, use it
      if ('duration' in entry && typeof (entry as any).duration === 'number') {
        return total + (entry as any).duration / 60; // Convert minutes to hours
      }
      
      // Otherwise calculate from start/end times
      const start = new Date(`2000-01-01T${entry.startTime}`);
      const end = new Date(`2000-01-01T${entry.endTime}`);
      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
  }

  private interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key]?.toString() || '';
    });
  }

  // Utility methods for getting stakeholder data
  async getStakeholdersForTimetable(timetable: Timetable): Promise<StakeholderGroup> {
    // This would typically fetch from database
    // Placeholder implementation
    return {
      students: [],
      faculty: [],
      hods: [],
      roomManagers: []
    };
  }

  async getNotificationPreferences(userId: string): Promise<{
    enabledChannels: ('email' | 'sms' | 'push')[];
    quietHours?: { start: string; end: string };
    priority?: 'all' | 'high' | 'urgent';
  }> {
    // Implementation would fetch user preferences from database
    return {
      enabledChannels: ['email', 'push'],
      quietHours: { start: '22:00', end: '07:00' },
      priority: 'high'
    };
  }
}