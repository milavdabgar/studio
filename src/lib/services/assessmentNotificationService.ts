// src/lib/services/assessmentNotificationService.ts
import type { NotificationType } from '@/types/entities';
import { notificationService as notificationApi } from '@/lib/api/notifications';

export interface AssessmentNotificationData {
  assessmentId: string;
  assessmentName: string;
  courseName: string;
  dueDate?: string;
  submissionDate?: string;
  score?: number;
  maxScore?: number;
  feedback?: string;
}

export interface AssessmentNotificationTemplates {
  newAssignment: {
    title: string;
    message: string;
    emailSubject: string;
    emailBody: string;
  };
  deadlineReminder: {
    title: string;
    message: string;
    emailSubject: string;
    emailBody: string;
  };
  gradePublished: {
    title: string;
    message: string;
    emailSubject: string;
    emailBody: string;
  };
  submissionConfirmation: {
    title: string;
    message: string;
    emailSubject: string;
    emailBody: string;
  };
  lateSubmissionWarning: {
    title: string;
    message: string;
    emailSubject: string;
    emailBody: string;
  };
}

export class AssessmentNotificationService {
  private templates: AssessmentNotificationTemplates = {
    newAssignment: {
      title: 'New Assessment Available',
      message: 'A new assessment "{assessmentName}" has been assigned in {courseName}. Due: {dueDate}',
      emailSubject: 'New Assessment: {assessmentName}',
      emailBody: `
        <h2>New Assessment Available</h2>
        <p>Hello {studentName},</p>
        <p>A new assessment has been assigned to you:</p>
        <ul>
          <li><strong>Assessment:</strong> {assessmentName}</li>
          <li><strong>Course:</strong> {courseName}</li>
          <li><strong>Due Date:</strong> {dueDate}</li>
        </ul>
        <p>Please log in to your student portal to view the details and submit your work.</p>
      `
    },
    deadlineReminder: {
      title: 'Assessment Deadline Reminder',
      message: 'Assessment "{assessmentName}" in {courseName} is due in {timeRemaining}',
      emailSubject: 'Reminder: {assessmentName} Due Soon',
      emailBody: `
        <h2>Assessment Deadline Reminder</h2>
        <p>Hello {studentName},</p>
        <p>This is a friendly reminder that your assessment is due soon:</p>
        <ul>
          <li><strong>Assessment:</strong> {assessmentName}</li>
          <li><strong>Course:</strong> {courseName}</li>
          <li><strong>Due Date:</strong> {dueDate}</li>
          <li><strong>Time Remaining:</strong> {timeRemaining}</li>
        </ul>
        <p>Don't forget to submit your work before the deadline!</p>
      `
    },
    gradePublished: {
      title: 'Assessment Graded',
      message: 'Your assessment "{assessmentName}" has been graded. Score: {score}/{maxScore}',
      emailSubject: 'Grade Available: {assessmentName}',
      emailBody: `
        <h2>Assessment Grade Published</h2>
        <p>Hello {studentName},</p>
        <p>Your assessment has been graded:</p>
        <ul>
          <li><strong>Assessment:</strong> {assessmentName}</li>
          <li><strong>Course:</strong> {courseName}</li>
          <li><strong>Score:</strong> {score}/{maxScore} ({percentage}%)</li>
        </ul>
        {feedback && '<p><strong>Feedback:</strong> {feedback}</p>'}
        <p>You can view detailed results in your student portal.</p>
      `
    },
    submissionConfirmation: {
      title: 'Submission Confirmed',
      message: 'Your submission for "{assessmentName}" has been received successfully',
      emailSubject: 'Submission Confirmed: {assessmentName}',
      emailBody: `
        <h2>Submission Confirmation</h2>
        <p>Hello {studentName},</p>
        <p>We have successfully received your submission:</p>
        <ul>
          <li><strong>Assessment:</strong> {assessmentName}</li>
          <li><strong>Course:</strong> {courseName}</li>
          <li><strong>Submitted At:</strong> {submissionDate}</li>
        </ul>
        <p>You will be notified once your assessment is graded.</p>
      `
    },
    lateSubmissionWarning: {
      title: 'Late Submission Warning',
      message: 'Assessment "{assessmentName}" in {courseName} is overdue',
      emailSubject: 'Overdue: {assessmentName}',
      emailBody: `
        <h2>Late Submission Warning</h2>
        <p>Hello {studentName},</p>
        <p>Your assessment submission is overdue:</p>
        <ul>
          <li><strong>Assessment:</strong> {assessmentName}</li>
          <li><strong>Course:</strong> {courseName}</li>
          <li><strong>Due Date:</strong> {dueDate}</li>
          <li><strong>Days Overdue:</strong> {daysOverdue}</li>
        </ul>
        <p>Please submit as soon as possible. Late submissions may receive reduced marks.</p>
      `
    }
  };

  /**
   * Send notification for a new assessment assignment
   */
  async notifyNewAssessment(
    studentId: string,
    studentName: string,
    assessmentData: AssessmentNotificationData
  ): Promise<void> {
    const template = this.templates.newAssignment;
    
    const notification = {
      userId: studentId,
      type: 'assignment_new' as NotificationType,
      message: this.formatTemplate(template.message, {
        ...assessmentData,
        studentName
      }),
      title: template.title,
      link: `/student/assessments?id=${assessmentData.assessmentId}`,
      relatedEntityId: assessmentData.assessmentId,
      relatedEntityType: 'assessment'
    };

    await notificationApi.createLegacyNotification(notification);
  }

  /**
   * Send deadline reminder notifications
   */
  async notifyDeadlineReminder(
    studentId: string,
    studentName: string,
    assessmentData: AssessmentNotificationData,
    timeRemaining: string
  ): Promise<void> {
    const template = this.templates.deadlineReminder;
    
    const notification = {
      userId: studentId,
      type: 'reminder' as NotificationType,
      message: this.formatTemplate(template.message, {
        ...assessmentData,
        studentName,
        timeRemaining
      }),
      title: template.title,
      link: `/student/assessments?id=${assessmentData.assessmentId}`,
      relatedEntityId: assessmentData.assessmentId,
      relatedEntityType: 'assessment'
    };

    await notificationApi.createLegacyNotification(notification);
  }

  /**
   * Send grade published notification
   */
  async notifyGradePublished(
    studentId: string,
    studentName: string,
    assessmentData: AssessmentNotificationData
  ): Promise<void> {
    const template = this.templates.gradePublished;
    const percentage = assessmentData.score && assessmentData.maxScore 
      ? Math.round((assessmentData.score / assessmentData.maxScore) * 100)
      : 0;
    
    const notification = {
      userId: studentId,
      type: 'assignment_graded' as NotificationType,
      message: this.formatTemplate(template.message, {
        ...assessmentData,
        studentName,
        percentage: percentage.toString()
      }),
      title: template.title,
      link: `/student/results?assessmentId=${assessmentData.assessmentId}`,
      relatedEntityId: assessmentData.assessmentId,
      relatedEntityType: 'assessment'
    };

    await notificationApi.createLegacyNotification(notification);
  }

  /**
   * Send submission confirmation
   */
  async notifySubmissionConfirmed(
    studentId: string,
    studentName: string,
    assessmentData: AssessmentNotificationData
  ): Promise<void> {
    const template = this.templates.submissionConfirmation;
    
    const notification = {
      userId: studentId,
      type: 'success' as NotificationType,
      message: this.formatTemplate(template.message, {
        ...assessmentData,
        studentName
      }),
      title: template.title,
      link: `/student/assessments?id=${assessmentData.assessmentId}`,
      relatedEntityId: assessmentData.assessmentId,
      relatedEntityType: 'assessment'
    };

    await notificationApi.createLegacyNotification(notification);
  }

  /**
   * Send late submission warning
   */
  async notifyLateSubmission(
    studentId: string,
    studentName: string,
    assessmentData: AssessmentNotificationData,
    daysOverdue: number
  ): Promise<void> {
    const template = this.templates.lateSubmissionWarning;
    
    const notification = {
      userId: studentId,
      type: 'warning' as NotificationType,
      message: this.formatTemplate(template.message, {
        ...assessmentData,
        studentName,
        daysOverdue: daysOverdue.toString()
      }),
      title: template.title,
      link: `/student/assessments?id=${assessmentData.assessmentId}`,
      relatedEntityId: assessmentData.assessmentId,
      relatedEntityType: 'assessment'
    };

    await notificationApi.createLegacyNotification(notification);
  }

  /**
   * Batch notify multiple students for new assessment
   */
  async batchNotifyNewAssessment(
    students: Array<{ id: string; name: string }>,
    assessmentData: AssessmentNotificationData
  ): Promise<void> {
    const promises = students.map(student => 
      this.notifyNewAssessment(student.id, student.name, assessmentData)
    );
    
    await Promise.allSettled(promises);
  }

  /**
   * Check for upcoming deadlines and send reminders
   */
  async checkAndSendDeadlineReminders(): Promise<void> {
    // This would be called by a cron job or scheduled task
    // Implementation would fetch assessments with upcoming deadlines
    // and send appropriate reminders to students
    
    try {
      const response = await fetch('/api/assessments?status=pending&upcomingDeadlines=true');
      const assessments = await response.json();

      for (const assessment of assessments) {
        const timeRemaining = this.calculateTimeRemaining(assessment.dueDate);
        
        // Send reminder if due within 24 hours, 3 days, or 1 week
        if (this.shouldSendReminder(assessment.dueDate)) {
          // Fetch enrolled students for this assessment
          const studentsResponse = await fetch(`/api/students?assessmentId=${assessment.id}`);
          const students = await studentsResponse.json();

          const promises = students.map((student: { id: string; displayName: string }) =>
            this.notifyDeadlineReminder(
              student.id,
              student.displayName,
              {
                assessmentId: assessment.id,
                assessmentName: assessment.name,
                courseName: assessment.courseName,
                dueDate: assessment.dueDate
              },
              timeRemaining
            )
          );

          await Promise.allSettled(promises);
        }
      }
    } catch (error) {
      console.error('Error checking deadline reminders:', error);
    }
  }

  /**
   * Format template string with data
   */
  private formatTemplate(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  /**
   * Calculate human-readable time remaining
   */
  private calculateTimeRemaining(dueDate: string): string {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Overdue';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  }

  /**
   * Determine if a reminder should be sent based on due date
   */
  private shouldSendReminder(dueDate: string): boolean {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Send reminders at 24 hours, 72 hours (3 days), and 168 hours (1 week) before due
    return diffHours <= 168 && (
      Math.abs(diffHours - 24) < 1 ||
      Math.abs(diffHours - 72) < 1 ||
      Math.abs(diffHours - 168) < 1
    );
  }
}

export const assessmentNotificationService = new AssessmentNotificationService();