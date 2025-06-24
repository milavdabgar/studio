# MongoDB Migration Plan - CORRECTED APPROACH

## 🚨 **CRITICAL INSIGHT: Test First, Migrate Later**

### **Current Reality Check:**
- **118 API endpoints** vs **27 test files** = 77% of codebase UNTESTED
- **Complex app** with unknown bugs/issues
- **Migration without tests** = Recipe for disaster

## 📋 **REVISED STRATEGY: Test-First Approach**

### **Phase 1: Comprehensive Testing (1-2 weeks)**
**Goal: Achieve 90%+ test coverage before ANY migration**

### **Phase 2: MongoDB Migration (2-3 days)**  
**Goal: Migrate with confidence using test validation**

## Phase 1: Core Academic Entities (With AI Assistance: 4-6 hours)
**Priority: HIGH** - These are critical for daily operations

### Pre-Migration Checklist:
- [ ] Run current Playwright tests → Record baseline (145/189)
- [ ] Create git branch: `feat/mongodb-migration`
- [ ] Backup current data state

### Students Migration (30 minutes with AI):
- [ ] Create StudentModel in Mongoose
- [ ] Migrate `/api/students/*` endpoints  
- [ ] Update student import/export functionality
- [ ] **RUN PLAYWRIGHT TESTS** → Verify 145+ still passing
- [ ] Fix any test failures

### Day 3-4: Faculty Migration  
- [ ] Create FacultyModel in Mongoose
- [ ] Migrate `/api/faculty/*` endpoints
- [ ] Update faculty import functionality
- [ ] Test CRUD operations

### Day 5: Programs & Batches
- [ ] Create ProgramModel and BatchModel
- [ ] Migrate respective API endpoints
- [ ] Update relationships with Students/Faculty

## Phase 2: Academic Records (Week 2)
**Priority: MEDIUM** - Important for academic tracking

### Day 1-2: Assessments & Student Scores
- [ ] Create AssessmentModel and StudentScoreModel
- [ ] Migrate assessment endpoints
- [ ] Update score tracking functionality

### Day 3-4: Course Management
- [ ] Create CourseModel and CourseOfferingModel
- [ ] Migrate course endpoints
- [ ] Update enrollment system

### Day 5: Reports Migration
- [ ] Update all report endpoints to use MongoDB aggregation
- [ ] Test report functionality

## Phase 3: Infrastructure & Admin (Week 3)
**Priority: LOW** - Nice to have, less critical

### Day 1-2: Infrastructure
- [ ] Rooms, Buildings, Room Allocations
- [ ] Migrate respective endpoints

### Day 3-4: Projects & Communication
- [ ] Projects, Project Teams, Project Locations
- [ ] Notifications, Committees

### Day 5: Final Testing & Cleanup
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation updates

## 🧪 **PHASE 1: COMPREHENSIVE TESTING (1-2 weeks)**

### **Week 1: API Testing Foundation**

#### **Day 1-2: API Endpoint Audit & Core Tests**
- [ ] **Audit all 118 API endpoints** - document what each does
- [ ] **Priority ranking**: Critical → Important → Nice-to-have
- [ ] **Write Jest tests for CRITICAL endpoints** (Users, Students, Faculty, Courses)
- [ ] **Target**: Cover top 20 most critical API endpoints

#### **Day 3-4: Business Logic & Integration Tests**  
- [ ] **Authentication flows** - login/logout/roles
- [ ] **CRUD operations** - Create, Read, Update, Delete for core entities
- [ ] **Data relationships** - Students↔Programs, Faculty↔Courses, etc.
- [ ] **Import/Export functionality** - File uploads, CSV processing

#### **Day 5: Admin & Infrastructure Tests**
- [ ] **Admin management** - Users, Roles, Settings
- [ ] **Infrastructure** - Buildings, Rooms, Allocations  
- [ ] **Reports & Analytics** - Data aggregation endpoints
- [ ] **Notifications & Communication**

### **Week 2: E2E Testing & Edge Cases**

#### **Day 1-2: Playwright E2E Tests**
- [ ] **User journeys**: Student registration → Course enrollment → Assessment
- [ ] **Admin workflows**: Create program → Add students → Generate reports  
- [ ] **Faculty workflows**: Mark attendance → Grade assessments → View analytics
- [ ] **Error scenarios**: Invalid data, permission errors, network failures

#### **Day 3-4: Performance & Load Testing**
- [ ] **API performance** - Response times under load
- [ ] **Database queries** - Optimize slow queries before migration
- [ ] **File uploads** - Large CSV imports, bulk operations
- [ ] **Concurrent users** - Multiple admin/faculty/students

#### **Day 5: Test Coverage Analysis**
- [ ] **Jest coverage report** - Target 90%+ for core modules
- [ ] **Playwright coverage** - All critical user paths covered
- [ ] **Gap analysis** - Document untested edge cases
- [ ] **Risk assessment** - Known issues/bugs documented

## 🎯 **Testing Success Criteria**
- [ ] **Jest**: 90%+ line coverage for `/src/app/api/` and `/src/lib/`
- [ ] **Playwright**: 180+ tests passing (vs current 148)
- [ ] **All critical workflows** tested end-to-end
- [ ] **Performance baseline** established
- [ ] **Known issues** documented with workarounds

---

## 🚀 **PHASE 2: MONGODB MIGRATION (2-3 days)**
*Only start this after Phase 1 is complete*

### **Pre-Migration Safety Net**
- [ ] **100% test passing** - All tests green before migration
- [ ] **Performance baseline** - Current response times documented  
- [ ] **Data backup** - Export all in-memory stores to JSON
- [ ] **Rollback plan** - Tested and documented

### **Migration Process** 
- [ ] **One entity at a time** - Students → Faculty → Programs → etc.
- [ ] **Test after each entity** - Run full test suite
- [ ] **Fix immediately** - Don't proceed if tests fail
- [ ] **Performance check** - Ensure no degradation

## 🚦 **Migration Strategy with Test Validation**

### **Step 1: Fix Existing Test Issues (15 minutes)**
- [ ] Fix roles service export issues → Get to ~100% Jest passing
- [ ] Run baseline: `npm test && npm run test:e2e`
- [ ] Record improved baseline (expecting 150+ Playwright tests passing)

### **Step 2: Test-Driven Migration**
- [ ] Migrate one entity (Students)
- [ ] Run tests immediately: `npm test && npm run test:e2e`
- [ ] Fix any regressions before moving to next entity
- [ ] Repeat pattern for each entity

### **Success Criteria**
- [ ] Jest tests: 27/27 suites passing
- [ ] Playwright tests: 150+ tests passing (maintain or improve)
- [ ] All data persists after server restart
- [ ] Performance same or better

## Risk Mitigation

### Before Starting Each Phase:
1. **Backup current data** (export all in-memory stores to JSON)
2. **Create feature branch** for the migration
3. **Set up staging environment** for testing

### During Migration:
1. **Communicate downtime** to users
2. **Keep rollback plan ready**
3. **Test each endpoint immediately after migration**

### Emergency Rollback:
1. Revert to previous commit
2. Restore in-memory data from JSON backups
3. Restart application

## Success Metrics
- [ ] All API endpoints return 200 for valid requests
- [ ] Data persists after server restart
- [ ] All E2E tests pass
- [ ] Performance is same or better than before
