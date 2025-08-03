# Role-Based Dashboard Strategy & Implementation Plan

## 📋 Executive Summary

This document outlines the strategic approach for expanding the current role-based access control (RBAC) system to support enhanced departmental management, committee oversight, and specialized role dashboards while maintaining centralized administrative control.

## 🔍 Current State Analysis

### Existing Role Structure
- **System Roles**: `admin`, `super_admin`, `student`, `faculty`, `hod`, `jury`
- **Organizational Roles**: `institute_admin`, `department_admin`, `dte_admin`, `gtu_admin`
- **Committee Roles**: `committee_admin`, `committee_convener`, `committee_co_convener`, `committee_member`
- **Specialized Roles**: `lab_assistant`, `clerical_staff`

### Current Dashboard Distribution
- **Admin Dashboard**: 30+ comprehensive features across 6 major categories
- **HOD Dashboard**: Only 2 basic pages (dashboard overview, timetable)
- **Faculty Dashboard**: Course management, workload analysis, student interaction
- **Student Dashboard**: Academic tools, assignments, results
- **Committee Dashboard**: Basic committee activities (limited implementation)

### Key Findings
1. **Feature Imbalance**: HODs currently access admin features without proper department scoping
2. **Limited Committee Integration**: Committee management exists only in admin panel
3. **Missing Specialized Workflows**: No dedicated dashboards for TPO, SSIP, Library, IT/CWAN roles
4. **Strong Foundation**: Existing RBAC system supports hierarchical access and multi-role users

## 🎯 Strategic Recommendations

### 1. Department Management Strategy: Enhanced HOD Dashboard

**Approach**: Expand HOD Dashboard + Maintain Unified Admin

**Rationale**:
- Better user experience with department-focused interfaces
- Proper access control and audit trails
- Reduced cognitive load for HODs
- Maintains institute-wide visibility for admin

**HOD Dashboard Features (Department-Scoped)**:
```
├── Department Analytics & KPIs
├── Student Management (department students only)
├── Faculty Management (department faculty only)
├── Course Offerings Management
├── Timetable Management & Approval
├── Committee Oversight (department committees)
├── Resource Allocation & Requests
├── Department-specific Reports
├── Assessment & Results Overview
├── Project Fair Coordination
└── Department Settings & Preferences
```

**Admin Dashboard Retention (Institute-wide)**:
```
├── Multi-Department Overview
├── Institute-level Configuration
├── Cross-department Analytics
├── System Administration
├── Global Settings & Policies
├── Inter-department Coordination
└── Institute-wide Reporting
```

### 2. Committee Management Strategy: Multi-Level Access

**Committee Convener Specialized Dashboards**:

**TPO (Training & Placement Office)**:
- Placement drive management
- Company coordination and communication
- Student placement tracking and analytics
- Job posting and application management
- Career guidance and counseling tools
- Industry partnership management

**SSIP (Student Startup & Innovation Policy)**:
- Innovation project tracking
- Funding application management
- Mentorship program coordination
- Patent and IP management
- Startup incubation support
- Competition and event management

**Library Management**:
- Resource catalog management
- Digital asset management
- Circulation and borrowing system
- User access and permissions
- Budget and acquisition planning
- Usage analytics and reporting

**IT/CWAN (Campus Wide Area Network)**:
- Infrastructure monitoring and management
- Support ticket system
- Network security and access control
- Hardware and software inventory
- Maintenance scheduling
- User account management

**Committee Integration Levels**:
1. **Committee Convener**: Full committee workflow management
2. **HOD Oversight**: Department committee supervision and approval
3. **Admin Management**: Institute-wide committee administration

### 3. Specialized Roles Strategy: Hybrid Role Assignment

**Recommendation**: Assign specialized roles to existing faculty members rather than creating separate users.

**Benefits**:
- Single authentication and profile management
- Role switching capabilities
- Integration with academic workflows
- Reduced administrative overhead
- Better audit trails

**Implementation Pattern**:
```typescript
Example: Faculty member assigned as TPO Convener
User Roles: ['faculty', 'tpo_convener']
Active Role Switching: faculty ↔ tpo_convener

Dashboard Access:
├── Faculty Dashboard (teaching duties)
├── TPO Dashboard (placement activities)
└── Role Switcher Component
```

## 🏗️ Detailed Implementation Plan

### Phase 1: Enhanced HOD Dashboard (Priority: High)

**Week 1-2: Foundation Setup**
- [ ] Create enhanced HOD dashboard layout structure
- [ ] Implement department-scoped data filtering middleware
- [ ] Set up HOD-specific navigation components
- [ ] Create department analytics dashboard

**Week 3-4: Core Features Migration**
- [ ] Migrate student management with department filtering
- [ ] Migrate faculty management with department scope
- [ ] Implement department-specific course offerings management
- [ ] Add department timetable management and approval workflows

**Week 5-6: Advanced Features**
- [ ] Implement committee oversight for department committees
- [ ] Add resource allocation and request management
- [ ] Create department-specific reporting system
- [ ] Implement assessment and results overview

### Phase 2: Committee Role Enhancement (Priority: Medium)

**Week 7-8: Committee Infrastructure**
- [ ] Design committee convener dashboard templates
- [ ] Implement role assignment workflows in admin panel
- [ ] Create committee-specific permission sets
- [ ] Set up committee data models and APIs

**Week 9-10: TPO Dashboard Development**
- [ ] Placement drive management system
- [ ] Company coordination workflows
- [ ] Student placement tracking
- [ ] Job posting and application management

**Week 11-12: SSIP Dashboard Development**
- [ ] Innovation project management
- [ ] Funding application workflows
- [ ] Mentorship program tools
- [ ] Competition and event management

**Week 13-14: Library & IT/CWAN Dashboards**
- [ ] Library resource management system
- [ ] IT infrastructure monitoring tools
- [ ] Support ticket management
- [ ] User access control systems

### Phase 3: Advanced Role Management (Priority: Low)

**Week 15-16: Role Management Enhancement**
- [ ] Enhanced role assignment UI in admin panel
- [ ] Temporary role assignments with expiration
- [ ] Role hierarchy and delegation workflows
- [ ] Comprehensive audit logging system

**Week 17-18: Navigation & UX Improvements**
- [ ] Enhanced role switching UI components
- [ ] Context-aware navigation menus
- [ ] Role-based feature visibility
- [ ] Mobile-responsive dashboard layouts

## 🔧 Technical Implementation Details

### Database Schema Enhancements

**Role Assignment Table**:
```typescript
interface UserRoleAssignment {
  id: string;
  userId: string;
  roleCode: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  scope?: {
    instituteId?: string;
    departmentId?: string;
    committeeId?: string;
  };
  status: 'active' | 'inactive' | 'expired';
}
```

**Committee Enhancement**:
```typescript
interface Committee {
  id: string;
  name: string;
  code: string;
  type: 'tpo' | 'ssip' | 'library' | 'it_cwan' | 'academic' | 'administrative';
  purpose: string;
  instituteId: string;
  departmentId?: string; // Department-specific committees
  convenerId?: string;
  members: CommitteeMember[];
  settings: CommitteeSettings;
  workflows: CommitteeWorkflow[];
}
```

### API Enhancements

**Department-Scoped Endpoints**:
```typescript
// HOD Dashboard APIs
GET /api/hod/students - Department students only
GET /api/hod/faculty - Department faculty only  
GET /api/hod/committees - Department committees only
GET /api/hod/analytics - Department-specific metrics

// Committee APIs
GET /api/committee/{type}/dashboard - Committee-specific data
POST /api/committee/{type}/actions - Committee workflows
GET /api/committee/{type}/reports - Committee analytics
```

### Middleware Enhancements

**Department Scoping Middleware**:
```typescript
export function withDepartmentScope(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await getCurrentUser(req);
    if (user.activeRole === 'hod') {
      req.departmentScope = user.departmentId;
    }
    return handler(req, res);
  };
}
```

## 📊 Expected Outcomes & Benefits

### For HODs
- **Focused Interface**: Department-specific data and features only
- **Better Decision Making**: Relevant analytics and insights
- **Streamlined Workflows**: Department-appropriate task management
- **Clear Responsibilities**: Defined scope of authority

### For Committee Conveners  
- **Specialized Tools**: Committee-specific workflow management
- **Integrated Experience**: Seamless switching between teaching and committee roles
- **Better Tracking**: Committee-specific analytics and reporting
- **Efficient Coordination**: Streamlined committee operations

### For Administrators
- **Maintained Oversight**: Institute-wide visibility and control
- **Delegated Responsibilities**: Appropriate distribution of management tasks
- **Better Governance**: Clear audit trails and access controls
- **Comprehensive Analytics**: Multi-level reporting and insights

### For the System
- **Scalability**: Easy addition of new roles and committees
- **Maintainability**: Clear separation of concerns
- **Security**: Proper access control and audit logging
- **User Experience**: Role-appropriate interfaces and workflows

## 🚀 Getting Started

### Immediate Next Steps
1. **Review and approve** this strategic plan
2. **Set up project structure** for enhanced HOD dashboard
3. **Create database migrations** for role assignment enhancements
4. **Begin Phase 1 implementation** with foundation setup

### Success Metrics
- **User Satisfaction**: Improved dashboard usability scores
- **Feature Adoption**: Increased usage of role-specific features
- **Administrative Efficiency**: Reduced time for department management tasks
- **System Security**: Proper access control implementation
- **Audit Compliance**: Complete activity logging and tracking

## 📚 References

- **Current RBAC Documentation**: `CLAUDE.md`
- **Database Models**: `src/lib/models/index.ts`
- **Authentication System**: `src/contexts/auth-context.tsx`
- **Current Dashboards**: `src/app/{role}/dashboard/page.tsx`
- **Role Definitions**: `src/types/entities.ts`

---

**Document Version**: 1.0  
**Last Updated**: Current Session  
**Next Review**: After Phase 1 completion


I'll commit the Phase 2 work and continue with the next phase of development.

⏺ Bash(git status)
  ⎿  On branch dev                                    
     Your branch is ahead of 'origin/dev' by 1 commit.
       (use "git push" to publish your local commits)
     … +9 lines (ctrl+r to expand)

⏺ Bash(git diff --name-only)
  ⎿  (No content)

⏺ Bash(git log --oneline -5)
  ⎿  62efa059 feat: implement comprehensive HOD dashboard system with department-scoped management
     d35fb476 fix: resolve TypeScript type issues in tests
     cedf0a0c feat: achieve 100% Jest test suite success - all 2773 tests passing\!
     … +2 lines (ctrl+r to expand)

⏺ Bash(git add src/app/committees/ src/components/committee/)
  ⎿  (No content)

⏺ Bash(git commit -m "feat: implement Phase 2 - Committee Role Enhancement with comprehensive dashboard system…)
  ⎿  [dev 87eada26] feat: implement Phase 2 - Committee Role Enhancement with comprehensive dashboard system
      5 files changed, 3090 insertions(+)
      create mode 100644 src/app/committees/it-cwan/page.tsx
     … +4 lines (ctrl+r to expand)

⏺ Bash(git status)
  ⎿  On branch dev                                     
     Your branch is ahead of 'origin/dev' by 2 commits.
       (use "git push" to publish your local commits)
     … +7 lines (ctrl+r to expand)

⏺ Great! Phase 2 has been successfully committed. Now let me continue with Phase 3: Advanced Role Management & Navigation. I'll start by implementing the role assignment workflows in the admin panel.

⏺ Update Todos
  ⎿  ☒ Create committee convener dashboard templates            
     ☒ Develop TPO Dashboard with placement management
     ☒ Develop SSIP Dashboard with innovation project management
     ☒ Create Library Dashboard with resource management
     ☒ Create IT/CWAN Dashboard with infrastructure monitoring
     ☐ Implement role assignment workflows in admin panel
     ☐ Create committee-specific permission sets
     ☐ Set up committee data models and APIs
     ☐ Create unified navigation system for role switching
     ☐ Implement role-based routing and access control

⏺ Let me check the existing admin structure first to understand how to implement role assignment workflows:

⏺ Search(pattern: "**/admin/**/*.tsx")
  ⎿  Found 65 files (ctrl+r to expand)

⏺ Perfect! I can see there's already a /admin/roles/page.tsx and /admin/committees/page.tsx. Let me examine these to understand the current structure:

⏺ Read(src/app/admin/roles/page.tsx)
  ⎿  Read 741 lines (ctrl+r to expand)

⏺ Perfect! I can see there's already a comprehensive role management system. Now let me check the committees page to understand the current structure:

⏺ Read(src/app/admin/committees/page.tsx)
  ⎿  Read 100 lines (ctrl+r to expand)

⏺ Great! Now I can see there's already a comprehensive committee management system. Let me enhance it to include role assignment workflows for the committee roles we've created. I'll add a new section to assign users to committee roles.

⏺ Write(src/app/admin/role-assignments/page.tsx)
  ⎿  Wrote 662 lines to src/app/admin/role-assignments/page.tsx                                                                                
     "use client";
     import React, { useState, useEffect, useCallback } from 'react';
     import { Button } from "@/components/ui/button";
     import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
     import { Input } from "@/components/ui/input";
     import { Label } from "@/components/ui/label";
     import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
     import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
     import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
     … +652 lines (ctrl+r to expand)
  ⎿  Claude usage limit reached. Your limit will reset at 5:30pm (Asia/Calcutta).