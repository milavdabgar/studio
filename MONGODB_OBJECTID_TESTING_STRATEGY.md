# MongoDB ObjectId Casting Error - Testing Strategy

## Root Cause Analysis

The error was occurring because our codebase was using `$or` queries that attempted to match both custom `id` fields (strings) and MongoDB `_id` fields (ObjectIds):

```typescript
// PROBLEMATIC CODE:
ProjectEventModel.findOne({ 
  $or: [{ id: eventId }, { _id: eventId }] 
});
```

When MongoDB tries to cast string values like `"event_techfest_2024_gpp"` to ObjectId format, it fails with:
```
CastError: Cast to ObjectId failed for value "event_techfest_2024_gpp" (type string) at path "_id"
```

## Why Our Tests Didn't Catch This

### 1. **Unit Tests Only Mocked the Service Layer**
- The existing unit tests in `src/lib/api/projects.test.ts` only tested the API service layer with mocked `fetch` calls
- They never actually tested the database queries or route handlers
- The error only occurred at the MongoDB query level, not at the service layer

### 2. **E2E Tests Didn't Test the Specific Error Condition**
- E2E tests in `e2e/projects-api-comprehensive.spec.ts` tested `/api/projects/statistics` but **without the `eventId` parameter**
- The bug only triggered when using `eventId=event_techfest_2024_gpp` as a query parameter
- Most tests used existing/default data that might not trigger the specific ObjectId casting issue

### 3. **Missing API Route-Level Tests**
- There were no dedicated tests for the actual API route handlers (`route.ts` files)
- These are integration tests that would test the actual MongoDB queries with mocked data

## Fixed Tests and New Testing Strategy

### 1. **Added API Route Tests**
Created: `src/app/api/projects/statistics/__tests__/route.test.ts`

**Key Test Cases:**
- ✅ Tests the exact query pattern that was failing: `ProjectEventModel.findOne({ id: eventId })`
- ✅ Tests both with and without `eventId` parameter
- ✅ Tests error handling for non-existent events
- ✅ Tests department-wise statistics calculation
- ✅ Mocks MongoDB models properly

### 2. **Enhanced E2E Tests**
Updated: `e2e/projects-api-comprehensive.spec.ts`

**Added Test Case:**
```typescript
test('should handle project statistics endpoint with eventId filter', async ({ page }) => {
  const eventId = 'event_techfest_2024_gpp';
  const statsResponse = await page.request.get(`${API_BASE}/projects/statistics?eventId=${eventId}`);
  
  // Should not return 500 error due to ObjectId casting issue
  expect(statsResponse.status()).toBeLessThan(500);
  
  // Tests with multiple eventId formats to ensure robustness
  const otherEventIds = ['event_annual_2024', 'proj_fair_2024_ce', 'tech_expo_2025'];
  for (const eventId of otherEventIds) {
    const response = await page.request.get(`${API_BASE}/projects/statistics?eventId=${eventId}`);
    expect(response.status()).toBeLessThan(500);
  }
});
```

### 3. **Created Specialized ObjectId Casting Prevention Tests**
Created: `e2e/mongodb-objectid-casting-prevention.spec.ts`

**Purpose:** Specifically tests for ObjectId casting errors across all endpoints that were fixed.

**Test Coverage:**
- Project statistics with various eventId formats
- Project details with various projectId formats  
- Jury assignments with eventId
- Winners endpoint with eventId
- Certificates generation with eventId
- Project evaluation endpoints
- Comprehensive error detection for any remaining ObjectId issues

## Testing Best Practices Going Forward

### 1. **Three-Layer Testing Strategy**

#### Layer 1: Unit Tests (Service Layer)
- Mock external dependencies (`fetch`, etc.)
- Test business logic and data transformation
- Fast execution, good for TDD

#### Layer 2: API Route Tests (Integration)
- Test actual route handlers with mocked MongoDB
- Test database query patterns
- Test error handling and edge cases
- **Critical for catching ObjectId casting issues**

#### Layer 3: E2E Tests (End-to-End)
- Test full request/response cycle
- Test with real data and realistic scenarios
- Test edge cases with various parameter formats
- Performance and load testing

### 2. **Specific ObjectId Testing Requirements**

When creating API route tests, always include:

```typescript
// Test with realistic string-based IDs that could cause ObjectId casting errors
const problematicIds = [
  'event_techfest_2024_gpp',
  'proj_smart_waste_system_ce',
  'user_faculty_cs01_department'
];

// Verify queries use custom id field, not _id
expect(mockModel.findOne).toHaveBeenCalledWith({
  id: expectedId  // NOT { $or: [{ id: expectedId }, { _id: expectedId }] }
});
```

### 3. **CI/CD Pipeline Integration**

#### Jest API Tests (Fast)
```bash
npm test -- --testMatch="**/**/api/**/*.test.ts"
```

#### E2E Tests (Comprehensive)
```bash
npm run test:e2e -- e2e/mongodb-objectid-casting-prevention.spec.ts
```

### 4. **Test Data Strategy**

Use realistic test data that matches production patterns:
- Event IDs: `event_techfest_2024_gpp`, `event_annual_fair_2025`
- Project IDs: `proj_smartwaste_gpp`, `proj_waterpurifier_ce`
- User IDs: `user_faculty_cs01_gpp`, `user_student_2024_001`

## Lessons Learned

1. **Mock at the Right Level**: Service-layer mocks miss database query issues
2. **Test Edge Cases**: Always test with realistic parameter values that could cause type casting issues
3. **API Route Tests are Critical**: They catch integration issues that unit tests miss
4. **E2E Tests Need Specific Scenarios**: Generic tests may not trigger specific error conditions
5. **Database Schema Matters**: When using custom ID fields alongside MongoDB ObjectIds, be explicit about which field to query

## Automated Detection

Added tests that specifically look for ObjectId casting errors:

```typescript
if (response.status() === 500) {
  const errorData = await response.json();
  if (errorData.error && errorData.error.includes('Cast to ObjectId failed')) {
    throw new Error(`ObjectId casting error still present for ID: ${id}`);
  }
}
```

This ensures any future ObjectId casting issues are immediately detected in our test suite.
