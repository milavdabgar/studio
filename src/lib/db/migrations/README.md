# RBAC Database Migrations

This directory contains database migrations for the Role-Based Access Control (RBAC) system implementation. The migrations are designed to extend the existing MongoDB collections with RBAC capabilities while maintaining backward compatibility.

## Migration Files

### Migration 001: Initialize RBAC Schema Extensions
**File**: `rbac-migration-001.js`
**Purpose**: Initial RBAC implementation
**Changes**:
- Extends existing `users` collection with RBAC fields
- Extends existing `roles` collection with RBAC fields  
- Creates 9 new RBAC collections
- Adds comprehensive indexes for performance
- Creates initial permission nodes for existing roles
- Sets up TTL indexes for automatic cleanup

**Collections Created**:
- `permission_nodes` - Core permission management
- `permission_inheritance` - Permission inheritance relationships
- `dynamic_role_assignments` - Temporary and conditional role assignments
- `resource_ownership` - Resource ownership tracking
- `time_based_access` - Time-based access controls
- `ip_based_access` - IP-based access controls
- `permission_analytics` - Analytics and reporting data
- `security_events` - Security event logging
- `rbac_audit_log` - RBAC-specific audit trail

### Migration 002: Data Validation and Cleanup
**File**: `rbac-migration-002.js`
**Purpose**: Data validation, cleanup, and optimization
**Changes**:
- Validates and cleans RBAC data integrity
- Updates role analytics with current user counts
- Creates security and compliance baselines
- Optimizes collection performance with compound indexes
- Runs data consistency checks
- Creates monitoring alerts configuration
- Performs system health checks

## Migration Runner

### Usage

```bash
# Run pending migrations
npm run migrate:rbac

# Revert the last migration
npm run migrate:rbac:down

# Check migration status
npm run migrate:rbac:status

# Reset all migrations (CAUTION!)
npm run migrate:rbac:reset
```

### Direct Usage

```bash
# Using node directly
node src/lib/db/migrations/migrate-rbac.js [command]

# Available commands:
# up      - Run pending migrations (default)
# down    - Revert the last migration
# status  - Show migration status
# reset   - Revert all migrations (requires --confirm)
```

### Environment Configuration

Set the MongoDB connection string:
```bash
export MONGODB_URI="mongodb://localhost:27017/gpp-next"
```

## TypeScript Integration

### Migration Helper
**File**: `rbac-migration-helper.ts`
**Purpose**: Provides TypeScript support and utilities for RBAC migrations

**Features**:
- Type-safe collection access
- Data validation utilities
- Migration statistics tracking
- Integrity validation
- Default RBAC extension generators

**Usage**:
```typescript
import { RBACMigrationHelper } from './rbac-migration-helper';

const helper = new RBACMigrationHelper(db);
await helper.extendUsersWithRBAC();
await helper.createRBACIndexes();
const stats = helper.getStats();
```

## Migration Strategy

### Phase 1: Schema Extension (Migration 001)
1. **Non-disruptive Extension**: Adds RBAC fields to existing collections without modifying current data
2. **New Collection Creation**: Creates all RBAC-specific collections with proper validation
3. **Index Creation**: Adds performance indexes for efficient querying
4. **Initial Data**: Creates permission nodes for existing roles

### Phase 2: Data Validation (Migration 002)  
1. **Data Cleanup**: Validates and cleans inconsistent data
2. **Performance Optimization**: Adds compound indexes for better performance
3. **Baseline Creation**: Establishes security and compliance baselines
4. **Monitoring Setup**: Configures alerts and health checks

## Data Structure

### User RBAC Extensions
```typescript
interface UserWithRBAC extends User {
  rbac?: {
    riskProfile: { score: number; level: string; ... };
    accessPatterns: { loginTimes: []; ... };
    securitySettings: { mfa: {}; ... };
    rbacState: { temporaryRoles: []; ... };
    compliance: { status: string; ... };
  };
}
```

### Role RBAC Extensions
```typescript
interface RoleWithRBAC extends Role {
  rbac?: {
    properties: { inheritance: {}; assignment: {}; ... };
    analytics: { usage: {}; security: {}; ... };
    compliance: { frameworks: []; ... };
  };
}
```

## Collection Schemas

### Permission Nodes
- **Purpose**: Core permission management and inheritance
- **Key Fields**: `nodeId`, `type`, `permissions`, `inheritanceRules`
- **Indexes**: Unique nodeId, type, permissions array

### Security Events  
- **Purpose**: Security event logging and monitoring
- **Key Fields**: `eventType`, `severity`, `userId`, `timestamp`
- **Indexes**: Event type, severity, timestamp, user
- **TTL**: 2 years automatic expiration

### Dynamic Role Assignments
- **Purpose**: Temporary and conditional role assignments
- **Key Fields**: `userId`, `roleId`, `assignmentType`, `expiresAt`
- **Indexes**: User, role, status, expiration
- **TTL**: 30 days for expired assignments

## Security Considerations

### Data Protection
- Sensitive data is properly indexed but not logged in migration output
- Permission caches have automatic expiration
- Audit trails are comprehensive but performant

### Access Control
- Migration requires database admin privileges
- Backup recommended before running migrations
- Rollback capability provided for all migrations

### Compliance
- Audit logging for all migration operations
- Compliance framework baselines created
- Data retention policies implemented

## Performance Optimizations

### Indexing Strategy
- Compound indexes for common query patterns
- Background index creation to minimize impact
- TTL indexes for automatic cleanup

### Query Optimization
- Efficient lookup patterns for permission checking
- Cached permission calculations with expiration
- Batch operations for bulk updates

## Monitoring and Alerts

### Health Checks
- Data integrity validation
- Performance metrics tracking
- Collection statistics monitoring

### Alert Configuration
- High-risk user detection
- Failed authentication monitoring
- Compliance violation alerts
- Privilege escalation detection

## Rollback Procedures

### Automatic Rollback
Each migration includes a `down()` function that:
- Removes added collections
- Removes RBAC fields from existing collections
- Drops created indexes
- Cleans up migration tracking

### Manual Recovery
In case of issues:
1. Check migration status: `npm run migrate:rbac:status`
2. Review logs in the migration tracking collection
3. Use database backups if necessary
4. Contact system administrator for complex issues

## Best Practices

### Before Migration
1. **Backup Database**: Always backup before running migrations
2. **Test Environment**: Run migrations in staging first
3. **Monitor Resources**: Ensure sufficient disk space and memory

### During Migration
1. **Monitor Progress**: Watch migration output for errors
2. **Check Performance**: Monitor database performance during migration
3. **Validate Results**: Run status checks after completion

### After Migration
1. **Validate Data**: Check data integrity with provided tools
2. **Test Functionality**: Verify RBAC features work correctly
3. **Monitor Performance**: Watch for any performance degradation

## Troubleshooting

### Common Issues

**Migration Fails to Start**
- Check MongoDB connection string
- Verify database permissions
- Ensure MongoDB version compatibility

**Out of Memory During Migration**
- Increase Node.js memory limit: `--max-old-space-size=4096`
- Run migrations during low-traffic periods
- Consider running migrations in smaller batches

**Data Validation Errors**
- Check migration output for specific errors
- Use the TypeScript helper for detailed validation
- Review data consistency before migration

**Performance Issues**
- Monitor index creation progress
- Check for blocking operations
- Ensure sufficient system resources

### Support

For migration issues:
1. Check the migration logs in `rbac_migrations` collection
2. Review health check results in `rbac_health_checks` collection
3. Use the migration helper for detailed diagnostics
4. Contact the development team with specific error messages

## Version History

| Version | Date | Description | Author |
|---------|------|-------------|--------|
| 001 | 2024 | Initial RBAC schema extensions | System |
| 002 | 2024 | Data validation and optimization | System |

## Future Migrations

Planned future migrations may include:
- Advanced permission inheritance rules
- Integration with external identity providers
- Enhanced behavioral analytics
- Additional compliance frameworks
- Performance optimizations based on usage patterns