import { auditLogger, AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/lib/audit/audit-logger';

describe('Audit Logging System', () => {
  beforeEach(() => {
    // Clear any existing logs
    (auditLogger as any).logs = [];
  });

  test('should log a successful action', async () => {
    await auditLogger.logAction({
      userId: 'user_test_123',
      userEmail: 'admin@test.com',
      userRole: 'admin',
      action: AUDIT_ACTIONS.ACCESS,
      resource: AUDIT_RESOURCES.STUDENTS,
      status: 'success',
      departmentId: 'dept_cs',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test'
    });

    const logs = await auditLogger.getLogs({ limit: 10 });
    expect(logs).toHaveLength(1);
    expect(logs[0].userEmail).toBe('admin@test.com');
    expect(logs[0].action).toBe(AUDIT_ACTIONS.ACCESS);
    expect(logs[0].resource).toBe(AUDIT_RESOURCES.STUDENTS);
    expect(logs[0].status).toBe('success');
  });

  test('should log unauthorized access attempt', async () => {
    await auditLogger.logUnauthorized({
      userId: 'user_unauthorized',
      userEmail: 'student@test.com',
      userRole: 'student',
      action: AUDIT_ACTIONS.DELETE,
      resource: AUDIT_RESOURCES.FACULTY,
      departmentId: 'dept_cs'
    });

    const logs = await auditLogger.getLogs({ status: 'unauthorized' });
    expect(logs).toHaveLength(1);
    expect(logs[0].status).toBe('unauthorized');
    expect(logs[0].action).toBe(AUDIT_ACTIONS.DELETE);
  });

  test('should filter logs by department', async () => {
    // Log actions for different departments
    await auditLogger.logAccess({
      userId: 'hod_cs',
      userEmail: 'hod.cs@test.com',
      userRole: 'hod',
      resource: AUDIT_RESOURCES.STUDENTS,
      departmentId: 'dept_cs'
    });

    await auditLogger.logAccess({
      userId: 'hod_ee',
      userEmail: 'hod.ee@test.com',
      userRole: 'hod',
      resource: AUDIT_RESOURCES.STUDENTS,
      departmentId: 'dept_ee'
    });

    const csLogs = await auditLogger.getLogs({ departmentId: 'dept_cs' });
    const eeLogs = await auditLogger.getLogs({ departmentId: 'dept_ee' });

    expect(csLogs).toHaveLength(1);
    expect(eeLogs).toHaveLength(1);
    expect(csLogs[0].departmentId).toBe('dept_cs');
    expect(eeLogs[0].departmentId).toBe('dept_ee');
  });

  test('should generate audit summary correctly', async () => {
    // Create test data
    await auditLogger.logAccess({
      userId: 'admin1', userEmail: 'admin1@test.com', userRole: 'admin',
      resource: AUDIT_RESOURCES.STUDENTS
    });
    
    await auditLogger.logFailure({
      userId: 'faculty1', userEmail: 'faculty1@test.com', userRole: 'faculty',
      action: AUDIT_ACTIONS.UPDATE, resource: AUDIT_RESOURCES.COURSES
    });
    
    await auditLogger.logUnauthorized({
      userId: 'student1', userEmail: 'student1@test.com', userRole: 'student',
      action: AUDIT_ACTIONS.DELETE, resource: AUDIT_RESOURCES.FACULTY
    });

    const summary = await auditLogger.getAuditSummary();

    expect(summary.totalActions).toBe(3);
    expect(summary.successfulActions).toBe(1);
    expect(summary.failedActions).toBe(1);
    expect(summary.unauthorizedAttempts).toBe(1);
    expect(summary.actionsByRole.admin).toBe(1);
    expect(summary.actionsByRole.faculty).toBe(1);
    expect(summary.actionsByRole.student).toBe(1);
    expect(summary.recentActivity).toHaveLength(3);
  });

  test('should log CRUD operations with helper methods', async () => {
    const baseEntry = {
      userId: 'user123',
      userEmail: 'user@test.com',
      userRole: 'admin',
      resource: AUDIT_RESOURCES.PROGRAMS,
      resourceId: 'prog_123'
    };

    await auditLogger.logCreate(baseEntry);
    await auditLogger.logUpdate(baseEntry);
    await auditLogger.logDelete(baseEntry);

    const logs = await auditLogger.getLogs({ userId: 'user123' });
    expect(logs).toHaveLength(3);
    
    const actions = logs.map(log => log.action).sort();
    expect(actions).toEqual([AUDIT_ACTIONS.CREATE, AUDIT_ACTIONS.DELETE, AUDIT_ACTIONS.UPDATE]);
  });

  test('should handle date range filtering', async () => {
    const baseEntry = {
      userId: 'user123',
      userEmail: 'user@test.com',
      userRole: 'admin',
      resource: AUDIT_RESOURCES.STUDENTS
    };

    await auditLogger.logAccess(baseEntry);
    
    // Wait a small moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const hourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const logsInRange = await auditLogger.getLogs({
      startDate: hourAgo,
      endDate: hourFromNow
    });

    const logsOutOfRange = await auditLogger.getLogs({
      startDate: hourFromNow,
      endDate: new Date(hourFromNow.getTime() + 60 * 60 * 1000)
    });

    expect(logsInRange).toHaveLength(1);
    expect(logsOutOfRange).toHaveLength(0);
  });

  test('should respect limit parameter', async () => {
    const baseEntry = {
      userId: 'user123',
      userEmail: 'user@test.com',
      userRole: 'admin',
      resource: AUDIT_RESOURCES.STUDENTS
    };

    // Create 5 log entries
    for (let i = 0; i < 5; i++) {
      await auditLogger.logAccess({
        ...baseEntry,
        resourceId: `resource_${i}`
      });
    }

    const limitedLogs = await auditLogger.getLogs({ limit: 3 });
    const allLogs = await auditLogger.getLogs();

    expect(limitedLogs).toHaveLength(3);
    expect(allLogs).toHaveLength(5);
  });
});